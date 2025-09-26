import React, { useMemo, useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../components/common/Sidebar';
import TopBar from '../../../components/common/TopBar';
import DomainHeader from '../../../components/domains/DomainHeader';
import AddDomain from '../../../components/domains/AddDomain';
import DomainSettings from '../../../components/domains/DomainSettings';
import Settings from '../../../components/settings/Settings';
import Footer from '../../../components/common/Footer';
import KeywordDetails from '../../../components/keywords/KeywordDetails';
import CompetitorKeywordsTable from '../../../components/competitors/CompetitorKeywordsTable';
import { useFetchDomains } from '../../../services/domains';
import { useFetchKeywords } from '../../../services/keywords';
import { useFetchSettings } from '../../../services/settings';
import { parseCompetitorsList, formatCompetitorLabel } from '../../../utils/competitorsShared';
import Icon from '../../../components/common/Icon';

const DomainCompetitors: NextPage = () => {
   const router = useRouter();
   const [showAddDomain, setShowAddDomain] = useState(false);
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [selectedKeyword, setSelectedKeyword] = useState<KeywordType | null>(null);
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router);
   const appSettings: SettingsType = appSettingsData?.settings || {};

   const activDomain: DomainType|null = useMemo(() => {
      if (domainsData?.domains && router.query?.slug) {
         return domainsData.domains.find((x:DomainType) => x.slug === router.query.slug) || null;
      }
      return null;
   }, [router.query.slug, domainsData]);

   const { keywordsData, keywordsLoading } = useFetchKeywords(router, activDomain?.domain || '', undefined, undefined);
   const keywords: KeywordType[] = (keywordsData && keywordsData.keywords) || [];
   const competitorsFromApi: string[] = keywordsData && Array.isArray(keywordsData.competitors) ? keywordsData.competitors : [];
   const competitorsFromDomain = activDomain?.competitors ? parseCompetitorsList(activDomain.competitors) : [];
   const competitorList = competitorsFromApi.length > 0 ? competitorsFromApi : competitorsFromDomain;
   const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

   useEffect(() => {
      if (competitorList.length === 0) {
         setSelectedCompetitor('');
      } else if (!selectedCompetitor || !competitorList.includes(selectedCompetitor)) {
         setSelectedCompetitor(competitorList[0]);
      }
   }, [competitorList, selectedCompetitor]);

   const formattedCompetitors = useMemo(() => competitorList.map((competitor) => ({
      value: competitor,
      label: formatCompetitorLabel(competitor),
   })), [competitorList]);

   return (
      <div className="Domain ">
         {((!appSettings.scraper_type || (appSettings.scraper_type === 'none')) && !isAppSettingsLoading) && (
               <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                  A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
               </div>
         )}
         {activDomain && activDomain.domain && (
            <Head>
               <title>{`${activDomain.domain} - Competitors - KiwiBear` }</title>
            </Head>
         )}
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto">
            <Sidebar domains={domainsData?.domains || []} showAddModal={() => setShowAddDomain(true)} />
            <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
               {activDomain && activDomain.domain
                  ? <DomainHeader
                     domain={activDomain}
                     domains={domainsData?.domains || []}
                     showAddModal={() => {}}
                     showSettingsModal={setShowDomainSettings}
                     exportCsv={() => {}}
                  />
                  : <div className='w-full lg:h-[100px]'></div>
               }

               <div className='mt-6'>
                  {formattedCompetitors.length === 0 && (
                     <div className='border border-dashed border-slate-300 rounded-lg p-6 text-sm text-slate-600 bg-slate-50'>
                        <p>No tienes competidores configurados todavía. Añade alguno desde la configuración del dominio.</p>
                        <button
                           className='mt-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded'
                           onClick={() => setShowDomainSettings(true)}
                        >
                           <Icon type='settings' size={14} /> Abrir ajustes de dominio
                        </button>
                     </div>
                  )}

                  {formattedCompetitors.length > 0 && (
                     <>
                        <div className='flex flex-wrap gap-2 items-center text-sm'>
                           <span className='uppercase text-xs tracking-wide text-slate-500'>Competidores:</span>
                           {formattedCompetitors.map(({ value, label }) => (
                              <button
                                 key={value}
                                 type='button'
                                 className={[
                                    'px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wide transition',
                                    value === selectedCompetitor
                                       ? 'bg-blue-600 border-blue-600 text-white'
                                       : 'border-slate-200 text-slate-600 hover:border-blue-300',
                                 ].join(' ')}
                                 onClick={() => setSelectedCompetitor(value)}
                              >
                                 {label}
                              </button>
                           ))}
                        </div>

                        {selectedCompetitor && (
                           <CompetitorKeywordsTable
                              keywords={keywords}
                              competitor={selectedCompetitor}
                              onOpenDetails={(keyword) => setSelectedKeyword(keyword)}
                           />
                        )}

                        {selectedCompetitor && keywords.length === 0 && !keywordsLoading && (
                           <p className='mt-4 text-sm text-gray-500'>
                              Todavía no hay posiciones registradas para este competidor. Vuelve a actualizar tus keywords para obtener datos.
                           </p>
                        )}
                     </>
                  )}
               </div>
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
               domain={showDomainSettings && domainsData?.domains && activDomain && activDomain.domain ? activDomain : false}
               closeModal={setShowDomainSettings}
            />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>

         {selectedKeyword && (
            <KeywordDetails keyword={selectedKeyword} closeDetails={() => setSelectedKeyword(null)} />
         )}

         <Footer currentVersion={appSettings?.version ? appSettings.version : ''} />
      </div>
   );
};

export default DomainCompetitors;
