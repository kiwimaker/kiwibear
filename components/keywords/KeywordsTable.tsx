import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { filterKeywords, keywordsByDevice, sortKeywords } from '../../utils/client/sortFilter';
import Icon from '../common/Icon';
import Keyword from './Keyword';
import KeywordDetails from './KeywordDetails';
import KeywordFilters from './KeywordFilter';
import Modal from '../common/Modal';
import { useDeleteKeywords, useFavKeywords, useRefreshKeywords, useUpdateKeywordOrder, useUpdateKeywordSettings } from '../../services/keywords';
import KeywordTagManager from './KeywordTagManager';
import AddTags from './AddTags';
import KeywordOrderModal from './KeywordOrderModal';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import { useUpdateSettings } from '../../services/settings';
import { defaultSettings } from '../settings/Settings';

type KeywordsTableProps = {
   domain: DomainType | null,
   keywords: KeywordType[],
   isLoading: boolean,
   showAddModal: boolean,
   setShowAddModal: Function,
   isConsoleIntegrated: boolean,
   settings?: SettingsType,
   supportsCustomOrder?: boolean
}

const KeywordsTable = (props: KeywordsTableProps) => {
   const titleColumnRef = useRef(null);
   const { keywords = [], isLoading = true, isConsoleIntegrated = false, settings, supportsCustomOrder = false } = props;
   const showSCData = isConsoleIntegrated;
   const [device, setDevice] = useState<string>('all');
   const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
   const [showKeyDetails, setShowKeyDetails] = useState<KeywordType|null>(null);
   const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
   const [showTagManager, setShowTagManager] = useState<null|number>(null);
   const [showAddTags, setShowAddTags] = useState<boolean>(false);
   const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
   const [SCListHeight, setSCListHeight] = useState(500);
   const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
   const [sortBy, setSortBy] = useState<string>('date_asc');
   const [scDataType, setScDataType] = useState<string>('threeDays');
   const [showScDataTypes, setShowScDataTypes] = useState<boolean>(false);
   const [maxTitleColumnWidth, setMaxTitleColumnWidth] = useState(235);
   const { mutate: deleteMutate } = useDeleteKeywords(() => {});
   const { mutate: favoriteMutate } = useFavKeywords(() => {});
   const { mutate: refreshMutate } = useRefreshKeywords(() => {});
   const { mutate: updateKeywordSettingsMutate, isLoading: isUpdatingKeywordSettings } = useUpdateKeywordSettings(() => {});
   const { mutate: updateOrderMutate, isLoading: isUpdatingOrder } = useUpdateKeywordOrder(() => setShowOrderModal(false));
   const [isMobile] = useIsMobile();

   useWindowResize(() => {
      setSCListHeight(window.innerHeight - (isMobile ? 200 : 400));
      if (titleColumnRef.current) {
         setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
      }
   });

   useEffect(() => {
      if (titleColumnRef.current) {
         setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
      }
   }, [titleColumnRef]);

   useEffect(() => {
      if (supportsCustomOrder
         && sortBy === 'date_asc'
         && keywords.some((item) => typeof item.sortOrder === 'number' && item.sortOrder !== null)) {
         setSortBy('custom');
      }
   }, [keywords, sortBy, supportsCustomOrder]);

   useEffect(() => {
      if (!supportsCustomOrder && sortBy === 'custom') {
         setSortBy('date_asc');
      }
   }, [supportsCustomOrder, sortBy]);

   const tableColumns = settings?.keywordsColumns || ['Best', 'History', 'Volume', 'Search Console'];
   const { mutate: updateMutate, isLoading: isUpdatingSettings } = useUpdateSettings(() => console.log(''));

   const scDataObject:{ [k:string] : string} = {
      threeDays: 'Last Three Days',
      sevenDays: 'Last Seven Days',
      thirtyDays: 'Last Thirty Days',
      avgThreeDays: 'Last Three Days Avg',
      avgSevenDays: 'Last Seven Days Avg',
      avgThirtyDays: 'Last Thirty Days Avg',
   };

   const processedKeywords: {[key:string] : KeywordType[]} = useMemo(() => {
      const filteredKeywords = filterKeywords(keywords, filterParams);
      const sortedKeywords = sortKeywords(filteredKeywords, sortBy, scDataType);
      if (device === 'all') {
         return { all: sortedKeywords };
      }
      return keywordsByDevice(sortedKeywords, device);
   }, [keywords, device, sortBy, filterParams, scDataType]);

   const canManageTop20 = useMemo(() => {
      if (keywords.some((item) => item.settings?.fetchTop20)) {
         return true;
      }
      if (!settings) { return false; }
      const { scraper_type, available_scapers = [] } = settings;
      const activeScraper = available_scapers?.find((scraper) => scraper.value === scraper_type);
      const scraperLabel = (activeScraper?.label || scraper_type || '').toLowerCase();
      return scraperLabel.includes('serper');
   }, [keywords, settings]);

   const allDomainTags: string[] = useMemo(() => {
      const allTags = keywords.reduce((acc: string[], keyword) => [...acc, ...keyword.tags], []).filter((t) => t && t.trim() !== '');
      return [...new Set(allTags)];
   }, [keywords]);

   const selectKeyword = (keywordID: number) => {
      console.log('Select Keyword: ', keywordID);
      let updatedSelectd = [...selectedKeywords, keywordID];
      if (selectedKeywords.includes(keywordID)) {
         updatedSelectd = selectedKeywords.filter((keyID) => keyID !== keywordID);
      }
      setSelectedKeywords(updatedSelectd);
   };

   const handleBulkTop20Toggle = (enable: boolean) => {
      if (selectedKeywords.length === 0 || isUpdatingKeywordSettings) { return; }
      updateKeywordSettingsMutate(
         { ids: selectedKeywords, settings: { fetchTop20: enable } },
         { onSuccess: () => setSelectedKeywords([]) },
      );
   };

   const handleKeywordTop20Toggle = (keywordID: number, enable: boolean) => {
      if (isUpdatingKeywordSettings) { return; }
      updateKeywordSettingsMutate({ ids: [keywordID], settings: { fetchTop20: enable } });
   };

   const top20ActionClasses = [
      'block px-2 py-2 cursor-pointer hover:text-indigo-600',
      isUpdatingKeywordSettings ? 'pointer-events-none opacity-50' : '',
   ].filter(Boolean).join(' ');

   const updateColumns = (column:string) => {
      const newColumns = tableColumns.includes(column) ? tableColumns.filter((col) => col !== column) : [...tableColumns, column];
      updateMutate({ ...defaultSettings, ...settings, keywordsColumns: newColumns });
   };

   const shouldHideColumn = useCallback((col:string) => {
      return settings?.keywordsColumns && !settings?.keywordsColumns.includes(col) ? 'lg:hidden' : '';
   }, [settings?.keywordsColumns]);

   const Row = ({ data, index, style }:ListChildComponentProps) => {
      const keyword = data[index];
      return (
         <Keyword
         key={keyword.ID}
         style={style}
         index={index}
         selected={selectedKeywords.includes(keyword.ID)}
         selectKeyword={selectKeyword}
         keywordData={keyword}
         refreshkeyword={() => refreshMutate({ ids: [keyword.ID] })}
         favoriteKeyword={favoriteMutate}
         manageTags={() => setShowTagManager(keyword.ID)}
         removeKeyword={() => { setSelectedKeywords([keyword.ID]); setShowRemoveModal(true); }}
         showKeywordDetails={() => setShowKeyDetails(keyword)}
         lastItem={index === (currentKeywords.length - 1)}
         showSCData={showSCData}
         scDataType={scDataType}
         tableColumns={tableColumns}
         maxTitleColumnWidth={maxTitleColumnWidth}
         canManageTop20={canManageTop20}
         toggleTop20Tracking={handleKeywordTop20Toggle}
         />
      );
   };

   const currentKeywords = useMemo(() => processedKeywords[device] || processedKeywords.all || [], [processedKeywords, device]);
   const selectedAllItems = selectedKeywords.length === currentKeywords.length;

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
            {selectedKeywords.length > 0 && (
               <div className='font-semibold text-sm py-4 px-8 text-gray-500 '>
                  <ul className=''>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => { refreshMutate({ ids: selectedKeywords }); setSelectedKeywords([]); }}
                        >
                           <span className=' bg-indigo-100 text-blue-700 px-1 rounded'><Icon type="reload" size={11} /></span> Refresh Keywords
                        </a>
                     </li>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => setShowRemoveModal(true)}
                        >
                           <span className=' bg-red-100 text-red-600 px-1 rounded'><Icon type="trash" size={14} /></span> Remove Keywords</a>
                     </li>
                     <li className='inline-block mr-4'>
                        <a
                        className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                        onClick={() => setShowAddTags(true)}
                        >
                           <span className=' bg-green-100 text-green-500  px-1 rounded'><Icon type="tags" size={14} /></span> Tag Keywords</a>
                     </li>
                     {canManageTop20 && (
                        <>
                           <li className='inline-block mr-4'>
                              <a
                              className={top20ActionClasses}
                              onClick={() => handleBulkTop20Toggle(true)}
                              >
                                 <span className=' bg-amber-100 text-amber-600 px-1 rounded'><Icon type="trophy" size={14} /></span> Activar Top 20
                              </a>
                           </li>
                           <li className='inline-block mr-4'>
                              <a
                              className={top20ActionClasses}
                              onClick={() => handleBulkTop20Toggle(false)}
                              >
                                 <span className=' bg-slate-100 text-slate-500 px-1 rounded'><Icon type="trophy" size={14} /></span> Desactivar Top 20
                              </a>
                           </li>
                        </>
                     )}
                  </ul>
               </div>
            )}
            {selectedKeywords.length === 0 && (
               <KeywordFilters
                  allTags={allDomainTags}
                  filterParams={filterParams}
                  filterKeywords={(params:KeywordFilters) => setFilterParams(params)}
                  updateSort={(sorted:string) => setSortBy(sorted)}
                  sortBy={sortBy}
                  keywords={keywords}
                  device={device}
                  setDevice={setDevice}
                  updateColumns={updateColumns}
                  tableColumns={tableColumns}
                  integratedConsole={isConsoleIntegrated}
                  onCustomOrder={supportsCustomOrder ? (() => setShowOrderModal(true)) : undefined}
                  supportsCustomOrder={supportsCustomOrder}
               />
            )}
            <div className={`domkeywordsTable domkeywordsTable--keywords 
            ${showSCData && tableColumns.includes('Search Console') ? 'domkeywordsTable--hasSC' : ''} 
               styled-scrollbar w-full overflow-auto min-h-[60vh]`}>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domKeywords_head domKeywords_head--${sortBy} hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y`}>
                     <span ref={titleColumnRef} className={`domKeywords_head_keyword flex-1 basis-[4rem] w-auto lg:flex-1 
                        ${showSCData && tableColumns.includes('Search Console') ? 'lg:basis-20' : 'lg:basis-10'} lg:w-auto lg:flex lg:items-center `}>
                     {currentKeywords.length > 0 && (
                        <button
                           className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px]  border border-slate-300
                           ${selectedAllItems ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                           onClick={() => setSelectedKeywords(selectedAllItems ? [] : currentKeywords.map((k: KeywordType) => k.ID))}
                           >
                              <Icon type="check" size={10} />
                        </button>
                     )}
                  {/* ${showSCData ? 'lg:min-w-[220px]' : 'lg:min-w-[280px]'} */}
                        <span className={`inline-block lg:flex lg:items-center 
                           ${showSCData && tableColumns.includes('Search Console') ? 'lg:max-w-[235px]' : ''}`}>
                           Keyword
                        </span>
                     </span>
                     <span className='domKeywords_head_position flex-1 basis-24 grow-0 text-center'>Position</span>
                     <span className={`domKeywords_head_best flex-1 basis-16 grow-0 text-center  ${shouldHideColumn('Best')}`}>Best</span>
                     <span className={`domKeywords_head_history flex-1 basis-20 grow-0  ${shouldHideColumn('History')}`}>History (7d)</span>
                     <span className={`domKeywords_head_volume flex-1 basis-24 grow-0 text-center ${shouldHideColumn('Volume')}`}>Volume</span>
                     <span className='domKeywords_head_url flex-1'>URL</span>
                     <span className='domKeywords_head_updated flex-1 relative left-3 max-w-[150px]'>Updated</span>
                     {showSCData && tableColumns.includes('Search Console') && (
                        <div className='domKeywords_head_sc flex-1 min-w-[170px] lg:max-w-[170px] mr-7 text-center'>
                           {/* Search Console */}
                           <div>
                              <div
                              className=' w-48 select-none cursor-pointer absolute bg-white rounded-full
                              px-2 py-[2px] mt-[-22px] ml-3 border border-gray-200 z-40'
                              onClick={() => setShowScDataTypes(!showScDataTypes)}>
                                 <Icon type="google" size={13} /> {scDataObject[scDataType]}
                                 <Icon classes="ml-2" type={showScDataTypes ? 'caret-up' : 'caret-down'} size={10} />
                              </div>
                              {showScDataTypes && (
                                 <div className='absolute bg-white border border-gray-200 z-50 w-44 rounded mt-2 ml-5 text-gray-500'>
                                    {Object.keys(scDataObject).map((itemKey) => {
                                       return <span
                                                className={`block p-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600
                                                 ${scDataType === itemKey ? 'bg-indigo-100 text-indigo-600' : ''}`}
                                                key={itemKey}
                                                onClick={() => { setScDataType(itemKey); setShowScDataTypes(false); }}>
                                                   {scDataObject[itemKey]}
                                                </span>;
                                    })}
                                 </div>
                              )}
                           </div>
                           <div className='relative top-2 flex justify-between'>
                              <span className='min-w-[40px]'>Pos</span>
                              <span className='min-w-[40px]'>Imp</span>
                              <span className='min-w-[40px]'>Visits</span>
                              {/* <span>CTR</span> */}
                           </div>
                        </div>
                     )}
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {currentKeywords.length > 0 && (
                        <List
                        innerElementType="div"
                        itemData={currentKeywords}
                        itemCount={currentKeywords.length}
                        itemSize={isMobile ? 146 : 57}
                        height={SCListHeight}
                        width={'100%'}
                        className={'styled-scrollbar'}
                        >
                           {Row}
                        </List>
                     )}
                     {!isLoading && currentKeywords.length === 0 && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>No Keywords added yet.</p>
                     )}
                     {isLoading && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>Loading Keywords...</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
         {showKeyDetails && showKeyDetails.ID && (
            <KeywordDetails keyword={showKeyDetails} closeDetails={() => setShowKeyDetails(null)} />
         )}
         {showRemoveModal && selectedKeywords.length > 0 && (
            <Modal closeModal={() => { setSelectedKeywords([]); setShowRemoveModal(false); }} title={'Remove Keywords'}>
                  <div className='text-sm'>
                     <p>Are you sure you want to remove {selectedKeywords.length > 1 ? 'these' : 'this'} Keyword?</p>
                     <div className='mt-6 text-right font-semibold'>
                        <button
                        className=' py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                        onClick={() => { setSelectedKeywords([]); setShowRemoveModal(false); }}>
                           Cancel
                        </button>
                        <button
                        className=' py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                        onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); setSelectedKeywords([]); }}>
                           Remove
                        </button>
                     </div>
                  </div>
            </Modal>
         )}
         {showTagManager && (
            <KeywordTagManager
               allTags={allDomainTags}
               keyword={keywords.find((k) => k.ID === showTagManager)}
               closeModal={() => setShowTagManager(null)}
               />
         )}
         {showAddTags && (
            <AddTags
               existingTags={allDomainTags}
               keywords={keywords.filter((k) => selectedKeywords.includes(k.ID))}
               closeModal={() => setShowAddTags(false)}
               />
         )}
         {supportsCustomOrder && showOrderModal && (
            <KeywordOrderModal
               closeModal={() => setShowOrderModal(false)}
               keywords={keywords}
               device={device}
               isSaving={isUpdatingOrder}
               onSave={(orderMap: { [id:number]: number }) => updateOrderMutate(orderMap)}
            />
         )}
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
 };

 export default KeywordsTable;
