import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { formatCompetitorLabel } from '../../utils/competitorsShared';
import Icon from '../common/Icon';

type CompetitorMatrixTableProps = {
   keywords: KeywordType[],
   domainName?: string,
   competitors: string[],
   onOpenDetails: (keyword: KeywordType) => void,
};

const renderPosition = (position?: number, highlight = false) => {
   if (!position || position <= 0) {
      return <span className='inline-flex h-6 items-center justify-center text-xs uppercase tracking-wide text-slate-400'>—</span>;
   }
   const highlightClasses = highlight ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
   return (
      <span
         className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${highlightClasses}`}
      >
         {position}
      </span>
   );
};

const CompetitorMatrixTable = ({ keywords, domainName, competitors, onOpenDetails }: CompetitorMatrixTableProps) => {
   const orderedKeywords = useMemo(() => keywords.slice().sort((a, b) => {
      if (a.sortOrder != null && b.sortOrder != null) {
         return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      if (a.sortOrder != null) { return -1; }
      if (b.sortOrder != null) { return 1; }
      return a.keyword.localeCompare(b.keyword);
   }), [keywords]);

   const bestPositionCounts = useMemo(() => {
      const counts = competitors.reduce<Record<string, number>>((acc, name) => ({ ...acc, [name]: 0 }), {});
      let domainCount = 0;
      orderedKeywords.forEach((keyword) => {
         const competitorPositions = competitors.map((competitor) => keyword.competitors?.[competitor]?.position || 0);
         const allPositions = [
            keyword.position && keyword.position > 0 ? keyword.position : null,
            ...competitorPositions.map((position) => (position && position > 0 ? position : null)),
         ].filter((value): value is number => value !== null);
         if (allPositions.length === 0) { return; }
         const bestPosition = Math.min(...allPositions);
         if (keyword.position && keyword.position === bestPosition) {
            domainCount += 1;
         }
         competitors.forEach((competitor, index) => {
            const position = competitorPositions[index];
            if (position && position === bestPosition) {
               counts[competitor] = (counts[competitor] || 0) + 1;
            }
         });
      });
      return { domainCount, counts };
   }, [orderedKeywords, competitors]);

   if (orderedKeywords.length === 0) {
      return (
         <p className='mt-6 text-sm text-gray-500'>Todavía no hay posiciones registradas. Vuelve a actualizar tus keywords para obtener datos.</p>
      );
   }

   const formattedDomainLabel = domainName ? formatCompetitorLabel(domainName) : 'Dominio';

   return (
      <div className='mt-6 border border-slate-200 rounded-lg bg-white overflow-hidden'>
         <div className='overflow-x-auto'>
            <table className='min-w-full text-sm text-slate-600'>
               <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  <tr>
                     <th className='px-4 py-3 text-left font-semibold'>Keyword</th>
                     <th className='px-4 py-3 text-left font-semibold'>
                        <span className='inline-flex items-center gap-2 text-[11px] leading-tight'>
                           <span className='whitespace-nowrap' title={domainName}>{formattedDomainLabel}</span>
                           {bestPositionCounts.domainCount > 0 && (
                              <span
                                 className='inline-flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full
                                 bg-green-100 text-green-700 text-xs font-semibold'
                              >
                                 {bestPositionCounts.domainCount}
                              </span>
                           )}
                        </span>
                     </th>
                     {competitors.map((competitor) => {
                        const bestCount = bestPositionCounts.counts[competitor] || 0;
                        const formattedLabel = formatCompetitorLabel(competitor);
                        return (
                           <th key={competitor} className='px-4 py-3 text-left font-semibold'>
                              <span className='inline-flex items-center gap-2 text-[11px] leading-tight'>
                                 <span className='whitespace-nowrap' title={competitor}>{formattedLabel}</span>
                                 {bestCount > 0 && (
                                    <span
                                       className='inline-flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full
                                       bg-green-100 text-green-700 text-xs font-semibold'
                                    >
                                       {bestCount}
                                    </span>
                                 )}
                              </span>
                           </th>
                        );
                     })}
                     <th className='px-4 py-3 text-left font-semibold whitespace-nowrap'>Actualizado</th>
                  </tr>
               </thead>
               <tbody>
                  {orderedKeywords.map((keyword) => {
                     const competitorEntries = competitors.map((competitor) => ({
                        name: competitor,
                        position: keyword.competitors?.[competitor]?.position,
                     }));
                     const allPositions = [
                        keyword.position && keyword.position > 0 ? keyword.position : null,
                        ...competitorEntries.map(({ position }) => (position && position > 0 ? position : null)),
                     ].filter((value): value is number => value !== null);
                     const bestPosition = allPositions.length > 0 ? Math.min(...allPositions) : null;
                     const domainIsBest = !!(bestPosition && keyword.position && keyword.position === bestPosition);
                     return (
                        <tr
                           key={keyword.ID}
                           className='border-t border-slate-100 hover:bg-slate-50 transition cursor-pointer'
                           onClick={() => onOpenDetails(keyword)}
                        >
                           <td className='px-4 py-3 align-top'>
                              <div className='flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3'>
                                 <span className='font-semibold text-slate-700 flex items-center gap-2'>
                                    <span className={`fflag fflag-${keyword.country} w-[18px] h-[12px]`} />
                                    {keyword.keyword}
                                 </span>
                                 <span className='text-xs text-slate-400 flex items-center gap-2 uppercase tracking-wide'>
                                    <Icon type={keyword.device === 'mobile' ? 'mobile' : 'desktop'} size={12} />
                                 </span>
                              </div>
                           </td>
                           <td className='px-4 py-3 align-top'>{renderPosition(keyword.position, domainIsBest)}</td>
                           {competitorEntries.map(({ name, position }) => {
                              const competitorIsBest = !!(bestPosition && position && position === bestPosition);
                              return (
                                 <td key={`${keyword.ID}-${name}`} className='px-4 py-3 align-top'>
                                    {renderPosition(position, competitorIsBest)}
                                 </td>
                              );
                           })}
                           <td className='px-4 py-3 align-top text-xs text-slate-400'>
                              <span className='inline-flex items-center gap-1'>
                                 <Icon type='date' size={12} />
                                 {dayjs(keyword.lastUpdated).format('DD MMM YYYY')}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default CompetitorMatrixTable;
