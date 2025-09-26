/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';

type SidebarProps = {
   domains: DomainType[],
   showAddModal: Function
}

const Sidebar = ({ domains, showAddModal } : SidebarProps) => {
   const router = useRouter();
   const [collapsed, setCollapsed] = useState(false);

   useEffect(() => {
      if (typeof window === 'undefined') { return; }
      const stored = localStorage.getItem('sidebar_collapsed');
      if (stored) {
         setCollapsed(stored === 'true');
      }
   }, []);

   const toggleCollapsed = () => {
      setCollapsed((prev) => {
         const next = !prev;
         if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar_collapsed', `${next}`);
         }
         return next;
      });
   };

   const baseClasses = 'sidebar relative hidden lg:flex flex-col h-[calc(100vh-5rem)]';
   const containerClasses = collapsed
      ? `${baseClasses} pt-6 w-[72px] text-center`
      : `${baseClasses} pt-44 w-1/5`;

   const isDomainActive = (slug: string) => (
      `/domain/${slug}` === router.asPath
      || `/domain/console/${slug}` === router.asPath
      || `/domain/insight/${slug}` === router.asPath
      || `/domain/ideas/${slug}` === router.asPath
      || `/domain/competitors/${slug}` === router.asPath
      || `/domain/stats/${slug}` === router.asPath
   );

   return (
      <div className={containerClasses} data-testid="sidebar">
         <button
            type='button'
            onClick={toggleCollapsed}
            className='absolute top-4 right-3 text-slate-500 hover:text-blue-600 transition'
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
         >
            <Icon type={collapsed ? 'caret-right' : 'caret-left'} size={18} />
         </button>
         {!collapsed && (
            <h3 className="py-7 text-base font-bold text-blue-700">
               <span className=' relative top-[3px] mr-1'><Icon type="logo" size={24} color="#364AFF" /></span> Kiwibear
            </h3>
         )}
         <div className={`sidebar_menu flex-1 overflow-y-auto styled-scrollbar ${collapsed ? 'mt-10' : ''}`}>
            <ul className=' font-medium text-sm'>
               {domains.map((d) => {
                  const isActive = isDomainActive(d.slug);
                  const linkClasses = collapsed
                     ? [
                        'block cursor-pointer px-0 py-3 rounded',
                        isActive ? 'bg-white border border-r-0 text-zinc-800' : 'text-zinc-500',
                     ].join(' ')
                     : [
                        'block cursor-pointer px-4 text-ellipsis max-w-[215px] overflow-hidden whitespace-nowrap rounded rounded-r-none',
                        isActive ? 'bg-white text-zinc-800 border border-r-0' : 'text-zinc-500',
                     ].join(' ');
                  return (
                     <li key={d.domain} className='my-2.5 leading-10'>
                        <Link href={`/domain/${d.slug}`} passHref={true}>
                           <a className={linkClasses} title={collapsed ? d.domain : undefined}>
                              <img
                                 className={`inline-block ${collapsed ? '' : 'mr-1'}`}
                                 src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=16`} alt={d.domain}
                              />
                              {!collapsed && d.domain}
                           </a>
                        </Link>
                     </li>
                  );
               })}
            </ul>
         </div>
         {!collapsed && (
            <div className='sidebar_add border-t font-semibold text-sm text-center mt-auto w-[80%] ml-3 text-zinc-500 pt-6'>
               <button data-testid="add_domain" onClick={() => showAddModal(true)} className='p-4 hover:text-blue-600'>+ Add Domain</button>
            </div>
         )}
      </div>
   );
};

export default Sidebar;
