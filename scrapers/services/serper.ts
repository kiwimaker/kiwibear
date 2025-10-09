interface SerperResult {
   title: string,
   link: string,
   position: number,
   snippet?: string,
}

const parseKeywordSettings = (settings: unknown): KeywordCustomSettings | undefined => {
   if (!settings) { return undefined; }
   if (typeof settings === 'object' && !Array.isArray(settings)) {
      return settings as KeywordCustomSettings;
   }
   if (typeof settings === 'string') {
      try {
         const parsed = JSON.parse(settings);
         if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as KeywordCustomSettings;
         }
      } catch (error) {
         console.log('[WARN] Failed to parse Serper keyword settings', error);
      }
   }
   return undefined;
};

const getRequestedPages = (keyword: KeywordType): number => {
   const keywordSettings = parseKeywordSettings((keyword as any)?.settings);
   if (keywordSettings && keywordSettings.serpPages !== undefined) {
      const pages = Number(keywordSettings.serpPages);
      if (!Number.isNaN(pages) && pages > 1) {
         return Math.min(10, Math.floor(pages));
      }
   }
   if (keywordSettings?.fetchTop20) {
      return 2;
   }
   return 1;
};

const buildSerperURL = (keyword: KeywordType, settings: SettingsType, countryData: countryData, page = 1): string => {
   const country = keyword.country || 'US';
   const countryInfo = countryData[country] || countryData.US;
   const lang = countryInfo ? countryInfo[2] : 'en';
   const base = `https://google.serper.dev/search?q=${encodeURIComponent(keyword.keyword)}&gl=${country}&hl=${lang}&num=10&apiKey=${settings.scaping_api}`;
   const url = page > 1 ? `${base}&page=${page}` : base;
   console.log(`Serper URL${page > 1 ? ` (page ${page})` : ''} :`, url);
   return url;
};

const serper:ScraperSettings = {
   id: 'serper',
   name: 'Serper.dev',
   website: 'serper.dev',
   allowsCity: true,
   scrapeURL: (keyword, settings, countryData) => {
      return buildSerperURL(keyword, settings, countryData);
   },
   additionalScrapeURLs: (keyword, settings, countryData) => {
      const requestedPages = getRequestedPages(keyword);
      if (requestedPages <= 1) { return []; }
      const urls: string[] = [];
      for (let page = 2; page <= requestedPages; page += 1) {
         urls.push(buildSerperURL(keyword, settings, countryData, page));
      }
      return urls;
   },
   resultObjectKey: 'organic',
   serpExtractor: (content) => {
      const extractedResult = [];
      const results: SerperResult[] = (typeof content === 'string') ? JSON.parse(content) : content as SerperResult[];

      for (const { link, title, position, snippet } of results) {
         if (title && link) {
            extractedResult.push({
               title,
               url: link,
               position,
               snippet,
            });
         }
      }
      return extractedResult;
   },
};

export default serper;
