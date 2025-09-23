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

export const formatCompetitorLabel = (value: string): string => value.replace(/^https?:\/\/(www\.)?/i, '');
