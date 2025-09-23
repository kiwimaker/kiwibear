export type HistoryValue = number | KeywordHistoryEntry | undefined | null;

const isObject = (value: unknown): value is Record<string, any> => {
   return typeof value === 'object' && value !== null;
};

export const toHistoryEntry = (value: HistoryValue): KeywordHistoryEntry | null => {
   if (typeof value === 'number') {
      return { position: value };
   }
   if (isObject(value) && typeof value.position === 'number') {
      const entry: KeywordHistoryEntry = { position: value.position };
      if (value.url && typeof value.url === 'string') {
         entry.url = value.url;
      }
      if (value.competitors && typeof value.competitors === 'object') {
         entry.competitors = {};
         Object.entries(value.competitors).forEach(([domain, competitorValue]) => {
            if (isObject(competitorValue) && typeof competitorValue.position === 'number') {
               entry.competitors![domain] = {
                  position: competitorValue.position,
                  ...(competitorValue.url && typeof competitorValue.url === 'string' ? { url: competitorValue.url } : {}),
               };
            }
         });
      }
      return entry;
   }
   return null;
};

export const getHistoryPosition = (value: HistoryValue): number => {
   const entry = toHistoryEntry(value);
   return entry ? entry.position : 0;
};

export const getHistoryUrl = (value: HistoryValue): string => {
   const entry = toHistoryEntry(value);
   return entry && entry.url ? entry.url : '';
};

export const normalizeHistory = (history: Record<string, HistoryValue> | null | undefined): KeywordHistory => {
   if (!history || typeof history !== 'object') {
      return {};
   }
   const normalized: KeywordHistory = {};
   Object.entries(history).forEach(([dateKey, value]) => {
      const entry = toHistoryEntry(value);
      if (entry) {
         const normalizedEntry: KeywordHistoryEntry = { position: entry.position };
         if (entry.url) {
            normalizedEntry.url = entry.url;
         }
         if (entry.competitors && Object.keys(entry.competitors).length > 0) {
            normalizedEntry.competitors = entry.competitors;
         }
         normalized[dateKey] = normalizedEntry;
      }
   });
   return normalized;
};

export const setHistoryEntry = (
   history: KeywordHistory,
   dateKey: string,
   position: number,
   url?: string,
   competitors?: KeywordCompetitorSnapshot,
) => {
   if (!dateKey) { return; }
   const entry: KeywordHistoryEntry = { position };
   if (url) {
      entry.url = url;
   }
    if (competitors && Object.keys(competitors).length > 0) {
       entry.competitors = competitors;
    }
   history[dateKey] = entry;
};

export const sortHistoryByDate = (history: KeywordHistory): { date: string, timestamp: number, entry: KeywordHistoryEntry }[] => {
   return Object.keys(history || {}).map((dateKey) => {
      const entry = history[dateKey];
      return {
         date: dateKey,
         timestamp: new Date(dateKey).getTime(),
         entry,
      };
   }).sort((a, b) => a.timestamp - b.timestamp);
};
