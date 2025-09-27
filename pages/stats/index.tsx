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
import {
   useFetchDomains,
   useFetchGlobalStats,
   useFetchDomainScrapeLogs,
   useClearDomainScrapeLogs,
   useResetDomainScrapeStats,
   useRebuildDomainScrapeStats,
} from '../../services/domains';
import { useFetchSettings } from '../../services/settings';

const StatsPage = () => {
   const router = useRouter();
   const [showAddDomain, setShowAddDomain] = React.useState(false);
   const [showDomainSettings, setShowDomainSettings] = React.useState<DomainType | false>(false);
   const [showSettings, setShowSettings] = React.useState(false);
   const [pendingResetDomain, setPendingResetDomain] = React.useState<string | null>(null);
   const [pendingRebuildDomain, setPendingRebuildDomain] = React.useState<string | null>(null);
   const [showConfirmClearLogs, setShowConfirmClearLogs] = React.useState(false);
   const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
   const { data: domainsData } = useFetchDomains(router, false);
   const { data: statsData, isLoading: statsLoading } = useFetchGlobalStats(true);
   const { data: logsData, isLoading: logsLoading } = useFetchDomainScrapeLogs(undefined, 100);
   const { mutate: clearLogs, isLoading: isClearingLogs } = useClearDomainScrapeLogs();
   const { mutate: resetDomainStats, isLoading: isResettingDomainStats } = useResetDomainScrapeStats();
   const { mutate: rebuildDomainStats, isLoading: isRebuildingDomainStats } = useRebuildDomainScrapeStats();

   const domains = domainsData?.domains || [];
   const stats = statsData || { domains: [], totals: { totalScrapes: 0, last30Days: 0 } };
   const diagnostics = statsData?.diagnostics;
   const mismatches = diagnostics?.mismatches || [];
   const hasMismatches = mismatches.length > 0;
   const diagnosticsContainerClasses = `${hasMismatches
      ? 'border-amber-300 bg-amber-50'
      : 'border-emerald-200 bg-emerald-50'} border rounded-lg p-4`;
   const destructiveActionButtonClasses = 'text-xs font-semibold text-rose-600 hover:text-rose-700 '
      + 'disabled:opacity-50 disabled:cursor-not-allowed';
   const secondaryActionButtonClasses = 'text-xs font-semibold text-sky-600 hover:text-sky-700 '
      + 'disabled:opacity-50 disabled:cursor-not-allowed';
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

   const handleRequestDomainReset = React.useCallback((domain: string) => {
      if (!domain || isResettingDomainStats) { return; }
      setPendingResetDomain(domain);
   }, [isResettingDomainStats]);

   const cancelDomainReset = React.useCallback(() => {
      if (isResettingDomainStats) { return; }
      setPendingResetDomain(null);
   }, [isResettingDomainStats]);

   const confirmDomainReset = React.useCallback(() => {
      if (!pendingResetDomain || isResettingDomainStats) { return; }
      resetDomainStats(pendingResetDomain, {
         onSuccess: () => {
            setPendingResetDomain(null);
         },
      });
   }, [isResettingDomainStats, pendingResetDomain, resetDomainStats]);

   const handleRequestDomainRebuild = React.useCallback((domain: string) => {
      if (!domain || isRebuildingDomainStats) { return; }
      setPendingRebuildDomain(domain);
   }, [isRebuildingDomainStats]);

   const cancelDomainRebuild = React.useCallback(() => {
      if (isRebuildingDomainStats) { return; }
      setPendingRebuildDomain(null);
   }, [isRebuildingDomainStats]);

   const confirmDomainRebuild = React.useCallback(() => {
      if (!pendingRebuildDomain || isRebuildingDomainStats) { return; }
      rebuildDomainStats(pendingRebuildDomain, {
         onSuccess: () => {
            setPendingRebuildDomain(null);
         },
      });
   }, [isRebuildingDomainStats, pendingRebuildDomain, rebuildDomainStats]);

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
                     {diagnostics && (
                        <div className={diagnosticsContainerClasses}>
                           <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                              <div className='flex items-start gap-3'>
                                 <Icon
                                 type={hasMismatches ? 'error' : 'check'}
                                 size={18}
                                 classes={hasMismatches ? 'text-amber-600' : 'text-emerald-600'}
                                 />
                                 <div>
                                    <p className='text-sm font-semibold text-slate-700'>
                                       {hasMismatches
                                          ? 'Se detectaron discrepancias entre las estadísticas y los logs.'
                                          : 'No se detectaron discrepancias entre las estadísticas y los logs.'}
                                    </p>
                                    <p className='mt-1 text-xs text-slate-500'>
                                       Última comprobación:
                                       {' '}
                                       {new Date(diagnostics.generatedAt).toLocaleString()}
                                    </p>
                                 </div>
                              </div>
                              <div className='grid grid-cols-2 gap-2 text-xs text-slate-600 md:text-right'>
                                 <div>
                                    <span className='block font-semibold text-slate-700'>Total stats</span>
                                    {diagnostics.totalsComparison.statsTotal}
                                 </div>
                                 <div>
                                    <span className='block font-semibold text-slate-700'>Total logs</span>
                                    {diagnostics.totalsComparison.logsTotal}
                                 </div>
                                 <div>
                                    <span className='block font-semibold text-slate-700'>30 días stats</span>
                                    {diagnostics.totalsComparison.statsLast30Days}
                                 </div>
                                 <div>
                                    <span className='block font-semibold text-slate-700'>30 días logs</span>
                                    {diagnostics.totalsComparison.logsLast30Days}
                                 </div>
                              </div>
                           </div>
                           {hasMismatches && (
                              <div className='mt-4 overflow-x-auto'>
                                 <table className='min-w-full text-xs'>
                                    <thead className='bg-white/60 text-left uppercase tracking-wide text-slate-500'>
                                       <tr>
                                          <th className='px-3 py-2'>Dominio</th>
                                          <th className='px-3 py-2'>Total stats</th>
                                          <th className='px-3 py-2'>Total logs</th>
                                          <th className='px-3 py-2'>Diferencia</th>
                                          <th className='px-3 py-2'>30 días stats</th>
                                          <th className='px-3 py-2'>30 días logs</th>
                                          <th className='px-3 py-2'>Último log</th>
                                          <th className='px-3 py-2'>Posible causa</th>
                                          <th className='px-3 py-2'>Acciones</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {mismatches.map((item) => {
                                          const isDomainRebuilding = isRebuildingDomainStats && pendingRebuildDomain === item.domain;
                                          return (
                                             <tr key={item.domain} className='border-t border-slate-200 bg-white/40 backdrop-blur'>
                                                <td className='px-3 py-2 font-semibold text-slate-700'>{item.domain}</td>
                                                <td className='px-3 py-2 text-slate-600'>{item.statsTotal}</td>
                                                <td className='px-3 py-2 text-slate-600'>{item.logsTotal}</td>
                                                <td className='px-3 py-2 text-slate-600'>
                                                   {item.totalDiff > 0 ? `+${item.totalDiff}` : item.totalDiff}
                                                </td>
                                                <td className='px-3 py-2 text-slate-600'>{item.statsLast30Days}</td>
                                                <td className='px-3 py-2 text-slate-600'>{item.logsLast30Days}</td>
                                                <td className='px-3 py-2 text-slate-600'>
                                                   {item.lastLogAt ? new Date(item.lastLogAt).toLocaleString() : '—'}
                                                </td>
                                                <td className='px-3 py-2 text-slate-600'>{item.possibleCause || 'Sin determinar'}</td>
                                                <td className='px-3 py-2'>
                                                   <button
                                                      type='button'
                                                      className={secondaryActionButtonClasses}
                                                      onClick={() => handleRequestDomainRebuild(item.domain)}
                                                      disabled={isDomainRebuilding}>
                                                      {isDomainRebuilding ? 'Recalculando…' : 'Recalcular'}
                                                   </button>
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           )}
                        </div>
                     )}
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
                                    <th className='text-left px-4 py-2'>Acciones</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {stats.domains.length === 0 && (
                                    <tr>
                                       <td className='px-4 py-3 text-slate-500 text-sm' colSpan={4}>Todavía no hay registros.</td>
                                    </tr>
                                 )}
                                 {stats.domains.map((item) => {
                                    const isDomainResetting = isResettingDomainStats && pendingResetDomain === item.domain;
                                    return (
                                       <tr key={item.domain} className='border-t border-slate-100 hover:bg-slate-50 transition'>
                                          <td className='px-4 py-2 font-semibold text-slate-700'>{item.domain}</td>
                                          <td className='px-4 py-2'>{item.total}</td>
                                          <td className='px-4 py-2'>{item.last30Days}</td>
                                          <td className='px-4 py-2'>
                                             <button
                                                type='button'
                                                className={destructiveActionButtonClasses}
                                                onClick={() => handleRequestDomainReset(item.domain)}
                                                disabled={isDomainResetting}>
                                                {isDomainResetting ? 'Reiniciando…' : 'Reiniciar'}
                                             </button>
                                          </td>
                                       </tr>
                                    );
                                 })}
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
                                    className={destructiveActionButtonClasses}
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
         <CSSTransition in={!!pendingRebuildDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <Modal closeModal={cancelDomainRebuild} title='Recalcular estadísticas desde la actividad'>
               <p className='text-sm text-slate-600'>
                  Se reconstruirán las estadísticas de
                  {' '}
                  <span className='font-semibold text-slate-800'>{pendingRebuildDomain}</span>
                  {' '}utilizando los registros existentes de actividad.
               </p>
               <p className='mt-3 text-xs text-slate-500'>Los logs no se modifican, pero las estadísticas actuales serán reemplazadas.</p>
               <div className='mt-4 flex justify-end gap-3'>
                  <button
                  type='button'
                  className='px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800'
                  onClick={cancelDomainRebuild}
                  disabled={isRebuildingDomainStats}>
                     Cancelar
                  </button>
                  <button
                  type='button'
                  className={'px-3 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 '
                  + 'disabled:opacity-60 disabled:cursor-not-allowed'}
                  onClick={confirmDomainRebuild}
                  disabled={isRebuildingDomainStats}>
                     {isRebuildingDomainStats ? 'Recalculando…' : 'Sí, recalcular'}
                  </button>
               </div>
            </Modal>
         </CSSTransition>
         <CSSTransition in={!!pendingResetDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
            <Modal closeModal={cancelDomainReset} title='Reiniciar estadísticas del dominio'>
               <p className='text-sm text-slate-600'>
                  Esta acción pondrá en cero las estadísticas registradas para
                  {' '}
                  <span className='font-semibold text-slate-800'>{pendingResetDomain}</span>
                  . Los logs permanecerán disponibles.
               </p>
               <div className='mt-4 flex justify-end gap-3'>
                  <button
                  type='button'
                  className='px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800'
                  onClick={cancelDomainReset}
                  disabled={isResettingDomainStats}>
                     Cancelar
                  </button>
                  <button
                  type='button'
                  className={'px-3 py-2 text-sm font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 '
                  + 'disabled:opacity-60 disabled:cursor-not-allowed'}
                  onClick={confirmDomainReset}
                  disabled={isResettingDomainStats}>
                     {isResettingDomainStats ? 'Reiniciando…' : 'Sí, reiniciar'}
                  </button>
               </div>
            </Modal>
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
