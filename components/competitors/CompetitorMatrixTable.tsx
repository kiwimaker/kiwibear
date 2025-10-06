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

   if (orderedKeywords.length === 0) {
      return (
         <p className='mt-6 text-sm text-gray-500'>Todavía no hay posiciones registradas. Vuelve a actualizar tus keywords para obtener datos.</p>
      );
   }

   return (
      <div className='mt-6 border border-slate-200 rounded-lg bg-white overflow-hidden'>
         <div className='overflow-x-auto'>
            <table className='min-w-full text-sm text-slate-600'>
               <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500'>
                  <tr>
                     <th className='px-4 py-3 text-left font-semibold'>Keyword</th>
                     <th className='px-4 py-3 text-left font-semibold'>{domainName || 'Dominio'}</th>
                     {competitors.map((competitor) => (
                        <th key={competitor} className='px-4 py-3 text-left font-semibold'>
                           {formatCompetitorLabel(competitor)}
                        </th>
                     ))}
                     <th className='px-4 py-3 text-left font-semibold whitespace-nowrap'>Actualizado</th>
                  </tr>
               </thead>
               <tbody>
                  {orderedKeywords.map((keyword) => {
                     const competitorEntries = competitors.map((competitor) => ({
                        name: competitor,
                        position: keyword.competitors?.[competitor]?.position,
                     }));
                     const domainBeatsCompetitors = !!(keyword.position && keyword.position > 0
                        && competitorEntries.every(({ position }) => !position || position <= 0 || keyword.position < position));
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
                           <td className='px-4 py-3 align-top'>{renderPosition(keyword.position, domainBeatsCompetitors)}</td>
                           {competitorEntries.map(({ name, position }) => (
                              <td key={`${keyword.ID}-${name}`} className='px-4 py-3 align-top'>
                                 {renderPosition(position)}
                              </td>
                           ))}
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
