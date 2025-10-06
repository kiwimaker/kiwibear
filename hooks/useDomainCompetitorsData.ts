import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFetchDomains } from '../services/domains';
import { useFetchKeywords } from '../services/keywords';
import { useFetchSettings } from '../services/settings';
import { parseCompetitorsList } from '../utils/competitorsShared';

type UseDomainCompetitorsDataResult = {
   appSettings: SettingsType,
   isAppSettingsLoading: boolean,
   domainsData: { domains: DomainType[] } | undefined,
   activeDomain: DomainType | null,
   keywords: KeywordType[],
   keywordsLoading: boolean,
   competitorList: string[],
   keywordsData: {
      keywords?: KeywordType[],
      competitors?: string[],
   } | undefined,
};

const useDomainCompetitorsData = (): UseDomainCompetitorsDataResult => {
   const router = useRouter();
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const appSettings: SettingsType = appSettingsData?.settings || {};

   const activeDomain: DomainType | null = useMemo(() => {
      if (domainsData?.domains && router.query?.slug) {
         return domainsData.domains.find((item: DomainType) => item.slug === router.query.slug) || null;
      }
      return null;
   }, [domainsData, router.query?.slug]);

   const { keywordsData, keywordsLoading } = useFetchKeywords(router, activeDomain?.domain || '', undefined, undefined);

   const keywords: KeywordType[] = (keywordsData && keywordsData.keywords) || [];
   const competitorsFromApi: string[] = keywordsData && Array.isArray(keywordsData.competitors) ? keywordsData.competitors : [];
   const competitorsFromDomain = activeDomain?.competitors ? parseCompetitorsList(activeDomain.competitors) : [];
   const competitorList = competitorsFromApi.length > 0 ? competitorsFromApi : competitorsFromDomain;

   return {
      appSettings,
      isAppSettingsLoading,
      domainsData,
      activeDomain,
      keywords,
      keywordsLoading,
      competitorList,
      keywordsData,
   };
};

export default useDomainCompetitorsData;
