import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../database/database';
import DomainScrapeStat from '../../../database/models/domainScrapeStat';
import verifyUser from '../../../utils/verifyUser';

type DomainStatsResponse = {
   stats?: DomainStatsType,
   reset?: {
      deleted: number,
   },
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
   let last30DaysCount = 0;
   const monthlyMap: Record<string, number> = {};

   const now = new Date();
   const windowStart = new Date(now);
   windowStart.setUTCHours(0, 0, 0, 0);
   windowStart.setUTCDate(windowStart.getUTCDate() - 29);

   records.forEach((record) => {
      const countValue = typeof record.count === 'number'
         ? record.count
         : parseInt(`${record.count}`, 10) || 0;
      total += countValue;
      const recordDate = new Date(record.date);
      const monthKey = startOfMonth(recordDate);
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + countValue;
      if (!Number.isNaN(recordDate.getTime()) && recordDate >= windowStart) {
         last30DaysCount += countValue;
      }
   });

   const monthly = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({ month, count: monthlyMap[month] }));

   return {
      total,
      last30Days: last30DaysCount,
      monthly,
   };
};

const normalizeDomain = (value: unknown): string => {
   if (!value) { return ''; }
   if (typeof value === 'string') { return value.trim(); }
   return `${value}`.trim();
};

const resetDomainStats = async (domain: string): Promise<number> => {
   const normalized = normalizeDomain(domain);
   if (!normalized) {
      throw new Error('Domain is required to reset stats');
   }
   const deleted = await DomainScrapeStat.destroy({ where: { domain: normalized } });
   return deleted;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<DomainStatsResponse>) {
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }
   if (!req.query.domain || typeof req.query.domain !== 'string') {
      return res.status(400).json({ error: 'Domain is required' });
   }

   await db.sync();

   try {
      if (req.method === 'GET') {
         const stats = await getDomainStats(req.query.domain);
         return res.status(200).json({ stats });
      }

      if (req.method === 'DELETE') {
         const deleted = await resetDomainStats(req.query.domain);
         return res.status(200).json({ reset: { deleted } });
      }

      return res.status(405).json({ error: 'Method Not Allowed' });
   } catch (error) {
      console.log('[ERROR] Domain stats handler: ', error);
      return res.status(400).json({ error: 'Error procesando estadísticas del dominio.' });
   }
}
