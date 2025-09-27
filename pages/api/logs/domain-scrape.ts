import type { NextApiRequest, NextApiResponse } from 'next';
import { QueryTypes } from 'sequelize';
import db from '../../../database/database';
import DomainScrapeLog from '../../../database/models/domainScrapeLog';
import verifyUser from '../../../utils/verifyUser';

type DomainScrapeLogsResponse = {
   logs?: DomainScrapeLogType[],
   cleared?: number,
   success?: boolean,
   stats?: {
      totalCount: number,
      totalSizeBytes: number,
   },
   error?: string | null,
};

const parseLimit = (value: unknown, fallback: number, max: number): number => {
   const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);
   if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
   }
   return parsed > max ? max : parsed;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<DomainScrapeLogsResponse>) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   await db.sync();

   const where: { domain?: string } = {};
   if (req.query.domain && typeof req.query.domain === 'string') {
      where.domain = req.query.domain;
   }

   if (req.method === 'DELETE') {
      try {
         const destroyOptions = Object.keys(where).length ? { where } : { where: {} };
         const cleared = await DomainScrapeLog.destroy(destroyOptions);
         return res.status(200).json({ success: true, cleared });
      } catch (error) {
         console.log('[ERROR] Clearing domain scrape logs: ', error);
         return res.status(400).json({ error: 'Error clearing domain scrape logs.' });
      }
   }

   if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
   }

   const limit = parseLimit(req.query.limit, 50, 200);
   const hasFilter = Object.keys(where).length > 0;
   const queryWhere = hasFilter ? where : undefined;

   try {
      const [entries, totalCount, sizeResult] = await Promise.all([
         DomainScrapeLog.findAll({
            where: queryWhere,
         order: [['createdAt', 'DESC']],
            limit,
         }),
         DomainScrapeLog.count({ where: queryWhere }),
         db.query<{ totalSize: number | null }>(
            `SELECT SUM(
               LENGTH(domain)
               + LENGTH(COALESCE(keyword, ''))
               + LENGTH(status)
               + LENGTH(COALESCE(message, ''))
               + LENGTH(COALESCE(details, ''))
               + LENGTH(CAST(requests AS TEXT))
               + LENGTH(COALESCE(CAST(createdAt AS TEXT), ''))
               + LENGTH(COALESCE(CAST(updatedAt AS TEXT), ''))
            ) AS totalSize
            FROM domain_scrape_logs
            ${hasFilter ? 'WHERE domain = :domainFilter' : ''}`,
            {
               type: QueryTypes.SELECT,
               ...(hasFilter ? { replacements: { domainFilter: where.domain } } : {}),
            },
         ),
      ]);

      const logs = entries.map((entry) => {
         const plain = entry.get({ plain: true }) as DomainScrapeLogType & { details: string | null };
         let details: Record<string, unknown> | null = null;
         if (plain.details) {
            try {
               details = JSON.parse(plain.details);
            } catch (error) {
               console.log('[WARN] Failed to parse domain scrape log details', error);
            }
         }
         return {
            ID: plain.ID,
            domain: plain.domain,
            keyword: plain.keyword,
            status: plain.status as DomainScrapeLogType['status'],
            requests: plain.requests,
            message: plain.message,
            createdAt: plain.createdAt,
            details,
         } as DomainScrapeLogType;
      });

      const totalSizeBytes = Array.isArray(sizeResult) && sizeResult.length && sizeResult[0].totalSize
         ? Number(sizeResult[0].totalSize)
         : 0;

      return res.status(200).json({ logs, stats: { totalCount, totalSizeBytes } });
   } catch (error) {
      console.log('[ERROR] Getting domain scrape logs: ', error);
      return res.status(400).json({ error: 'Error loading domain scrape logs.' });
   }
}
