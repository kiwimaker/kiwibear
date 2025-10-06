import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import useDomainCompetitorsData from '../../hooks/useDomainCompetitorsData';
import Sidebar from '../common/Sidebar';
import TopBar from '../common/TopBar';
import DomainHeader from '../domains/DomainHeader';
import AddDomain from '../domains/AddDomain';
import DomainSettings from '../domains/DomainSettings';
import Settings from '../settings/Settings';
import Footer from '../common/Footer';
import KeywordDetails from '../keywords/KeywordDetails';
import CompetitorKeywordsTable from './CompetitorKeywordsTable';
import CompetitorMatrixTable from './CompetitorMatrixTable';
import { formatCompetitorLabel } from '../../utils/competitorsShared';
import Icon from '../common/Icon';

type DomainCompetitorsPageProps = {
   view: 'single' | 'matrix',
};

const DomainCompetitorsPage = ({ view }: DomainCompetitorsPageProps) => {
   const router = useRouter();
   const {
      appSettings,
      isAppSettingsLoading,
      domainsData,
      activeDomain,
      keywords,
      keywordsLoading,
      competitorList,
   } = useDomainCompetitorsData();

   const [showAddDomain, setShowAddDomain] = useState(false);
   const [showDomainSettings, setShowDomainSettings] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [selectedKeyword, setSelectedKeyword] = useState<KeywordType | null>(null);
   const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

   const formattedCompetitors = useMemo(() => competitorList.map((competitor) => ({
      value: competitor,
      label: formatCompetitorLabel(competitor),
   })), [competitorList]);

   const competitorCoverage = useMemo(() => {
      if (keywords.length === 0) { return []; }
      const total = keywords.length;
      return competitorList.map((competitor) => {
         const withPosition = keywords.reduce((count, keyword) => {
            const competitorPosition = keyword.competitors?.[competitor]?.position || 0;
            return competitorPosition > 0 ? count + 1 : count;
         }, 0);
         const percent = Math.round((withPosition / total) * 100);
         return {
            name: competitor,
            label: formatCompetitorLabel(competitor),
            percent,
         };
      });
   }, [competitorList, keywords]);

   useEffect(() => {
      if (view !== 'single') { return; }
      if (competitorList.length === 0) {
         setSelectedCompetitor('');
      } else if (!selectedCompetitor || !competitorList.includes(selectedCompetitor)) {
         setSelectedCompetitor(competitorList[0]);
      }
   }, [competitorList, selectedCompetitor, view]);

   const slugParam = useMemo(() => {
      if (activeDomain?.slug) { return activeDomain.slug; }
      const { slug } = router.query;
      if (typeof slug === 'string') { return slug; }
      if (Array.isArray(slug) && slug.length > 0) { return slug[0]; }
      return '';
   }, [activeDomain?.slug, router.query]);

   const competitorsBaseHref = slugParam ? `/domain/competitors/${slugParam}` : router.asPath;
   const matrixHref = slugParam ? `/domain/competitors/${slugParam}/matrix` : router.asPath;

   return (
      <div className="Domain ">
         {((!appSettings.scraper_type || (appSettings.scraper_type === 'none')) && !isAppSettingsLoading) && (
            <div className='p-3 bg-red-600 text-white text-sm text-center'>
               A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
            </div>
         )}
         {activeDomain && activeDomain.domain && (
            <Head>
               <title>{`${activeDomain.domain} - Competitors - KiwiBear` }</title>
            </Head>
         )}
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto">
            <Sidebar domains={domainsData?.domains || []} showAddModal={() => setShowAddDomain(true)} />
            <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
               {activeDomain && activeDomain.domain
                  ? (
                     <DomainHeader
                        domain={activeDomain}
                        domains={domainsData?.domains || []}
                        showAddModal={() => {} }
                        showSettingsModal={setShowDomainSettings}
                        exportCsv={() => {} }
                     />
                  )
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
                     <div className='flex flex-wrap gap-2 items-center text-xs uppercase tracking-wide text-slate-500'>
                        <Link href={competitorsBaseHref} passHref>
                           <a
                              className={[
                                 'px-3 py-1.5 rounded-full border font-semibold transition',
                                 view === 'single'
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-blue-300',
                              ].join(' ')}
                           >
                              Vista por competidor
                           </a>
                        </Link>
                        <Link href={matrixHref} passHref>
                           <a
                              className={[
                                 'px-3 py-1.5 rounded-full border font-semibold transition',
                                 view === 'matrix'
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-200 text-slate-600 hover:border-blue-300',
                              ].join(' ')}
                           >
                              Tabla general
                           </a>
                        </Link>
                     </div>
                  )}

                  {view === 'single' && formattedCompetitors.length > 0 && (
                     <>
                        <div className='flex flex-wrap gap-2 items-center text-sm mt-4'>
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

                  {view === 'matrix' && formattedCompetitors.length > 0 && (
                     <div className='mt-4'>
                        {competitorCoverage.length > 0 && (
                           <div className='flex flex-wrap gap-3 mb-4'>
                              {competitorCoverage.map(({ name, label, percent }) => (
                                 <div
                                    key={name}
                                    className='flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full text-xs font-semibold text-slate-600'
                                 >
                                    <span className='uppercase tracking-wide text-slate-400'>
                                       {label}
                                    </span>
                                    <span className='text-sm text-slate-700'>{percent}%</span>
                                 </div>
                              ))}
                           </div>
                        )}
                        <CompetitorMatrixTable
                           keywords={keywords}
                           domainName={activeDomain?.domain}
                           competitors={competitorList}
                           onOpenDetails={(keyword) => setSelectedKeyword(keyword)}
                        />

                        {keywords.length === 0 && !keywordsLoading && (
                           <p className='mt-4 text-sm text-gray-500'>
                              Todavía no hay posiciones registradas. Vuelve a actualizar tus keywords para obtener datos.
                           </p>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
         </CSSTransition>

         <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
               domain={showDomainSettings && domainsData?.domains && activeDomain && activeDomain.domain ? activeDomain : false}
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

export default DomainCompetitorsPage;
