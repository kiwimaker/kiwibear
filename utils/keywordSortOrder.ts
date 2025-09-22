import Keyword from '../database/models/keyword';

let keywordSortOrderSupportedCache: boolean|null = null;

export const isKeywordSortOrderSupported = async (): Promise<boolean> => {
   if (keywordSortOrderSupportedCache !== null) {
      return keywordSortOrderSupportedCache;
   }
   if (!Keyword || !Keyword.sequelize) {
      keywordSortOrderSupportedCache = false;
      return keywordSortOrderSupportedCache;
   }
   try {
      const tableDescription = await Keyword.sequelize.getQueryInterface().describeTable('keyword');
      keywordSortOrderSupportedCache = !!tableDescription.sort_order;
   } catch (error) {
      console.log('[WARN] Unable to inspect keyword table for sort_order column', error);
      keywordSortOrderSupportedCache = false;
   }
   return keywordSortOrderSupportedCache;
};

export const resetKeywordSortOrderSupportCache = () => {
   keywordSortOrderSupportedCache = null;
};
