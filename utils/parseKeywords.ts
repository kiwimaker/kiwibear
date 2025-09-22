import Keyword from '../database/models/keyword';
import { normalizeHistory } from './history';

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
         console.log('[WARN] Failed to parse keyword settings', error);
      }
   }
   return undefined;
};

/**
 * Parses the SQL Keyword Model object to frontend consumable object.
 * Accepts both Sequelize instances and plain objects.
 * @param {Keyword[]} allKeywords - Keywords to scrape
 * @returns {KeywordType[]}
 */
const parseKeywords = (allKeywords: (Keyword|any)[]) : KeywordType[] => {
   const parsedItems = allKeywords.map((keywrd: Keyword | any) => {
      const parsedHistory = typeof keywrd.history === 'string'
         ? normalizeHistory(JSON.parse(keywrd.history))
         : normalizeHistory(keywrd.history || {});
      const parsedTags = typeof keywrd.tags === 'string' ? JSON.parse(keywrd.tags) : (keywrd.tags || []);
      const parsedLastResult = typeof keywrd.lastResult === 'string'
         ? JSON.parse(keywrd.lastResult)
         : (keywrd.lastResult || []);
      const parsedLastUpdateError = keywrd.lastUpdateError && keywrd.lastUpdateError !== 'false'
         ? (typeof keywrd.lastUpdateError === 'string'
            ? JSON.parse(keywrd.lastUpdateError)
            : keywrd.lastUpdateError)
         : false;

      return {
         ...keywrd,
         history: parsedHistory,
         tags: parsedTags,
         lastResult: parsedLastResult,
         lastUpdateError: parsedLastUpdateError,
         settings: parseKeywordSettings(keywrd.settings),
      };
   });
   return parsedItems;
};

export default parseKeywords;
