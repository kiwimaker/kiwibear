import { performance } from 'perf_hooks';
import { setTimeout as sleep } from 'timers/promises';
import { RefreshResult, removeFromRetryQueue, retryScrape, scrapeKeywordFromGoogle } from './scraper';
import { setHistoryEntry } from './history';
import parseKeywords from './parseKeywords';
import Keyword from '../database/models/keyword';
import { computeCompetitorSnapshot, getCompetitorsForDomain, isAutoManageTop20EnabledForDomain } from './competitors';
import DomainScrapeStat from '../database/models/domainScrapeStat';
import DomainScrapeLog from '../database/models/domainScrapeLog';

type DomainScrapeLogPayload = {
   domain: string,
   keyword: string,
   status: 'success' | 'error',
   requests: number,
   message: string,
   details?: Record<string, unknown> | null,
};

const recordDomainScrapeLog = async ({ domain, keyword, status, requests, message, details = null }: DomainScrapeLogPayload) => {
   try {
      await DomainScrapeLog.create({
         domain,
         keyword,
         status,
         requests,
         message,
         details: details ? JSON.stringify(details) : null,
      });
   } catch (error) {
      console.log('[WARN] Failed to record domain scrape log', { domain, keyword, status }, error);
   }
};

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {Keyword[]} rawkeyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshAndUpdateKeywords = async (rawkeyword:Keyword[], settings:SettingsType): Promise<KeywordType[]> => {
   const keywords:KeywordType[] = parseKeywords(rawkeyword.map((el) => el.get({ plain: true })) as any);
   if (!rawkeyword || rawkeyword.length === 0) { return []; }
   const start = performance.now();
   const updatedKeywords: KeywordType[] = [];

   if (['scrapingant', 'serpapi', 'searchapi'].includes(settings.scraper_type)) {
      const refreshedResults = await refreshParallel(keywords, settings);
      if (refreshedResults.length > 0) {
         for (const keyword of rawkeyword) {
            const refreshedkeywordData = refreshedResults.find((k) => k && k.ID === keyword.ID);
            if (refreshedkeywordData) {
               const updatedkeyword = await updateKeywordPosition(keyword, refreshedkeywordData, settings);
               updatedKeywords.push(updatedkeyword);
            }
         }
      }
   } else {
      for (const keyword of rawkeyword) {
         console.log('START SCRAPE: ', keyword.keyword);
         const updatedkeyword = await refreshAndUpdateKeyword(keyword, settings);
         updatedKeywords.push(updatedkeyword);
         if (keywords.length > 0 && settings.scrape_delay && settings.scrape_delay !== '0') {
            await sleep(parseInt(settings.scrape_delay, 10));
         }
      }
   }

   const end = performance.now();
   console.log(`time taken: ${end - start}ms`);
   return updatedKeywords;
};

const incrementDomainScrapeCount = async (domain: string, incrementBy = 1) => {
   if (!domain) {
      return;
   }
   const incrementValue = Number.isFinite(incrementBy) ? Math.floor(Math.abs(incrementBy)) : 0;
   if (incrementValue <= 0) {
      return;
   }
   try {
      const today = new Date();
      const dateKey = today.toISOString().slice(0, 10);
      const existing = await DomainScrapeStat.findOne({ where: { domain, date: dateKey } });
      if (existing) {
         await existing.increment('count', { by: incrementValue });
      } else {
         await DomainScrapeStat.create({ domain, date: dateKey, count: incrementValue });
      }
   } catch (error) {
      console.log('[WARN] Failed to increment domain scrape count', domain, error);
   }
};

/**
 * Scrape Serp for given keyword and update the position in DB.
 * @param {Keyword} keyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
const refreshAndUpdateKeyword = async (keyword: Keyword, settings: SettingsType): Promise<KeywordType> => {
   const currentkeyword = keyword.get({ plain: true });
   const refreshedkeywordData = await scrapeKeywordFromGoogle(currentkeyword, settings);
   const updatedkeyword = refreshedkeywordData ? await updateKeywordPosition(keyword, refreshedkeywordData, settings) : currentkeyword;
   return updatedkeyword;
};

/**
 * Processes the scraped data for the given keyword and updates the keyword serp position in DB.
 * @param {Keyword} keywordRaw - Keywords to Update
 * @param {RefreshResult} udpatedkeyword - scraped Data for that Keyword
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
export const updateKeywordPosition = async (keywordRaw:Keyword, udpatedkeyword: RefreshResult, settings: SettingsType): Promise<KeywordType> => {
   const keywordPrased = parseKeywords([keywordRaw.get({ plain: true })]);
      const keyword = keywordPrased[0];
      // const udpatedkeyword = refreshed;
      let updated = keyword;

      if (udpatedkeyword && keyword) {
         const newPos = udpatedkeyword.position;
         const { history } = keyword;
         const theDate = new Date();
         const dateKey = `${theDate.getFullYear()}-${theDate.getMonth() + 1}-${theDate.getDate()}`;
         let competitorSnapshot: KeywordCompetitorSnapshot | undefined;
         try {
            const competitors = await getCompetitorsForDomain(keyword.domain);
            if (competitors.length > 0 && Array.isArray(udpatedkeyword.result)) {
               const snapshot = computeCompetitorSnapshot(udpatedkeyword.result as KeywordLastResult[], competitors);
               if (snapshot && Object.keys(snapshot).length > 0) {
                  competitorSnapshot = snapshot;
               }
            }
         } catch (error) {
            console.log('[WARN] Failed to compute competitor snapshot', error);
         }

         setHistoryEntry(history, dateKey, newPos, udpatedkeyword.url, competitorSnapshot);

         const autoManageTop20 = await isAutoManageTop20EnabledForDomain(keyword.domain);
         const updatedVal = {
            position: newPos,
            updating: false,
            url: udpatedkeyword.url,
            lastResult: udpatedkeyword.result,
            history,
            lastUpdated: udpatedkeyword.error ? keyword.lastUpdated : theDate.toJSON(),
            lastUpdateError: udpatedkeyword.error
               ? JSON.stringify({ date: theDate.toJSON(), error: `${udpatedkeyword.error}`, scraper: settings.scraper_type })
               : 'false',
         };

         let settingsChanged = false;
         let nextSettings: KeywordCustomSettings | undefined;

         if (autoManageTop20) {
            const settingsSnapshot: KeywordCustomSettings = { ...(keyword.settings || {}) };
            const shouldDisableTop20 = newPos > 0 && newPos <= 7 && settingsSnapshot.fetchTop20 === true;
            const shouldEnableTop20 = (newPos === 0 || newPos > 10) && settingsSnapshot.fetchTop20 !== true;

            if (shouldDisableTop20) {
               delete settingsSnapshot.fetchTop20;
               settingsChanged = true;
            }
            if (shouldEnableTop20) {
               settingsSnapshot.fetchTop20 = true;
               settingsChanged = true;
            }

            if (settingsChanged) {
               const sanitized = Object.keys(settingsSnapshot).length > 0 ? settingsSnapshot : undefined;
               nextSettings = sanitized;
            }
         }

         // If failed, Add to Retry Queue Cron
         if (udpatedkeyword.error && settings?.scrape_retry) {
            await retryScrape(keyword.ID);
         } else {
            await removeFromRetryQueue(keyword.ID);
         }

         // Update the Keyword Position in Database
         const requestsMade = Number.isFinite(udpatedkeyword.requestsMade)
            ? udpatedkeyword.requestsMade
            : 1;

         try {
            const updatePayload: any = {
               ...updatedVal,
               lastResult: Array.isArray(udpatedkeyword.result) ? JSON.stringify(udpatedkeyword.result) : udpatedkeyword.result,
               history: JSON.stringify(history),
            };

            if (settingsChanged) {
               updatePayload.settings = nextSettings ? JSON.stringify(nextSettings) : null;
            }

            await keywordRaw.update(updatePayload);
            updated = {
               ...keyword,
               ...updatedVal,
               competitors: competitorSnapshot,
               lastUpdateError: JSON.parse(updatedVal.lastUpdateError),
               ...(settingsChanged ? { settings: nextSettings } : {}),
            };
            await incrementDomainScrapeCount(keyword.domain, requestsMade);
            await recordDomainScrapeLog({
               domain: keyword.domain,
               keyword: keyword.keyword,
               status: udpatedkeyword.error ? 'error' : 'success',
               requests: requestsMade,
               message: udpatedkeyword.error
                  ? `Error actualizando keyword: ${udpatedkeyword.error}`
                  : 'Incremento de estadísticas registrado',
               details: {
                  scraper: settings.scraper_type,
                  url: udpatedkeyword.url,
                  position: newPos,
                  increment: requestsMade,
                  retryScheduled: !!(udpatedkeyword.error && settings?.scrape_retry),
               },
            });
          } catch (error) {
            console.log('[ERROR] Updating SERP for Keyword', keyword.keyword, error);
            await recordDomainScrapeLog({
               domain: keyword.domain,
               keyword: keyword.keyword,
               status: 'error',
               requests: requestsMade,
               message: 'Error al actualizar SERP o estadísticas',
               details: {
                  scraper: settings.scraper_type,
                  error: `${error}`,
               },
            });
         }
      }

      return updated;
};

/**
 * Scrape Google Keyword Search Result in Parallel.
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshParallel = async (keywords:KeywordType[], settings:SettingsType) : Promise<RefreshResult[]> => {
   const promises: Promise<RefreshResult>[] = keywords.map((keyword) => {
      return scrapeKeywordFromGoogle(keyword, settings);
   });

   return Promise.all(promises).then((promiseData) => {
      console.log('ALL DONE!!!');
      return promiseData;
   }).catch((err) => {
      console.log(err);
      return [];
   });
};

export default refreshAndUpdateKeywords;
