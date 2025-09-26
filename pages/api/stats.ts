import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import DomainScrapeStat from '../../database/models/domainScrapeStat';
import verifyUser from '../../utils/verifyUser';

type StatsResponse = {
   domains?: {
      domain: string,
      total: number,
      last30Days: number,
   }[],
   totals?: {
      totalScrapes: number,
      last30Days: number,
   },
   error?: string|null,
 };

const normalizeDomain = (domain: unknown): string => {
   if (!domain) { return ''; }
   if (typeof domain === 'string') { return domain.trim(); }
   return `${domain}`.trim();
};

const aggregateStats = async (): Promise<{ domains: StatsResponse['domains'], totals: StatsResponse['totals'] }> => {
   const [domains, stats] = await Promise.all([
      Domain.findAll({ raw: true }),
      DomainScrapeStat.findAll({ raw: true }),
   ]);

   const now = new Date();
   const windowStart = new Date(now);
   windowStart.setUTCHours(0, 0, 0, 0);
   windowStart.setUTCDate(windowStart.getUTCDate() - 29);

   const map = new Map<string, { domain: string, total: number, last30Days: number }>();
   stats.forEach((record) => {
      const domainName = normalizeDomain(record.domain);
      if (!domainName) { return; }
      const key = domainName.toLowerCase();
      const entry = map.get(key) || { domain: domainName, total: 0, last30Days: 0 };
      const countValue = typeof record.count === 'number'
         ? record.count
         : parseInt(`${record.count}`, 10) || 0;
      entry.total += countValue;
      const recordDate = new Date(record.date);
      if (!Number.isNaN(recordDate.getTime()) && recordDate >= windowStart) {
         entry.last30Days += countValue;
      }
      if (!map.has(key)) {
         entry.domain = domainName;
      }
      map.set(key, entry);
   });

   const domainStats = domains.map((domain) => {
      const domainName = normalizeDomain(domain.domain);
      const key = domainName.toLowerCase();
      const entry = map.get(key);
      return {
         domain: domainName,
         total: entry?.total || 0,
         last30Days: entry?.last30Days || 0,
      };
   });

   map.forEach((entry, key) => {
      const exists = domainStats.some((item) => item.domain.trim().toLowerCase() === key);
      if (!exists) {
         domainStats.push({
            domain: entry.domain,
            total: entry.total,
            last30Days: entry.last30Days,
         });
      }
   });

   domainStats.sort((a, b) => b.total - a.total);

   const totals = Array.from(map.values()).reduce((acc, item) => ({
      totalScrapes: acc.totalScrapes + item.total,
      last30Days: acc.last30Days + item.last30Days,
   }), { totalScrapes: 0, last30Days: 0 });

   return { domains: domainStats, totals };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatsResponse>) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
   }

   await db.sync();

   try {
      const { domains, totals } = await aggregateStats();
      return res.status(200).json({ domains, totals });
   } catch (error) {
      console.log('[ERROR] Getting Stats: ', error);
      return res.status(400).json({ error: 'Error loading stats.' });
   }
}
