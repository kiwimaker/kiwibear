import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import DomainScrapeStat from '../../../database/models/domainScrapeStat';
import verifyUser from '../../../utils/verifyUser';

type DomainStatsResponse = {
   stats?: DomainStatsType,
   error?: string|null,
};

const startOfMonth = (date: Date): string => {
   const year = date.getFullYear();
   const month = `${date.getMonth() + 1}`.padStart(2, '0');
   return `${year}-${month}`;
};

const getDomainStats = async (domain: string): Promise<DomainStatsType> => {
   const records = await DomainScrapeStat.findAll({ where: { domain } });
   let total = 0;
   let currentMonthCount = 0;
   const monthlyMap: Record<string, number> = {};

   const now = new Date();
   const currentMonthKey = startOfMonth(now);

   records.forEach((record) => {
      total += record.count;
      const recordDate = new Date(record.date);
      const monthKey = startOfMonth(recordDate);
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + record.count;
      if (monthKey === currentMonthKey) {
         currentMonthCount += record.count;
      }
   });

   const monthly = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({ month, count: monthlyMap[month] }));

   return {
      total,
      currentMonth: currentMonthCount,
      monthly,
   };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<DomainStatsResponse>) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
   }
   if (!req.query.domain || typeof req.query.domain !== 'string') {
      return res.status(400).json({ error: 'Domain is required' });
   }

   await db.sync();

   try {
      const stats = await getDomainStats(req.query.domain);
      return res.status(200).json({ stats });
   } catch (error) {
      console.log('[ERROR] Getting Domain Stats: ', error);
      return res.status(400).json({ error: 'Error loading domain stats.' });
   }
}
