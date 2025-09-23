import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import Icon from '../common/Icon';

type CompetitorKeywordsTableProps = {
   keywords: KeywordType[],
   competitor: string,
   onOpenDetails: (keyword: KeywordType) => void,
}

const formatUrl = (url?: string) => {
   if (!url) { return ''; }
   return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
};

const CompetitorKeywordsTable = ({ keywords, competitor, onOpenDetails }: CompetitorKeywordsTableProps) => {
   const rows = useMemo(() => {
      return keywords.map((keyword, index) => {
         const competitorData = keyword.competitors && keyword.competitors[competitor]
            ? keyword.competitors[competitor]
            : { position: 0 };
         const historyEntries = Object.entries(keyword.history || {});
         const bestEntry = historyEntries
            .map(([date, entry]) => ({ date, entry }))
            .filter(({ entry }) => entry?.competitors && entry.competitors[competitor])
            .map(({ entry }) => entry?.competitors?.[competitor])
            .filter((item) => item && item.position && item.position > 0)
            .sort((a, b) => (a!.position - b!.position))[0];
         return {
            keyword,
            competitorPosition: competitorData.position || 0,
            competitorUrl: competitorData.url || '',
            competitorBest: bestEntry ? bestEntry.position : 0,
            originalIndex: index,
         };
      }).sort((a, b) => a.originalIndex - b.originalIndex);
   }, [keywords, competitor]);

   if (rows.length === 0) {
      return (
         <p className='mt-6 text-sm text-gray-500'>No se encontraron keywords para este competidor.</p>
      );
   }

   return (
      <div className='mt-6 border border-slate-200 rounded-lg overflow-hidden bg-white'>
         <div
            className={[
               'hidden lg:grid grid-cols-[2.5fr_minmax(80px,0.7fr)_minmax(80px,0.7fr)_minmax(220px,1.4fr)_auto] gap-4 px-4 py-3',
               'bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500',
            ].join(' ')}
            data-testid='competitors_table_head'
         >
            <span>Keyword</span>
            <span>Posición</span>
            <span>Mejor</span>
            <span>URL</span>
            <span>Actualizado</span>
         </div>
         <div>
            {rows.map(({ keyword, competitorPosition, competitorUrl, competitorBest }) => (
               <button
                  key={`${keyword.ID}-${competitor}`}
                  className={[
                     'w-full text-left border-t border-slate-100 first:border-t-0 px-4 py-3 flex flex-col gap-2',
                     'lg:grid',
                     'lg:grid-cols-[2.5fr_minmax(80px,0.7fr)_minmax(80px,0.7fr)_minmax(220px,1.4fr)_auto]',
                     'lg:items-center hover:bg-slate-50 transition',
                  ].join(' ')}
                  onClick={() => onOpenDetails(keyword)}
                  type='button'
               >
                  <div className='flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3'>
                     <span className='font-semibold text-slate-700 flex items-center gap-2'>
                        <span className={`fflag fflag-${keyword.country} w-[18px] h-[12px]`} />
                        {keyword.keyword}
                     </span>
                     <span className='text-xs text-slate-400 flex items-center gap-2 uppercase tracking-wide'>
                        <Icon type={keyword.device === 'mobile' ? 'mobile' : 'desktop'} size={12} />
                     </span>
                  </div>
                  <span className='text-sm text-slate-600'>
                     {competitorPosition && competitorPosition > 0 ? (
                        <span className='inline-flex items-center gap-2'>
                           <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold'>
                              {competitorPosition}
                           </span>
                        </span>
                     ) : (
                        <span className='inline-flex h-6 items-center text-xs uppercase tracking-wide text-slate-400'>—</span>
                     )}
                  </span>
                  <span className='text-sm text-slate-600 hidden lg:block'>
                     {competitorBest && competitorBest > 0 ? `#${competitorBest}` : '—'}
                  </span>
                  <span className='text-xs text-slate-500 truncate lg:block'>
                     {competitorUrl ? formatUrl(competitorUrl) : '—'}
                  </span>
                  <span className='text-xs text-slate-400 flex items-center gap-1'>
                     <Icon type='date' size={12} />
                     {dayjs(keyword.lastUpdated).format('DD MMM YYYY')}
                  </span>
               </button>
            ))}
         </div>
      </div>
   );
};

export default CompetitorKeywordsTable;
