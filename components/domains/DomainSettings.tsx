import { useRouter } from 'next/router';
import { useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useDeleteDomain, useFetchDomain, useUpdateDomain } from '../../services/domains';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';

type DomainSettingsProps = {
   domain:DomainType|false,
   closeModal: Function
}

type DomainSettingsError = {
   type: string,
   msg: string,
}

const DomainSettings = ({ domain, closeModal }: DomainSettingsProps) => {
   const router = useRouter();
   const [currentTab, setCurrentTab] = useState<'notification'|'searchconsole'|'competitors'|'keywords'>('notification');
   const [showRemoveDomain, setShowRemoveDomain] = useState<boolean>(false);
   const [settingsError, setSettingsError] = useState<DomainSettingsError>({ type: '', msg: '' });
   const [newCompetitor, setNewCompetitor] = useState<string>('');

   const parseCompetitors = (value?: string | null): string[] => {
      if (!value) { return []; }
      try {
         const parsed = JSON.parse(value);
         if (Array.isArray(parsed)) {
            return Array.from(new Set(parsed.map((item) => `${item}`.trim().toLowerCase()).filter((item) => !!item)));
         }
      } catch (error) {
         if (value.includes(',')) {
            return Array.from(new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter((item) => !!item)));
         }
      }
      const normalized = value.trim().toLowerCase();
      return normalized ? [normalized] : [];
   };

   const [domainSettings, setDomainSettings] = useState<DomainSettings>(() => ({
      notification_interval: domain && domain.notification_interval ? domain.notification_interval : 'never',
      notification_emails: domain && domain.notification_emails ? domain.notification_emails : '',
      search_console: domain && domain.search_console ? JSON.parse(domain.search_console) : {
         property_type: 'domain', url: '', client_email: '', private_key: '',
      },
      competitors: domain && domain.competitors ? parseCompetitors(domain.competitors) : [],
      auto_manage_top20: !!(domain && domain.auto_manage_top20),
   }));

   const { mutate: updateMutate, error: domainUpdateError, isLoading: isUpdating } = useUpdateDomain(() => closeModal(false));
   const { mutate: deleteMutate } = useDeleteDomain(() => { closeModal(false); router.push('/domains'); });

   // Get the Full Domain Data along with the Search Console API Data.
   useFetchDomain(router, domain && domain.domain ? domain.domain : '', (domainObj:DomainType) => {
      const currentSearchConsoleSettings = domainObj.search_console && JSON.parse(domainObj.search_console);
      const competitorsFromDomain = domainObj.competitors ? parseCompetitors(domainObj.competitors) : [];
      setDomainSettings((prev) => ({
         ...prev,
         search_console: currentSearchConsoleSettings || prev.search_console,
         competitors: competitorsFromDomain,
         auto_manage_top20: domainObj.auto_manage_top20 ?? prev.auto_manage_top20,
      }));
   });

   const updateDomain = () => {
      let error: DomainSettingsError | null = null;
      if (domainSettings.notification_emails) {
         const notification_emails = domainSettings.notification_emails.split(',');
         const invalidEmails = notification_emails.find((x) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,15})+$/.test(x) === false);
         console.log('invalidEmails: ', invalidEmails);
         if (invalidEmails) {
            error = { type: 'email', msg: 'Invalid Email' };
         }
      }
      if (error && error.type) {
         console.log('Error!!!!!');
         setSettingsError(error);
         setTimeout(() => {
            setSettingsError({ type: '', msg: '' });
         }, 3000);
      } else if (domain) {
         const sanitizedSettings: DomainSettings = {
            ...domainSettings,
            competitors: domainSettings.competitors || [],
            auto_manage_top20: !!domainSettings.auto_manage_top20,
         };
         updateMutate({ domainSettings: sanitizedSettings, domain });
      }
   };

   const addCompetitor = () => {
      const normalized = newCompetitor.trim().toLowerCase();
      if (!normalized) { return; }
      setDomainSettings((prev) => {
         const currentCompetitors = prev.competitors || [];
         if (currentCompetitors.includes(normalized)) {
            return prev;
         }
         return { ...prev, competitors: [...currentCompetitors, normalized] };
      });
      setNewCompetitor('');
   };

   const removeCompetitor = (competitor: string) => {
      setDomainSettings((prev) => ({
         ...prev,
         competitors: (prev.competitors || []).filter((item) => item !== competitor),
      }));
   };

   const tabStyle = `inline-block px-4 py-2 rounded-md mr-3 cursor-pointer text-sm select-none z-10
                     text-gray-600 border border-b-0 relative top-[1px] rounded-b-none`;
   return (
      <div>
         <Modal
         closeModal={() => closeModal(false)}
         title={'Domain Settings'}
         width="[640px]"
         desktopWidthClass='lg:max-w-2xl'
         verticalCenter={currentTab === 'searchconsole'} >
            <div data-testid="domain_settings" className=" text-sm">
               <div className=' mt-3 mb-5 border  border-slate-200 px-2 py-4 pb-0
               relative left-[-20px] w-[calc(100%+40px)] border-l-0 border-r-0 bg-[#f8f9ff]'>
                  <ul>
                     <li
                     className={`${tabStyle} ${currentTab === 'notification' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'} `}
                     onClick={() => setCurrentTab('notification')}>
                       <Icon type='email' /> Notification
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'searchconsole' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'}`}
                     onClick={() => setCurrentTab('searchconsole')}>
                        <Icon type='google' /> Search Console
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'competitors' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'}`}
                     onClick={() => setCurrentTab('competitors')}>
                        <Icon type='target' /> Competitors
                     </li>
                     <li
                     className={`${tabStyle} ${currentTab === 'keywords' ? ' bg-white text-blue-600 border-slate-200' : 'border-transparent'}`}
                     onClick={() => setCurrentTab('keywords')}>
                        <Icon type='trophy' /> Keywords
                     </li>
                  </ul>
               </div>

               <div>
                  {currentTab === 'notification' && (
                     <div className="mb-4 flex justify-between items-center w-full">
                        <InputField
                        label='Notification Emails'
                        onChange={(emails:string) => setDomainSettings({ ...domainSettings, notification_emails: emails })}
                        value={domainSettings.notification_emails || ''}
                        placeholder='Your Emails'
                        />
                     </div>
                  )}
                  {currentTab === 'searchconsole' && (
                     <>
                        <div className="mb-4 flex justify-between items-center w-full">
                           <label className='mb-2 font-semibold inline-block text-sm text-gray-700 capitalize'>Property Type</label>
                           <SelectField
                           options={[{ label: 'Domain', value: 'domain' }, { label: 'URL', value: 'url' }]}
                           selected={[domainSettings.search_console?.property_type || 'domain']}
                           defaultLabel="Select Search Console Property Type"
                           updateField={(updated:['domain'|'url']) => setDomainSettings({
                              ...domainSettings,
                              search_console: { ...(domainSettings.search_console as DomainSearchConsole), property_type: updated[0] || 'domain' },
                           })}
                           multiple={false}
                           rounded={'rounded'}
                           />
                        </div>
                        {domainSettings?.search_console?.property_type === 'url' && (
                           <div className="mb-4 flex justify-between items-center w-full">
                              <InputField
                              label='Property URL (Required)'
                              onChange={(url:string) => setDomainSettings({
                                 ...domainSettings,
                                 search_console: { ...(domainSettings.search_console as DomainSearchConsole), url },
                              })}
                              value={domainSettings?.search_console?.url || ''}
                              placeholder='Search Console Property URL. eg: https://mywebsite.com/'
                              />
                           </div>
                        )}
                        <div className="mb-4 flex justify-between items-center w-full">
                           <InputField
                           label='Search Console Client Email'
                           onChange={(client_email:string) => setDomainSettings({
                              ...domainSettings,
                              search_console: { ...(domainSettings.search_console as DomainSearchConsole), client_email },
                           })}
                           value={domainSettings?.search_console?.client_email || ''}
                           placeholder='myapp@appspot.gserviceaccount.com'
                           />
                        </div>
                        <div className="mb-4 flex flex-col justify-between items-center w-full">
                           <label className='mb-2 font-semibold block text-sm text-gray-700 capitalize w-full'>Search Console Private Key</label>
                           <textarea
                              className={`w-full p-2 border border-gray-200 rounded mb-3 text-xs 
                              focus:outline-none h-[100px] focus:border-blue-200`}
                              value={domainSettings?.search_console?.private_key || ''}
                              placeholder={'-----BEGIN PRIVATE KEY-----/ssssaswdkihad....'}
                              onChange={(event) => setDomainSettings({
                                 ...domainSettings,
                                 search_console: { ...(domainSettings.search_console as DomainSearchConsole), private_key: event.target.value },
                              })}
                           />
                       </div>
                    </>
                  )}
                  {currentTab === 'competitors' && (
                     <div className='space-y-4'>
                        <p className='text-sm text-gray-600'>Añade dominios de la competencia para analizar sus posiciones en tus keywords.</p>
                        <div className='flex gap-2 items-center'>
                           <input
                              className='flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-300'
                              placeholder='competidor.com'
                              value={newCompetitor}
                              onChange={(event) => setNewCompetitor(event.target.value)}
                              onKeyDown={(event) => {
                                 if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addCompetitor();
                                 }
                              }}
                           />
                           <button
                              className='px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded'
                              onClick={addCompetitor}>
                              Añadir
                           </button>
                        </div>
                        {(domainSettings.competitors && domainSettings.competitors.length > 0) ? (
                           <ul className='flex flex-wrap gap-2'>
                              {domainSettings.competitors.map((competitor) => (
                                 <li
                                    key={competitor}
                                    className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700
                                    px-3 py-1 rounded-full text-xs uppercase tracking-wide`}>
                                    {competitor}
                                    <button
                                       className='text-slate-500 hover:text-rose-500'
                                       onClick={() => removeCompetitor(competitor)}
                                       title='Eliminar competidor'>
                                       <Icon type='close' size={12} />
                                    </button>
                                 </li>
                              ))}
                           </ul>
                        ) : (
                           <p className='text-xs text-gray-500'>No se han añadido competidores todavía.</p>
                        )}
                     </div>
                  )}
                  {currentTab === 'keywords' && (
                     <div className='mb-4 flex justify-between items-start w-full gap-4'>
                        <div>
                           <p className='mb-1 font-semibold text-sm text-gray-700'>Gestión automática del Top 20</p>
                           <p className='text-xs text-gray-500 max-w-xs'>
                              Desactiva el seguimiento extendido cuando una keyword está en posición 7 o mejor y lo activa si cae fuera del top 10.
                           </p>
                        </div>
                        <label className='flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none'>
                           <input
                              type='checkbox'
                              className='accent-blue-600'
                              checked={!!domainSettings.auto_manage_top20}
                              onChange={(event) => setDomainSettings({ ...domainSettings, auto_manage_top20: event.target.checked })}
                           />
                           <span>{domainSettings.auto_manage_top20 ? 'Activo' : 'Inactivo'}</span>
                        </label>
                     </div>
                  )}
               </div>
               {!isUpdating && (domainUpdateError as Error)?.message && (
                  <div className='w-full mt-4 p-3 text-sm bg-red-50 text-red-700'>{(domainUpdateError as Error).message}</div>
               )}
               {!isUpdating && settingsError?.msg && (
                  <div className='w-full mt-4 p-3 text-sm bg-red-50 text-red-700'>{settingsError.msg}</div>
               )}
            </div>

            <div className="flex justify-between border-t-[1px] border-gray-100 mt-8 pt-4 pb-0">
               <button
               className="text-sm font-semibold text-red-500"
               onClick={() => setShowRemoveDomain(true)}>
                  <Icon type="trash" /> Remove Domain
               </button>
               <button
               className={`text-sm font-semibold py-2 px-5 rounded cursor-pointer bg-blue-700 text-white ${isUpdating ? 'cursor-not-allowed' : ''}`}
               onClick={() => !isUpdating && updateDomain()}>
                  {isUpdating && <Icon type='loading' />} Update Settings
               </button>
            </div>
         </Modal>
         {showRemoveDomain && domain && (
            <Modal closeModal={() => setShowRemoveDomain(false) } title={`Remove Domain ${domain.domain}`}>
               <div className='text-sm'>
                  <p>Are you sure you want to remove this Domain? Removing this domain will remove all its keywords.</p>
                  <div className='mt-6 text-right font-semibold'>
                     <button
                     className=' py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                     onClick={() => setShowRemoveDomain(false)}>
                        Cancel
                     </button>
                     <button
                     className=' py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                     onClick={() => deleteMutate(domain)}>
                        Remove

                     </button>
                  </div>
               </div>
            </Modal>
         )}
      </div>
   );
};

export default DomainSettings;
