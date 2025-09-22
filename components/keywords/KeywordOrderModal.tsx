import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';

const sortKeywordsByOrder = (keywords: KeywordType[]): KeywordType[] => {
   const sorted = [...keywords];
   return sorted.sort((a, b) => {
      const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
         return aOrder - bOrder;
      }
      const aDate = new Date(a.added).getTime();
      const bDate = new Date(b.added).getTime();
      return aDate - bDate;
   });
};

type KeywordOrderModalProps = {
   keywords: KeywordType[],
   device: string,
   closeModal: () => void,
   isSaving: boolean,
   onSave: (orderMap: { [id:number]: number }) => void,
}

const KeywordOrderModal = ({ keywords, device, closeModal, isSaving, onSave }: KeywordOrderModalProps) => {
   const sortedKeywords = useMemo(() => sortKeywordsByOrder(keywords), [keywords]);
   const [orderedKeywords, setOrderedKeywords] = useState<KeywordType[]>(sortedKeywords);

   useEffect(() => {
      setOrderedKeywords(sortedKeywords);
   }, [sortedKeywords]);

   const moveKeyword = (currentIndex: number, targetIndex: number) => {
      setOrderedKeywords((prev) => {
         if (targetIndex < 0 || targetIndex >= prev.length) { return prev; }
         const updated = [...prev];
         const [item] = updated.splice(currentIndex, 1);
         updated.splice(targetIndex, 0, item);
         return updated;
      });
   };

   const resetOrder = () => {
      setOrderedKeywords(sortedKeywords);
   };

   const handleSave = () => {
      const orderMap: { [id:number]: number } = {};
      orderedKeywords.forEach((keyword, index) => {
         orderMap[keyword.ID] = index + 1;
      });
      onSave(orderMap);
   };

   const hasChanges = useMemo(() => {
      if (orderedKeywords.length !== sortedKeywords.length) { return true; }
      return orderedKeywords.some((keyword, index) => keyword.ID !== sortedKeywords[index].ID);
   }, [orderedKeywords, sortedKeywords]);

   const primaryButtonClass = hasChanges
      ? 'bg-blue-700 hover:bg-blue-600'
      : 'bg-blue-300 cursor-not-allowed';

   return (
      <Modal
         title='Orden personalizado'
         closeModal={() => closeModal()}
         width='[680px]'>
         <div className='text-sm text-gray-600'>
            <p className='mb-4'>Utiliza las flechas para definir el orden en que aparecerán tus keywords.</p>
            <div className='border rounded-lg max-h-[460px] overflow-y-auto styled-scrollbar'>
               {orderedKeywords.map((keyword, index) => {
                  const highlightClass = keyword.device === device ? 'bg-indigo-50' : 'bg-white';
                  return (
                     <div
                        key={keyword.ID}
                        className={`grid grid-cols-[40px_1fr_auto] items-center border-b last:border-b-0 px-4 py-1.5 ${highlightClass}`}>
                        <span className='text-center font-semibold text-gray-500'>{index + 1}</span>
                        <div className='overflow-hidden pr-4'>
                           <p className='font-semibold text-gray-700 truncate'>{keyword.keyword}{keyword.city ? ` (${keyword.city})` : ''}</p>
                           <p className='text-xs text-gray-400 truncate'>
                              Device: {keyword.device.toUpperCase()} · Orden actual: {keyword.sortOrder ?? 'sin definir'}
                           </p>
                        </div>
                        <div className='flex items-center gap-2 justify-end'>
                           <button
                              className='border rounded px-2 py-1 hover:bg-indigo-100 disabled:opacity-40'
                              onClick={() => moveKeyword(index, index - 1)}
                              disabled={index === 0 || isSaving}
                              title='Mover arriba'>
                              <Icon type='caret-up' size={14} />
                           </button>
                           <button
                              className='border rounded px-2 py-1 hover:bg-indigo-100 disabled:opacity-40'
                              onClick={() => moveKeyword(index, index + 1)}
                              disabled={index === orderedKeywords.length - 1 || isSaving}
                              title='Mover abajo'>
                              <Icon type='caret-down' size={14} />
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>
            <div className='mt-4 flex justify-between items-center'>
               <button
                  className='text-sm text-indigo-600 hover:text-indigo-800'
                  onClick={resetOrder}
                  disabled={!hasChanges || isSaving}
               >
                  Restablecer orden actual
               </button>
               <div className='text-xs text-gray-400'>* Se resalta el dispositivo activo: {device.toUpperCase()}.</div>
            </div>
            <div className='mt-6 text-right text-sm font-semibold'>
               <button
                  className='py-2 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                  onClick={() => closeModal()}
                  disabled={isSaving}
               >
                  Cancelar
               </button>
               <button
                  className={`py-2 px-5 rounded cursor-pointer text-white ${primaryButtonClass}`}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
               >
                  {isSaving ? 'Guardando...' : 'Guardar orden'}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default KeywordOrderModal;
