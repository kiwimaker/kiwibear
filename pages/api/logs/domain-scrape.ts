import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import DomainScrapeLog from '../../../database/models/domainScrapeLog';
import verifyUser from '../../../utils/verifyUser';

type DomainScrapeLogsResponse = {
   logs?: DomainScrapeLogType[],
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
   if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
   }

   await db.sync();

   const limit = parseLimit(req.query.limit, 50, 200);
   const where: { domain?: string } = {};
   if (req.query.domain && typeof req.query.domain === 'string') {
      where.domain = req.query.domain;
   }

   try {
      const entries = await DomainScrapeLog.findAll({
         where: Object.keys(where).length ? where : undefined,
         order: [['createdAt', 'DESC']],
         limit,
      });

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

      return res.status(200).json({ logs });
   } catch (error) {
      console.log('[ERROR] Getting domain scrape logs: ', error);
      return res.status(400).json({ error: 'Error loading domain scrape logs.' });
   }
}
