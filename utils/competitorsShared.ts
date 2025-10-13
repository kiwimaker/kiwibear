const normalizeCompetitorValue = (value: unknown): string | null => {
   if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed.toLowerCase() : null;
   }
   return null;
};

export const parseCompetitorsList = (value?: string | string[] | null): string[] => {
   if (!value) { return []; }
   if (Array.isArray(value)) {
      return Array.from(new Set(value.map(normalizeCompetitorValue).filter((item): item is string => !!item)));
   }
   try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
         return Array.from(new Set(parsed.map(normalizeCompetitorValue).filter((item): item is string => !!item)));
      }
   } catch (error) {
      if (typeof value === 'string' && value.includes(',')) {
         return Array.from(new Set(value.split(',').map(normalizeCompetitorValue).filter((item): item is string => !!item)));
      }
   }
   const normalized = normalizeCompetitorValue(value);
   return normalized ? [normalized] : [];
};

const KNOWN_SECOND_LEVEL_SUFFIXES = new Set([
   'com',
   'co',
   'org',
   'net',
   'gov',
   'edu',
   'gob',
   'mil',
   'biz',
   'info',
]);

export const formatCompetitorLabel = (value: string): string => {
   if (!value) { return ''; }
   const trimmed = value.trim();
   if (!trimmed) { return ''; }

   const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
   const withoutWww = withoutProtocol.replace(/^www\./i, '');
   const host = withoutWww.split(/[/?#]/)[0];
   const partsOriginal = host.split('.').filter(Boolean);
   if (partsOriginal.length === 0) {
      return withoutWww || trimmed;
   }
   if (partsOriginal.length === 1) {
      return partsOriginal[0];
   }

   const partsLower = partsOriginal.map((part) => part.toLowerCase());
   let endIndex = partsOriginal.length - 2;
   while (endIndex > 0 && KNOWN_SECOND_LEVEL_SUFFIXES.has(partsLower[endIndex])) {
      endIndex -= 1;
   }

   return partsOriginal[Math.max(endIndex, 0)];
};
