import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import DomainSettings from '../../components/domains/DomainSettings';
import Settings from '../../components/settings/Settings';
import Footer from '../../components/common/Footer';
import Icon from '../../components/common/Icon';
import { useFetchDomains, useFetchGlobalStats } from '../../services/domains';
import { useFetchSettings } from '../../services/settings';

const StatsPage = () => {
   const router = useRouter();
   const [showAddDomain, setShowAddDomain] = React.useState(false);
   const [showDomainSettings, setShowDomainSettings] = React.useState<DomainType | false>(false);
   const [showSettings, setShowSettings] = React.useState(false);
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router, false);
   const { data: statsData, isLoading: statsLoading } = useFetchGlobalStats();

   const domains = domainsData?.domains || [];
   const stats = statsData || { domains: [], totals: { totalScrapes: 0, currentMonth: 0 } };

   return (
      <div className="Domain ">
         {((!appSettingsData?.settings?.scraper_type || (appSettingsData?.settings?.scraper_type === 'none')) && !isAppSettingsLoading) && (
               <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                  A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
               </div>
         )}
         <Head>
            <title>Stats - SerpBear</title>
         </Head>
         <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
         <div className="flex w-full max-w-7xl mx-auto px-5 pt-10">
            <div className='w-full'>
               <div className='mb-6'>
                  <h1 className='text-2xl font-bold text-slate-800'>Stats overview</h1>
                  <p className='text-sm text-slate-500 mt-1'>Resumen de las búsquedas realizadas por todos los dominios.</p>
               </div>

               {statsLoading ? (
                  <p className='text-sm text-slate-500'>Cargando estadísticas…</p>
               ) : (
                  <div className='space-y-6'>
                     <div className='grid md:grid-cols-2 gap-4'>
                        <div className='p-4 bg-white border border-slate-200 rounded-lg shadow-sm'>
                           <span className='text-xs uppercase tracking-wide text-slate-500'>Total scrapes</span>
                           <p className='text-2xl font-semibold text-slate-700 mt-1'>{stats.totals.totalScrapes}</p>
                        </div>
                        <div className='p-4 bg-white border border-slate-200 rounded-lg shadow-sm'>
                           <span className='text-xs uppercase tracking-wide text-slate-500'>Este mes</span>
                           <p className='text-2xl font-semibold text-slate-700 mt-1'>{stats.totals.currentMonth}</p>
                        </div>
                     </div>

                     <div className='border border-slate-200 rounded-lg bg-white'>
                        <div className='px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-600'>
                           <Icon type='chart' size={16} />
                           Scrapes por dominio
                        </div>
                        <div className='overflow-x-auto'>
                           <table className='min-w-full text-sm'>
                              <thead className='bg-slate-50 text-xs uppercase tracking-wider text-slate-500'>
                                 <tr>
                                    <th className='text-left px-4 py-2'>Dominio</th>
                                    <th className='text-left px-4 py-2'>Total</th>
                                    <th className='text-left px-4 py-2'>Este mes</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {stats.domains.length === 0 && (
                                    <tr>
                                       <td className='px-4 py-3 text-slate-500 text-sm' colSpan={3}>Todavía no hay registros.</td>
                                    </tr>
                                 )}
                                 {stats.domains.map((item) => (
                                    <tr key={item.domain} className='border-t border-slate-100 hover:bg-slate-50 transition'>
                                       <td className='px-4 py-2 font-semibold text-slate-700'>{item.domain}</td>
                                       <td className='px-4 py-2'>{item.total}</td>
                                       <td className='px-4 py-2'>{item.currentMonth}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <AddDomain closeModal={() => setShowAddDomain(false)} domains={domains} />
         </CSSTransition>

         <CSSTransition in={!!showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <DomainSettings
               domain={showDomainSettings}
               closeModal={setShowDomainSettings}
            />
         </CSSTransition>
         <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
             <Settings closeSettings={() => setShowSettings(false)} />
         </CSSTransition>
         <Footer currentVersion={appSettingsData?.settings?.version ? appSettingsData.settings.version : ''} />
      </div>
   );
};

export default StatsPage;
