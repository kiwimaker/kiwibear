import Domain from '../database/models/domain';
import { matchesDomain } from './scraper';
import { parseCompetitorsList } from './competitorsShared';

export const computeCompetitorSnapshot = (
   results: KeywordLastResult[] | string,
   competitors: string[],
): KeywordCompetitorSnapshot => {
   if (!Array.isArray(results) || competitors.length === 0) {
      return {};
   }
   const snapshot: KeywordCompetitorSnapshot = {};
   competitors.forEach((competitorDomain) => {
      const match = results.find((item) => item.url && matchesDomain(competitorDomain, item.url));
      snapshot[competitorDomain] = match
         ? { position: match.position || 0, url: match.url }
         : { position: 0 };
   });
   return snapshot;
};

const competitorsCache = new Map<string, string[]>();

export const getCompetitorsForDomain = async (domain: string): Promise<string[]> => {
   if (!domain) { return []; }
   if (competitorsCache.has(domain)) {
      return competitorsCache.get(domain) || [];
   }
   const domainRecord = await Domain.findOne({ where: { domain } });
   const competitors = parseCompetitorsList(domainRecord?.competitors || null);
   competitorsCache.set(domain, competitors);
   return competitors;
};

export const resetCompetitorsCache = () => competitorsCache.clear();
