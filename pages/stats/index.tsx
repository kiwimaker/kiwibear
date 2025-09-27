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
import Modal from '../../components/common/Modal';
import { useFetchDomains, useFetchGlobalStats, useFetchDomainScrapeLogs, useClearDomainScrapeLogs } from '../../services/domains';
import { useFetchSettings } from '../../services/settings';

const StatsPage = () => {
   const router = useRouter();
   const [showAddDomain, setShowAddDomain] = React.useState(false);
   const [showDomainSettings, setShowDomainSettings] = React.useState<DomainType | false>(false);
   const [showSettings, setShowSettings] = React.useState(false);
   const [showConfirmClearLogs, setShowConfirmClearLogs] = React.useState(false);
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router, false);
   const { data: statsData, isLoading: statsLoading } = useFetchGlobalStats();
   const { data: logsData, isLoading: logsLoading } = useFetchDomainScrapeLogs(undefined, 100);
   const { mutate: clearLogs, isLoading: isClearingLogs } = useClearDomainScrapeLogs();

   const domains = domainsData?.domains || [];
   const stats = statsData || { domains: [], totals: { totalScrapes: 0, last30Days: 0 } };
   const logs = logsData?.logs || [];
   const totalLogCount = logsData?.stats?.totalCount || 0;
   const totalLogSize = logsData?.stats?.totalSizeBytes || 0;

   const humanReadableSize = React.useMemo(() => {
      if (!Number.isFinite(totalLogSize) || totalLogSize <= 0) { return '0 B'; }
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const power = Math.min(Math.floor(Math.log(totalLogSize) / Math.log(1024)), units.length - 1);
      const size = totalLogSize / (1024 ** power);
      return `${size.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
   }, [totalLogSize]);

   const logSummary = React.useMemo(() => {
      if (totalLogCount === 0) { return 'Sin registros'; }
      const countLabel = `${totalLogCount} registro${totalLogCount === 1 ? '' : 's'}`;
      return `${countLabel} · ${humanReadableSize}`;
   }, [humanReadableSize, totalLogCount]);

   const handleRequestClearLogs = React.useCallback(() => {
      if (isClearingLogs || totalLogCount === 0) { return; }
      setShowConfirmClearLogs(true);
   }, [isClearingLogs, totalLogCount]);

   const cancelClearLogs = React.useCallback(() => {
      if (isClearingLogs) { return; }
      setShowConfirmClearLogs(false);
   }, [isClearingLogs]);

   const confirmClearLogs = React.useCallback(() => {
      if (isClearingLogs || totalLogCount === 0) { return; }
      clearLogs();
      setShowConfirmClearLogs(false);
   }, [clearLogs, isClearingLogs, totalLogCount]);

   return (
      <div className="Domain ">
         {((!appSettingsData?.settings?.scraper_type || (appSettingsData?.settings?.scraper_type === 'none')) && !isAppSettingsLoading) && (
               <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                  A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
               </div>
         )}
         <Head>
            <title>Stats - KiwiBear</title>
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
                           <span className='text-xs uppercase tracking-wide text-slate-500'>Últimos 30 días</span>
                           <p className='text-2xl font-semibold text-slate-700 mt-1'>{stats.totals.last30Days}</p>
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
                                    <th className='text-left px-4 py-2'>Últimos 30 días</th>
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
                                       <td className='px-4 py-2'>{item.last30Days}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     <div className='border border-slate-200 rounded-lg bg-white'>
                        <div
                           className={'px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between '
                           + 'gap-3 text-sm font-semibold text-slate-600'}
                        >
                           <span className='flex items-center gap-2'>
                              <Icon type='clock' size={16} />
                              Actividad reciente de scrapes
                           </span>
                           <div className='flex items-center gap-4 text-xs font-normal text-slate-500'>
                              <span>{logSummary}</span>
                              <button
                              type='button'
                              className='text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              onClick={handleRequestClearLogs}
                              disabled={isClearingLogs || totalLogCount === 0}>
                                 {isClearingLogs ? 'Eliminando…' : 'Borrar actividad'}
                              </button>
                           </div>
                        </div>
                        {logsLoading ? (
                           <p className='px-4 py-3 text-sm text-slate-500'>Cargando actividad…</p>
                        ) : (
                           <div className='overflow-x-auto'>
                              <table className='min-w-full text-sm'>
                                 <thead className='bg-slate-50 text-xs uppercase tracking-wider text-slate-500'>
                                    <tr>
                                       <th className='text-left px-4 py-2'>Fecha</th>
                                       <th className='text-left px-4 py-2'>Dominio</th>
                                       <th className='text-left px-4 py-2'>Keyword</th>
                                       <th className='text-left px-4 py-2'>Solicitudes</th>
                                       <th className='text-left px-4 py-2'>Estado</th>
                                       <th className='text-left px-4 py-2'>Mensaje</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {logs.length === 0 && (
                                       <tr>
                                          <td className='px-4 py-3 text-slate-500 text-sm' colSpan={6}>Todavía no hay actividad registrada.</td>
                                       </tr>
                                    )}
                                    {logs.map((log) => {
                                       const statusStyles = log.status === 'success'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700';
                                       return (
                                          <tr key={log.ID} className='border-t border-slate-100 hover:bg-slate-50 transition'>
                                             <td className='px-4 py-2 whitespace-nowrap'>{new Date(log.createdAt).toLocaleString()}</td>
                                             <td className='px-4 py-2 font-semibold text-slate-700'>{log.domain}</td>
                                             <td className='px-4 py-2 text-slate-600'>{log.keyword || '—'}</td>
                                             <td className='px-4 py-2'>{log.requests}</td>
                                             <td className='px-4 py-2'>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles}`}>
                                                   {log.status === 'success' ? 'Éxito' : 'Error'}
                                                </span>
                                             </td>
                                             <td className='px-4 py-2 text-slate-600'>{log.message}</td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        )}
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
         <CSSTransition in={showConfirmClearLogs} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <Modal closeModal={cancelClearLogs} title='Borrar actividad reciente'>
               <p className='text-sm text-slate-600'>Esta acción eliminará los logs recientes. ¿Quieres continuar?</p>
               <div className='mt-4 flex justify-end gap-3'>
                  <button
                  type='button'
                  className='px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800'
                  onClick={cancelClearLogs}
                  disabled={isClearingLogs}>
                     Cancelar
                  </button>
                  <button
                  type='button'
                  className={'px-3 py-2 text-sm font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 '
                  + 'disabled:opacity-60 disabled:cursor-not-allowed'}
                  onClick={confirmClearLogs}
                  disabled={isClearingLogs || totalLogCount === 0}>
                     {isClearingLogs ? 'Eliminando…' : 'Sí, eliminar'}
                  </button>
               </div>
            </Modal>
         </CSSTransition>
         <Footer currentVersion={appSettingsData?.settings?.version ? appSettingsData.settings.version : ''} />
      </div>
   );
};

export default StatsPage;
