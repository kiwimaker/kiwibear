import Domain from '../database/models/domain';
import { matchesDomain } from './scraper';
import { parseCompetitorsList } from './competitorsShared';

type DomainFeatures = {
   competitors: string[],
   autoManageTop20: boolean,
};

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

const domainFeaturesCache = new Map<string, DomainFeatures>();

const buildDomainFeatures = (domainRecord: Domain | null): DomainFeatures => {
   const competitors = parseCompetitorsList(domainRecord?.competitors || null);
   const autoManageTop20 = !!domainRecord?.auto_manage_top20;
   return { competitors, autoManageTop20 };
};

const getDomainFeatures = async (domain: string): Promise<DomainFeatures> => {
   if (domainFeaturesCache.has(domain)) {
      return domainFeaturesCache.get(domain) as DomainFeatures;
   }
   const domainRecord = await Domain.findOne({ where: { domain } });
   const features = buildDomainFeatures(domainRecord);
   domainFeaturesCache.set(domain, features);
   return features;
};

export const getCompetitorsForDomain = async (domain: string): Promise<string[]> => {
   if (!domain) { return []; }
   const features = await getDomainFeatures(domain);
   return features.competitors;
};

export const isAutoManageTop20EnabledForDomain = async (domain: string): Promise<boolean> => {
   if (!domain) { return false; }
   const features = await getDomainFeatures(domain);
   return features.autoManageTop20;
};

export const resetCompetitorsCache = () => domainFeaturesCache.clear();
