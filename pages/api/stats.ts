import type { NextApiRequest, NextApiResponse } from 'next';
import { Op, fn, col } from 'sequelize';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import DomainScrapeStat from '../../database/models/domainScrapeStat';
import DomainScrapeLog from '../../database/models/domainScrapeLog';
import verifyUser from '../../utils/verifyUser';

type StatsMismatch = {
   domain: string,
   statsTotal: number,
   logsTotal: number,
   totalDiff: number,
   statsLast30Days: number,
   logsLast30Days: number,
   lastLogAt: string | null,
   possibleCause?: string,
};

type StatsDiagnostics = {
   generatedAt: string,
   mismatches: StatsMismatch[],
   totalsComparison: {
      statsTotal: number,
      logsTotal: number,
      statsLast30Days: number,
      logsLast30Days: number,
   },
   notes: string[],
};

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
   diagnostics?: StatsDiagnostics,
   error?: string|null,
 };

const normalizeDomain = (domain: unknown): string => {
   if (!domain) { return ''; }
   if (typeof domain === 'string') { return domain.trim(); }
   return `${domain}`.trim();
};

const getRollingWindowStart = () => {
   const now = new Date();
   const windowStart = new Date(now);
   windowStart.setUTCHours(0, 0, 0, 0);
   windowStart.setUTCDate(windowStart.getUTCDate() - 29);
   return windowStart;
};

const aggregateStats = async (): Promise<{ domains: StatsResponse['domains'], totals: StatsResponse['totals'] }> => {
   const [domains, stats] = await Promise.all([
      Domain.findAll({ raw: true }),
      DomainScrapeStat.findAll({ raw: true }),
   ]);

   const windowStart = getRollingWindowStart();

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

const computeDiagnostics = async (domainStats: StatsResponse['domains']): Promise<StatsDiagnostics> => {
   const normalizedStats = domainStats || [];
   const statsMap = new Map<string, { total: number, last30Days: number, label: string }>();
   normalizedStats.forEach((entry) => {
      const key = normalizeDomain(entry.domain).toLowerCase();
      if (!key) { return; }
      const label = normalizeDomain(entry.domain);
      statsMap.set(key, {
         total: entry.total || 0,
         last30Days: entry.last30Days || 0,
         label,
      });
   });

   const windowStart = getRollingWindowStart();

   const [logTotals, logWindowTotals] = await Promise.all([
      DomainScrapeLog.findAll({
         raw: true,
         attributes: [
            'domain',
            [fn('SUM', col('requests')), 'totalRequests'],
            [fn('MAX', col('createdAt')), 'lastLogAt'],
         ],
         group: ['domain'],
      }),
      DomainScrapeLog.findAll({
         raw: true,
         attributes: [
            'domain',
            [fn('SUM', col('requests')), 'windowRequests'],
         ],
         where: {
            createdAt: {
               [Op.gte]: windowStart,
            },
         },
         group: ['domain'],
      }),
   ]);

   const logTotalsMap = new Map<string, { total: number, lastLogAt: string | null, label: string }>();
   logTotals.forEach((entry: any) => {
      const domainName = normalizeDomain(entry.domain);
      const key = domainName.toLowerCase();
      if (!key) { return; }
      const totalRequests = Number(entry.totalRequests) || 0;
      const lastLogAt = entry.lastLogAt ? new Date(entry.lastLogAt).toISOString() : null;
      logTotalsMap.set(key, { total: totalRequests, lastLogAt, label: domainName });
   });

   const logWindowMap = new Map<string, number>();
   logWindowTotals.forEach((entry: any) => {
      const domainName = normalizeDomain(entry.domain);
      const key = domainName.toLowerCase();
      if (!key) { return; }
      const winTotal = Number(entry.windowRequests) || 0;
      logWindowMap.set(key, winTotal);
   });

   const mismatches: StatsMismatch[] = [];
   const unionDomains = new Set<string>();
   statsMap.forEach((_, key) => unionDomains.add(key));
   logTotalsMap.forEach((_, key) => unionDomains.add(key));

   unionDomains.forEach((key) => {
      const statsEntry = statsMap.get(key) || { total: 0, last30Days: 0, label: '' };
      const logEntry = logTotalsMap.get(key) || { total: 0, lastLogAt: null, label: '' };
      const windowLogs = logWindowMap.get(key) || 0;

      const statsTotal = statsEntry.total || 0;
      const statsLast30 = statsEntry.last30Days || 0;
      const logsTotal = logEntry.total || 0;
      const logsLast30 = windowLogs || 0;

      const totalDiff = logsTotal - statsTotal;
      const last30Diff = logsLast30 - statsLast30;
      const hasMismatch = totalDiff !== 0 || last30Diff !== 0;

      if (hasMismatch) {
         let possibleCause: string | undefined;
         if (statsTotal === 0 && logsTotal > 0) {
            possibleCause = 'No registros en domain_scrape_stats. Verifica incrementDomainScrapeCount y migraciones.';
         } else if (totalDiff > 0) {
            possibleCause = 'domain_scrape_logs tiene más peticiones que domain_scrape_stats. Revisa bloqueos o errores de escritura.';
         } else if (totalDiff < 0) {
            possibleCause = 'domain_scrape_stats suma más que los logs. Posible incremento duplicado o limpieza de logs.';
         }

         const domainLabel = statsEntry.label || logEntry.label || key;

         mismatches.push({
            domain: domainLabel,
            statsTotal,
            logsTotal,
            totalDiff,
            statsLast30Days: statsLast30,
            logsLast30Days: logsLast30,
            lastLogAt: logEntry.lastLogAt,
            possibleCause,
         });
      }
   });

   const statsTotalsAggregate = normalizedStats.reduce((acc, item) => ({
      statsTotal: acc.statsTotal + (item.total || 0),
      statsLast30Days: acc.statsLast30Days + (item.last30Days || 0),
   }), { statsTotal: 0, statsLast30Days: 0 });

   let logsTotalAggregate = 0;
   let logsLast30Aggregate = 0;
   logTotalsMap.forEach((entry) => {
      logsTotalAggregate += entry.total;
   });
   logWindowMap.forEach((value) => {
      logsLast30Aggregate += value;
   });

   const notes: string[] = [];
   if (mismatches.length === 0) {
      notes.push('No se detectaron discrepancias entre domain_scrape_stats y domain_scrape_logs.');
   } else {
      notes.push('Hay discrepancias entre domain_scrape_stats y domain_scrape_logs. Revisa los dominios listados.');
   }

   return {
      generatedAt: new Date().toISOString(),
      mismatches,
      totalsComparison: {
         statsTotal: statsTotalsAggregate.statsTotal,
         logsTotal: logsTotalAggregate,
         statsLast30Days: statsTotalsAggregate.statsLast30Days,
         logsLast30Days: logsLast30Aggregate,
      },
      notes,
   };
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
      const includeDiagnostics = req.query?.diagnostics === 'true';
      const diagnostics = includeDiagnostics ? await computeDiagnostics(domains) : undefined;
      return res.status(200).json({ domains, totals, diagnostics });
   } catch (error) {
      console.log('[ERROR] Getting Stats: ', error);
      return res.status(400).json({ error: 'Error loading stats.' });
   }
}
