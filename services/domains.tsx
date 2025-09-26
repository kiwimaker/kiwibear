import { useRouter, NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

type UpdatePayload = {
   domainSettings: DomainSettings,
   domain: DomainType
}

export async function fetchDomains(router: NextRouter, withStats:boolean): Promise<{domains: DomainType[]}> {
   const res = await fetch(`${window.location.origin}/api/domains${withStats ? '?withstats=true' : ''}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export async function fetchDomain(router: NextRouter, domainName: string): Promise<{domain: DomainType}> {
   if (!domainName) { throw new Error('No Domain Name Provided!'); }
   const res = await fetch(`${window.location.origin}/api/domain?domain=${domainName}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export async function fetchDomainScreenshot(domain: string, screenshot_key:string, forceFetch = false): Promise<string | false> {
   const domainThumbsRaw = localStorage.getItem('domainThumbs');
   const domThumbs = domainThumbsRaw ? JSON.parse(domainThumbsRaw) : {};
   if (!domThumbs[domain] || forceFetch) {
      try {
         const screenshotURL = `https://image.thum.io/get/auth/${screenshot_key}/maxAge/96/width/200/https://${domain}`;
         const domainImageRes = await fetch(screenshotURL);
         const domainImageBlob = domainImageRes.status === 200 ? await domainImageRes.blob() : false;
         if (domainImageBlob) {
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
               reader.onload = resolve;
               reader.onerror = reject;
               reader.readAsDataURL(domainImageBlob);
            });
            const imageBase: string = reader.result && typeof reader.result === 'string' ? reader.result : '';
            localStorage.setItem('domainThumbs', JSON.stringify({ ...domThumbs, [domain]: imageBase }));
            return imageBase;
         }
         return false;
      } catch (error) {
         return false;
      }
   } else if (domThumbs[domain]) {
         return domThumbs[domain];
   }

   return false;
}

export function useFetchDomains(router: NextRouter, withStats:boolean = false) {
   return useQuery('domains', () => fetchDomains(router, withStats));
}

export function useFetchDomain(router: NextRouter, domainName:string, onSuccess: Function) {
   return useQuery('domain', () => fetchDomain(router, domainName), {
      onSuccess: async (data) => {
         console.log('Domain Loaded!!!', data.domain);
         onSuccess(data.domain);
      } });
}

export async function fetchDomainStats(domain: string): Promise<{ stats: DomainStatsType }> {
   if (!domain) { throw new Error('No Domain Name Provided!'); }
   const res = await fetch(`${window.location.origin}/api/domain/stats?domain=${domain}`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchDomainStats(domainName:string) {
   return useQuery(['domain-stats', domainName], () => fetchDomainStats(domainName));
}

export type GlobalStatsResponse = {
   domains: { domain: string, total: number, last30Days: number }[],
   totals: { totalScrapes: number, last30Days: number },
};

export async function fetchGlobalStats(): Promise<GlobalStatsResponse> {
   const res = await fetch(`${window.location.origin}/api/stats`, { method: 'GET' });
   if (res.status >= 400 && res.status < 600) {
      throw new Error('Bad response from server');
   }
   return res.json();
}

export function useFetchGlobalStats() {
   return useQuery('global-stats', fetchGlobalStats);
}

export function useAddDomain(onSuccess:Function) {
   const router = useRouter();
   const queryClient = useQueryClient();
   return useMutation(async (domains:string[]) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify({ domains }) };
      const res = await fetch(`${window.location.origin}/api/domains`, fetchOpts);
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async (data) => {
         console.log('Domain Added!!!', data);
         const newDomain:DomainType[] = data.domains;
         const singleDomain = newDomain.length === 1;
         toast(`${singleDomain ? newDomain[0].domain : `${newDomain.length} domains`} Added Successfully!`, { icon: '✔️' });
         onSuccess(false);
         if (singleDomain) {
            router.push(`/domain/${newDomain[0].slug}`);
         }
         queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
         console.log('Error Adding New Domain!!!');
         toast('Error Adding New Domain');
      },
   });
}

export function useUpdateDomain(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation(async ({ domainSettings, domain }: UpdatePayload) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify(domainSettings) };
      const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, fetchOpts);
      const responseObj = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(responseObj?.error || 'Bad response from server');
      }
      return responseObj;
   }, {
      onSuccess: async () => {
         console.log('Settings Updated!!!');
         toast('Settings Updated!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries(['domains']);
      },
      onError: (error) => {
         console.log('Error Updating Domain Settings!!!', error);
         toast('Error Updating Domain Settings', { icon: '⚠️' });
      },
   });
}

export function useDeleteDomain(onSuccess:Function) {
   const queryClient = useQueryClient();
   return useMutation(async (domain:DomainType) => {
      const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, { method: 'DELETE' });
      if (res.status >= 400 && res.status < 600) {
         throw new Error('Bad response from server');
      }
      return res.json();
   }, {
      onSuccess: async () => {
         toast('Domain Removed Successfully!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
         console.log('Error Removing Domain!!!');
         toast('Error Removing Domain', { icon: '⚠️' });
      },
   });
}
