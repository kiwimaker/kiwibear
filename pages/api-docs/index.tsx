import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import TopBar from '../../components/common/TopBar';
import AddDomain from '../../components/domains/AddDomain';
import Settings from '../../components/settings/Settings';
import Footer from '../../components/common/Footer';
import { useFetchDomains } from '../../services/domains';
import { useFetchSettings } from '../../services/settings';

type MethodPillProps = {
  method: string;
};

const methodClasses: Record<string, string> = {
  GET: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  POST: 'bg-sky-50 text-sky-700 border border-sky-200',
  PUT: 'bg-amber-50 text-amber-700 border border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border border-rose-200',
  PATCH: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

const MethodPill = ({ method }: MethodPillProps) => {
  const classes = methodClasses[method.toUpperCase()] || 'bg-slate-100 text-slate-700 border border-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase ${classes}`}
    >
      {method}
    </span>
  );
};

type InfoRowProps = {
  label: string;
  children: React.ReactNode;
};

const InfoRow = ({ label, children }: InfoRowProps) => (
  <div className="grid grid-cols-[120px_auto] gap-3">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-xs leading-relaxed text-slate-600">{children}</dd>
  </div>
);

const ApiDocsPage = () => {
  const router = useRouter();
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: domainsData } = useFetchDomains(router, false);
  const { data: appSettingsData } = useFetchSettings();

  const domains = domainsData?.domains || [];
  const currentVersion = appSettingsData?.settings?.version || '';

  const apiKeyRoutes = useMemo(
    () => [
      { method: 'GET', path: '/api/domains' },
      { method: 'GET', path: '/api/keyword?id={id}' },
      { method: 'GET', path: '/api/keywords?domain={domain}' },
      { method: 'POST', path: '/api/refresh?id={id|all}&domain={domain}' },
      { method: 'POST', path: '/api/cron' },
      { method: 'POST', path: '/api/notify?domain={domain?}' },
      { method: 'GET', path: '/api/searchconsole?domain={domain}' },
      { method: 'POST', path: '/api/searchconsole' },
      { method: 'GET', path: '/api/insight?domain={domain}' },
    ],
    [],
  );
  const llmLinkClasses = [
    'inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition',
    'hover:bg-blue-100',
  ].join(' ');

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>API Docs - KiwiBear</title>
      </Head>
      <TopBar
        showSettings={() => setShowSettings(true)}
        showAddModal={() => setShowAddDomain(true)}
      />
      <main className="w-full max-w-5xl mx-auto px-5 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800">KiwiBear API Reference</h1>
          <p className="mt-3 text-sm text-slate-600 max-w-3xl">
            La API de KiwiBear expone los mismos servicios que utiliza la aplicación web para
            gestionar dominios, palabras clave y datos de Search Console. Todas las rutas responden
            en JSON y se sirven bajo
            <span className="font-semibold"> /api</span>. Esta página resume cómo autenticarse, qué
            endpoints están disponible y qué payload espera cada uno.
          </p>
          <div className="mt-4">
            <a
              className={llmLinkClasses}
              href="/api-docs/llm.txt"
            >
              <span>Ver llm.txt (solo autenticación, dominios y keywords)</span>
            </a>
          </div>
        </header>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Autenticación y seguridad</h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4 text-sm text-slate-600">
            <p>
              Cada petición debe ir autenticada con una sesión de usuario (cookie{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">token</code>) o con una API key
              dedicada. Configura el valor de la clave en el servidor mediante la variable de
              entorno
              <code className="bg-slate-100 px-1 py-0.5 rounded ml-1">APIKEY</code>.
            </p>
            <div>
              <p className="font-semibold text-slate-700 mb-2">
                Cabecera para autenticación con API key
              </p>
              <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-4 overflow-x-auto">
                        <code>Authorization: Bearer YOUR_API_KEY</code>
              </pre>
              <p className="mt-2 text-xs text-slate-500">
                Sustituye <code className="bg-slate-100 px-1 py-0.5 rounded">APIKEY</code> por el
                valor configurado en el entorno.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-2">Rutas permitidas con API key</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {apiKeyRoutes.map((route) => (
                  <div
                    key={`${route.method}-${route.path}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                  >
                    <MethodPill method={route.method} />
                    <span className="font-mono">{route.path}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                El resto de endpoints requieren una sesión iniciada mediante{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">/api/login</code>.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Dominios</h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domains?withstats=true
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Devuelve la lista completa de dominios registrados. Con el flag opcional
                <code className="bg-slate-100 px-1 py-0.5 rounded ml-1">withstats=true</code>
                incluye aggregate de keywords y métricas recientes.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key (GET) o sesión iniciada.</InfoRow>
                <InfoRow label="Query params">
                  <code className="bg-slate-100 px-1 py-0.5 rounded">withstats</code> (opcional,
                  boolean).
                </InfoRow>
                <InfoRow label="Respuesta">
                  <span>
                    <code className="bg-slate-100 px-1 py-0.5 rounded">domains</code> array de{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">DomainType</code>. Cuando se
                    solicita con estadísticas añade&nbsp;
                    <code className="bg-slate-100 px-1 py-0.5 rounded">keywordCount</code>,
                    <code className="bg-slate-100 px-1 py-0.5 rounded">avgPosition</code>,
                    <code className="bg-slate-100 px-1 py-0.5 rounded">keywordsUpdated</code>,
                    <code className="bg-slate-100 px-1 py-0.5 rounded">scVisits</code>,
                    <code className="bg-slate-100 px-1 py-0.5 rounded">scImpressions</code> y
                    <code className="bg-slate-100 px-1 py-0.5 rounded">scPosition</code>.
                  </span>
                </InfoRow>
              </dl>
              <pre className="mt-4 bg-slate-900 text-slate-100 text-xs rounded-lg p-4 overflow-x-auto">
                <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
-H "Accept: application/json" \\
${'--'}request GET https://tu-servidor/api/domains?withstats=true`}</code>
              </pre>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domains
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Crea uno o varios dominios nuevos. Cada dominio se normaliza para generar el{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">slug</code>.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Solo sesión (no disponible con API key).</InfoRow>
                <InfoRow label="Body">
                  <code className="bg-slate-100 px-1 py-0.5 rounded">
                    {'{ domains: string[] }'}
                  </code>
                  . Puedes enviar URLs completas o hosts.
                </InfoRow>
                <InfoRow label="Respuesta">{'{ domains: DomainType[] }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="PUT" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domains?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Actualiza la configuración de notificaciones, Search Console, competidores o gestión
                automática de Top 20 para un dominio concreto.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Solo sesión.</InfoRow>
                <InfoRow label="Query params">
                  <code className="bg-slate-100 px-1 py-0.5 rounded">domain</code> obligatorio.
                </InfoRow>
                <InfoRow label="Body">
                  <code className="bg-slate-100 px-1 py-0.5 rounded">DomainSettings</code> (ver{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded">types.d.ts</code>).
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="DELETE" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domains?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Elimina un dominio, sus keywords asociadas y el histórico almacenado en Search
                Console local.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Solo sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  {'{ domainRemoved, keywordsRemoved, SCDataRemoved }'}
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domain?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Recupera la ficha detallada de un dominio. Si hay credenciales de Search Console
                cifradas se devuelven desencriptadas.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión o API key.</InfoRow>
                <InfoRow label="Respuesta">{'{ domain: DomainType | null }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <MethodPill method="DELETE" />
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/domain/stats?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Gestiona las estadísticas de scraping (totales, últimos 30 días y agregados
                mensuales) asociadas a un dominio.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Operaciones">
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>
                      <span className="font-semibold">GET</span> · devuelve{' '}
                      <code className="bg-slate-100 px-1 py-0.5 rounded">stats</code>.
                    </li>
                    <li>
                      <span className="font-semibold">DELETE</span> · reinicia los contadores para
                      el dominio.
                    </li>
                    <li>
                      <span className="font-semibold">POST</span> · reconstruye las estadísticas a
                      partir de los logs (
                      <code className="bg-slate-100 px-1 py-0.5 rounded">rebuild</code>).
                    </li>
                  </ul>
                </InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Keywords</h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keywords?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Lista las keywords de un dominio, incluyendo histórico condensado (últimos 7 días),
                tags, datos Search Console integrados y captura rápida de competidores. Incluye
                detección de canibalización (cuando una keyword posiciona múltiples URLs del mismo
                dominio) y la última URL detectada en los resultados.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  <span>
                    {
                      '{ keywords: KeywordType[], competitors: string[], sortOrderSupported: boolean }'
                    }
                    . Cada keyword incluye{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">cannibalization</code>{' '}
                    (boolean) y{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">lastUrl</code> (string).
                  </span>
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keyword?id=123
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Devuelve una keyword individual con su histórico completo y, si procede, snapshot de
                competidores.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ keyword: KeywordType | null }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keywords
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Inserta keywords nuevas y dispara el proceso de scraping y actualización de volumen
                si Google Ads está integrado.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">
                  {'{ keywords: KeywordAddPayload[] }'} (palabra, dominio, dispositivo, país, tags
                  opcionales y ajustes como{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded">fetchTop20</code>).
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="PUT" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keywords?id=1,2,3
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Actualiza propiedades de keywords existentes: sticky, tags o ajustes personalizados
                (p.ej. páginas de SERP a scrapear).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">
                  {
                    '{ sticky?: boolean, tags?: Record<string, string[]>, settings?: KeywordCustomSettings }'
                  }
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="DELETE" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keywords?id=1,2,3
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Elimina una o varias keywords según sus IDs.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ keywordsRemoved: number }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="PUT" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/keywords-order
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Reordena keywords asignando un valor numérico por dominio.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">{'{ sortOrder: Record<keywordId, number> }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/refresh?id=all&domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Re-lanza el scraping de una selección de keywords o de todas las keywords de un
                dominio.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión (solo POST).</InfoRow>
                <InfoRow label="Query params">
                  <span>
                    <code className="bg-slate-100 px-1 py-0.5 rounded">id</code> admite lista de IDs
                    o el literal <code className="bg-slate-100 px-1 py-0.5 rounded">all</code>. Si
                    usas <em>all</em>, añade{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded ml-1">domain</code>.
                  </span>
                </InfoRow>
                <InfoRow label="Respuesta">
                  {'{ keywords: KeywordType[] }'} (puede devolver la petición en background).
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/refresh?keyword=hosting&country=US&device=desktop
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Scrapeo puntual de un término sin necesidad de crearlo en la base de datos. Requiere
                que el scraper esté configurado.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  {'{ searchResult: { keyword, position, country, results[] } }'}
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/volume
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Actualiza datos de volumen de búsqueda para un conjunto de keywords usando Google
                Ads.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">
                  {'{ keywords?: number[], domain?: string, update?: boolean }'}
                </InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Search Console e insights</h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/searchconsole?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Devuelve el dataset cacheado de Search Console (7, 30 días, etc.). Si no existe en
                disco y el dominio tiene credenciales válidas, se consulta la API de Google y se
                guarda localmente.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  {'{ data: SCDomainDataType | null, error?: string }'}
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/searchconsole
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Fuerza la actualización de los datos Search Console para todos los dominios que
                tengan integración configurada.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  {"{ status: 'completed' | 'failed', error?: string }"}
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/insight?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Genera insights agregados (páginas, keywords y países con más rendimiento) a partir
                del dataset de Search Console.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  {'{ data: InsightDataType | null, error?: string }'}
                </InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Automatización y mantenimiento
          </h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/cron
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Marca todas las keywords como pendientes y arranca el refresco global. Es la ruta
                que consume el script{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">npm run cron</code>.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ started: boolean, error?: string }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/notify?domain=example.com
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Dispara el envío de emails de notificación usando la configuración SMTP del sistema.
                Si no se indica dominio se envía para todos.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ success: boolean, error?: string }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <MethodPill method="DELETE" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/logs/domain-scrape?domain=example.com&amp;limit=50
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Gestiona el registro histórico de tareas de scraping ejecutadas (logs y tamaño
                aproximado almacenado).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  <span>
                    GET: {'{ logs: DomainScrapeLogType[], stats: { totalCount, totalSizeBytes } }'}{' '}
                    · DELETE: {'{ success: boolean, cleared: number }'}
                  </span>
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="PUT" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/clearfailed
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Vacía la cola de tareas fallidas guardada en{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">data/failed_queue.json</code>.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ cleared: true }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/dbmigrate
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Consultar o ejecutar migraciones pendientes de la base de datos SQLite mediante
                Umzug.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  <span>
                    GET: {'{ hasMigrations: boolean }'} · POST: {'{ migrated: boolean }'}
                  </span>
                </InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Ideas y Google Ads</h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/ideas?domain=research
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Lee la última base local de ideas de keywords guardadas para un dominio o para el
                área de investigación.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">{'{ data: KeywordIdeasDatabase | null }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/ideas
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Solicita nuevas ideas a Google Ads (requiere credenciales guardadas e integración
                validada).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">
                  {
                    '{ keywords?: string[], country: string, language: string, domain?: string, seedType, seedSCKeywords?, seedCurrentKeywords? }'
                  }
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="PUT" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/ideas
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Marca o desmarca una idea como favorita para un dominio concreto.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Body">{'{ keywordID: string, domain: string }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/adwords
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Gestiona la integración con Google Ads: intercambio del código de autorización por
                refresh token (GET) y validación de credenciales (POST).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Notas">
                  <span>
                    GET responde HTML plano para mostrar el resultado de la integración. POST espera{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">developer_token</code> y{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">account_id</code>.
                  </span>
                </InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Configuración y autenticación
          </h2>
          <div className="space-y-6">
            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="GET" />
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/settings
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Lee o actualiza la configuración global (scraper, SMTP, integraciones, columnas
                visibles, etc.).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">Sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  GET: {'{ settings: SettingsType }'} · POST: {'{ settings: SettingsType }'} (los
                  campos sensibles se guardan cifrados).
                </InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/login
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Inicia sesión intercambiando usuario y contraseña por una cookie firmada (
                <code className="bg-slate-100 px-1 py-0.5 rounded">token</code>). Usa las variables
                de entorno <code className="bg-slate-100 px-1 py-0.5 rounded">USER_NAME</code> /{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">USER</code>,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">PASSWORD</code> y{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">SECRET</code>.
              </p>
              <dl className="space-y-2">
                <InfoRow label="Body">{'{ username: string, password: string }'}</InfoRow>
                <InfoRow label="Respuesta">{'{ success: boolean, error?: string }'}</InfoRow>
              </dl>
            </article>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm font-semibold text-slate-700">
                <MethodPill method="POST" />
                <code className="bg-slate-100 text-xs text-slate-700 px-2 py-1 rounded">
                  /api/logout
                </code>
              </div>
              <p className="text-sm text-slate-600 mb-4">Revoca la cookie de sesión actual.</p>
              <dl className="space-y-2">
                <InfoRow label="Respuesta">{'{ success: boolean }'}</InfoRow>
              </dl>
            </article>
          </div>
        </section>

        <section className="mb-10">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
            <h3 className="text-base font-semibold mb-2">Buenas prácticas</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Establece un User-Agent identificable en tus peticiones si integras KiwiBear con
                otros servicios.
              </li>
              <li>
                Respeta el ritmo del scraper configurando{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">scrape_delay</code> y usando
                colas externas si automatizas refrescos masivos.
              </li>
              <li>
                Recuerda proteger{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">data/settings.json</code> y la
                base SQLite mediante backups y permisos restrictivos.
              </li>
            </ul>
          </div>
        </section>
      </main>
      <Footer currentVersion={currentVersion} />

      <CSSTransition
        in={showAddDomain}
        timeout={300}
        classNames="settings_anim"
        unmountOnExit
        mountOnEnter
      >
        <AddDomain domains={domains} closeModal={setShowAddDomain} />
      </CSSTransition>
      <CSSTransition
        in={showSettings}
        timeout={300}
        classNames="settings_anim"
        unmountOnExit
        mountOnEnter
      >
        <Settings closeSettings={() => setShowSettings(false)} />
      </CSSTransition>
    </div>
  );
};

export default ApiDocsPage;
