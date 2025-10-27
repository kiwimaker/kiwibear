import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import Keyword from '../../database/models/keyword';
import Domain from '../../database/models/domain';
import { getAppSettings } from './settings';
import verifyUser from '../../utils/verifyUser';
import parseKeywords from '../../utils/parseKeywords';
import { integrateKeywordSCData, readLocalSCData } from '../../utils/searchConsole';
import refreshAndUpdateKeywords from '../../utils/refresh';
import { getKeywordsVolume, updateKeywordsVolumeData } from '../../utils/adwords';
import { getHistoryPosition, getHistoryUrl, sortHistoryByDate } from '../../utils/history';
import { computeCompetitorSnapshot } from '../../utils/competitors';
import { parseCompetitorsList } from '../../utils/competitorsShared';
import { isKeywordSortOrderSupported } from '../../utils/keywordSortOrder';

type KeywordsGetResponse = {
   keywords?: KeywordType[],
   competitors?: string[],
   sortOrderSupported?: boolean,
   error?: string|null,
}

type KeywordsDeleteRes = {
   domainRemoved?: number,
   keywordsRemoved?: number,
   error?: string|null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const authorized = verifyUser(req, res);
   if (authorized !== 'authorized') {
      return res.status(401).json({ error: authorized });
   }

   if (req.method === 'GET') {
      return getKeywords(req, res);
   }
   if (req.method === 'POST') {
      return addKeywords(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteKeywords(req, res);
   }
   if (req.method === 'PUT') {
      return updateKeywords(req, res);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

const getKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ error: 'Domain is Required!' });
   }
   const settings = await getAppSettings();
   const domain = (req.query.domain as string);
   const integratedSC = process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL;
   const { search_console_client_email, search_console_private_key } = settings;
   const domainSCData = integratedSC || (search_console_client_email && search_console_private_key) ? await readLocalSCData(domain) : false;

   try {
      const supportsSortOrder = await isKeywordSortOrderSupported();
      const domainRecord = await Domain.findOne({ where: { domain } });
      const competitorsList = parseCompetitorsList(domainRecord?.competitors || null);
      const findQuery: any = { where: { domain } };
      if (supportsSortOrder && Keyword.sequelize) {
         const literalOrder = Keyword.sequelize.literal('CASE WHEN sort_order IS NULL THEN 999999 ELSE sort_order END');
         findQuery.order = [[literalOrder, 'ASC'], ['added', 'DESC']];
      } else {
         findQuery.order = [['added', 'DESC']];
      }
      const allKeywords:Keyword[] = await Keyword.findAll(findQuery);
      const keywords: KeywordType[] = parseKeywords(allKeywords.map((e) => e.get({ plain: true })));
      const processedKeywords = keywords.map((keyword) => {
         const historySorted = sortHistoryByDate(keyword.history);
         const lastWeekHistory :KeywordHistory = {};
         historySorted.slice(-7).forEach((item) => {
            const { date, entry } = item;
            const position = getHistoryPosition(entry);
            const url = getHistoryUrl(entry);
            const historyEntry: KeywordHistoryEntry = url ? { position, url } : { position };
            if (entry?.competitors && Object.keys(entry.competitors).length > 0) {
               historyEntry.competitors = entry.competitors;
            }
            lastWeekHistory[date] = historyEntry;
         });
         const domainMatches = Array.isArray(keyword.lastResult)
            ? keyword.lastResult.filter((item) => item?.matchesDomain).length
            : 0;
         const competitorSnapshot = competitorsList.length > 0 && Array.isArray(keyword.lastResult)
            ? computeCompetitorSnapshot(keyword.lastResult, competitorsList)
            : {};

         // Detect cannibalization and get last URL
         let cannibalization = false;
         let lastUrl: string | undefined;
         if (Array.isArray(keyword.lastResult)) {
            const domainResults = keyword.lastResult.filter((item) => item?.matchesDomain);
            if (domainResults.length > 0) {
               // Get first matching URL as last URL
               lastUrl = domainResults[0]?.url || undefined;
               // Check for cannibalization (more than 1 unique URL from same domain)
               const uniqueUrls = new Set(domainResults.map((item) => item.url).filter(Boolean));
               cannibalization = uniqueUrls.size > 1;
            }
         }

         let primaryResult: KeywordLastResult | undefined;
         if (Array.isArray(keyword.lastResult) && keyword.lastResult.length > 0) {
            const domainResult = keyword.lastResult.find((item) => item?.matchesDomain);
            primaryResult = domainResult || keyword.lastResult[0];
         }
         const metaTitle = primaryResult?.title;
         const metaDescription = primaryResult?.snippet;

         const keywordWithSlimHistory = {
            ...keyword,
            domainMatches,
            cannibalization,
            lastUrl,
            lastResult: [],
            history: lastWeekHistory,
            competitors: competitorSnapshot,
            metaTitle,
            metaDescription,
         };
         const finalKeyword = domainSCData ? integrateKeywordSCData(keywordWithSlimHistory, domainSCData) : keywordWithSlimHistory;
         if (competitorsList.length > 0) {
            finalKeyword.competitors = competitorSnapshot;
         }
         return finalKeyword;
      });
      return res.status(200).json({ keywords: processedKeywords, competitors: competitorsList, sortOrderSupported: supportsSortOrder });
   } catch (error) {
      console.log('[ERROR] Getting Domain Keywords for ', domain, error);
      return res.status(400).json({ error: 'Error Loading Keywords for this Domain.' });
   }
};

const addKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   const { keywords } = req.body;
   if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      const keywordsToAdd: any[] = []; // QuickFIX for bug: https://github.com/sequelize/sequelize-typescript/issues/936
      const supportsSortOrder = await isKeywordSortOrderSupported();
      const domainOrderCounters: Record<string, number> = {};

      if (supportsSortOrder) {
         const uniqueDomains = Array.from(new Set((keywords as KeywordAddPayload[]).map((item) => item.domain)));
         for (const domainName of uniqueDomains) {
            const maxOrder: number|null = await Keyword.max('sort_order', { where: { domain: domainName } });
            const parsedMax = typeof maxOrder === 'number' && Number.isFinite(maxOrder) ? maxOrder : 0;
            domainOrderCounters[domainName] = parsedMax;
         }
      }

      for (const kwrd of keywords as KeywordAddPayload[]) {
         const { keyword, device, country, domain, tags, city, fetchTop20 } = kwrd;
         const tagsArray = tags ? tags.split(',').map((item:string) => item.trim()) : [];
         const keywordSettings = fetchTop20 ? { fetchTop20: true } : undefined;
         const newKeyword: any = {
            keyword,
            device,
            domain,
            country,
            city,
            position: 0,
            updating: true,
            history: JSON.stringify({}),
            url: '',
            tags: JSON.stringify(tagsArray),
            sticky: false,
            lastUpdated: new Date().toJSON(),
            added: new Date().toJSON(),
            settings: keywordSettings ? JSON.stringify(keywordSettings) : null,
         };
         if (supportsSortOrder) {
            const nextSortOrder = (domainOrderCounters[domain] || 0) + 1;
            domainOrderCounters[domain] = nextSortOrder;
            newKeyword.sort_order = nextSortOrder;
         }
         keywordsToAdd.push(newKeyword);
      }

      try {
         const newKeywords:Keyword[] = await Keyword.bulkCreate(keywordsToAdd);
         const formattedkeywords = newKeywords.map((el) => el.get({ plain: true }));
         const keywordsParsed: KeywordType[] = parseKeywords(formattedkeywords);

         // Queue the SERP Scraping Process
         const settings = await getAppSettings();
         refreshAndUpdateKeywords(newKeywords, settings);

         // Update the Keyword Volume
         const { adwords_account_id, adwords_client_id, adwords_client_secret, adwords_developer_token } = settings;
         if (adwords_account_id && adwords_client_id && adwords_client_secret && adwords_developer_token) {
            const keywordsVolumeData = await getKeywordsVolume(keywordsParsed);
            if (keywordsVolumeData.volumes !== false) {
               await updateKeywordsVolumeData(keywordsVolumeData.volumes);
            }
         }

         return res.status(201).json({ keywords: keywordsParsed });
      } catch (error) {
         console.log('[ERROR] Adding New Keywords ', error);
         return res.status(400).json({ error: 'Could Not Add New Keyword!' });
      }
   } else {
      return res.status(400).json({ error: 'Necessary Keyword Data Missing' });
   }
};

const deleteKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsDeleteRes>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   console.log('req.query.id: ', req.query.id);

   try {
      const keywordsToRemove = (req.query.id as string).split(',').map((item) => parseInt(item, 10));
      const removeQuery = { where: { ID: { [Op.in]: keywordsToRemove } } };
      const removedKeywordCount: number = await Keyword.destroy(removeQuery);
      return res.status(200).json({ keywordsRemoved: removedKeywordCount });
   } catch (error) {
      console.log('[ERROR] Removing Keyword. ', error);
      return res.status(400).json({ error: 'Could Not Remove Keyword!' });
   }
};

const updateKeywords = async (req: NextApiRequest, res: NextApiResponse<KeywordsGetResponse>) => {
   if (!req.query.id && typeof req.query.id !== 'string') {
      return res.status(400).json({ error: 'keyword ID is Required!' });
   }
   const keywordIDs = (req.query.id as string).split(',').map((item) => parseInt(item, 10));
   const { sticky, tags, settings: settingsPayload } = req.body;
   const hasSticky = sticky !== undefined;
   const hasTags = tags !== undefined;
   const hasSettings = Object.prototype.hasOwnProperty.call(req.body, 'settings');

   if (!hasSticky && !hasTags && !hasSettings) {
      return res.status(400).json({ error: 'keyword Payload Missing!' });
   }

   try {
      let keywords: KeywordType[] = [];
      if (hasSticky) {
         await Keyword.update({ sticky }, { where: { ID: { [Op.in]: keywordIDs } } });
         const updateQuery = { where: { ID: { [Op.in]: keywordIDs } } };
         const updatedKeywords:Keyword[] = await Keyword.findAll(updateQuery);
         const formattedKeywords = updatedKeywords.map((el) => el.get({ plain: true }));
          keywords = parseKeywords(formattedKeywords);
         return res.status(200).json({ keywords });
      }
      if (hasTags && tags) {
         const tagsKeywordIDs = Object.keys(tags);
         const multipleKeywords = tagsKeywordIDs.length > 1;
         for (const keywordID of tagsKeywordIDs) {
            const selectedKeyword = await Keyword.findOne({ where: { ID: keywordID } });
            const currentTags = selectedKeyword && selectedKeyword.tags ? JSON.parse(selectedKeyword.tags) : [];
            const mergedTags = Array.from(new Set([...currentTags, ...tags[keywordID]]));
            if (selectedKeyword) {
               await selectedKeyword.update({ tags: JSON.stringify(multipleKeywords ? mergedTags : tags[keywordID]) });
            }
         }
         return res.status(200).json({ keywords });
      }
      if (hasSettings) {
         if (settingsPayload && typeof settingsPayload !== 'object') {
            return res.status(400).json({ error: 'Invalid settings payload!' });
         }
         const fetchSettings = settingsPayload as KeywordCustomSettings | undefined;
         const keywordsToUpdate:Keyword[] = await Keyword.findAll({ where: { ID: { [Op.in]: keywordIDs } } });
         const parsedKeywords = parseKeywords(keywordsToUpdate.map((item) => item.get({ plain: true })));
         const keywordMap = new Map<number, Keyword>(keywordsToUpdate.map((item) => [item.ID, item]));

         for (const parsedKeyword of parsedKeywords) {
            const keywordInstance = keywordMap.get(parsedKeyword.ID);
            if (keywordInstance) {
               const nextSettings: KeywordCustomSettings = { ...(parsedKeyword.settings || {}) };
               let settingsChanged = false;

               if (fetchSettings && Object.prototype.hasOwnProperty.call(fetchSettings, 'fetchTop20')) {
                  const enableTop20 = fetchSettings.fetchTop20 === true;
                  if (enableTop20 && nextSettings.fetchTop20 !== true) {
                     nextSettings.fetchTop20 = true;
                     settingsChanged = true;
                  }
                  if (!enableTop20 && nextSettings.fetchTop20 === true) {
                     delete nextSettings.fetchTop20;
                     settingsChanged = true;
                  }
               }

               if (fetchSettings) {
                  const entries = Object.entries(fetchSettings)
                     .filter(([settingKey]) => settingKey !== 'fetchTop20');
                  for (const [key, value] of entries) {
                     const typedKey = key as keyof KeywordCustomSettings;
                     if (typedKey === 'serpPages') {
                        if (value === undefined || value === null) {
                           if (typeof nextSettings.serpPages !== 'undefined') {
                              delete nextSettings.serpPages;
                              settingsChanged = true;
                           }
                        } else if (typeof value === 'number' && nextSettings.serpPages !== value) {
                           nextSettings.serpPages = value;
                           settingsChanged = true;
                        }
                     } else if (value === undefined || value === null) {
                        if (typedKey in nextSettings) {
                           delete nextSettings[typedKey];
                           settingsChanged = true;
                        }
                     } else if (nextSettings[typedKey] !== value) {
                        const typedValue = value as KeywordCustomSettings[keyof KeywordCustomSettings];
                        (nextSettings as Record<string, KeywordCustomSettings[keyof KeywordCustomSettings]>)[typedKey] = typedValue;
                        settingsChanged = true;
                     }
                  }
               }

               const sanitizedSettings = Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
               if (settingsChanged) {
                  await keywordInstance.update({ settings: sanitizedSettings ? JSON.stringify(sanitizedSettings) : null });
               }
            }
         }

         if (keywordIDs.length > 0) {
            const updatedKeywords = await Keyword.findAll({ where: { ID: { [Op.in]: keywordIDs } } });
            const formattedKeywords = updatedKeywords.map((el) => el.get({ plain: true }));
            keywords = parseKeywords(formattedKeywords);
         }
         return res.status(200).json({ keywords });
      }
      return res.status(400).json({ error: 'Invalid Payload!' });
   } catch (error) {
      console.log('[ERROR] Updating Keyword. ', error);
      return res.status(200).json({ error: 'Error Updating keywords!' });
   }
};
