import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import DomainScrapeStat from '../../database/models/domainScrapeStat';
import verifyUser from '../../utils/verifyUser';

 type StatsResponse = {
   domains?: {
      domain: string,
      total: number,
      currentMonth: number,
   }[],
   totals?: {
      totalScrapes: number,
      currentMonth: number,
   },
   error?: string|null,
 };

const startOfMonth = (date: Date): string => {
   const year = date.getFullYear();
   const month = `${date.getMonth() + 1}`.padStart(2, '0');
   return `${year}-${month}`;
};

const aggregateStats = async (): Promise<{ domains: StatsResponse['domains'], totals: StatsResponse['totals'] }> => {
   const [domains, stats] = await Promise.all([
      Domain.findAll(),
      DomainScrapeStat.findAll(),
   ]);

   const now = new Date();
   const currentMonthKey = startOfMonth(now);

   const map = new Map<string, { total: number, currentMonth: number }>();
   stats.forEach((record) => {
      const key = startOfMonth(new Date(record.date));
      const entry = map.get(record.domain) || { total: 0, currentMonth: 0 };
      entry.total += record.count;
      if (key === currentMonthKey) {
         entry.currentMonth += record.count;
      }
      map.set(record.domain, entry);
   });

   const domainStats = domains.map((domain) => {
      const entry = map.get(domain.domain) || { total: 0, currentMonth: 0 };
      return {
         domain: domain.domain,
         total: entry.total,
         currentMonth: entry.currentMonth,
      };
   }).sort((a, b) => b.total - a.total);

   const totals = domainStats.reduce((acc, item) => ({
      totalScrapes: acc.totalScrapes + item.total,
      currentMonth: acc.currentMonth + item.currentMonth,
   }), { totalScrapes: 0, currentMonth: 0 });

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
