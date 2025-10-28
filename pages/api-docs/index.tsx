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

type ResponseBlockProps = {
  json: string;
  description?: string;
};

const ResponseBlock = ({ json, description }: ResponseBlockProps) => (
  <div className="space-y-2">
    {description && <p className="text-xs text-slate-600">{description}</p>}
    <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-4 overflow-x-auto">
      <code>{json}</code>
    </pre>
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
                  <ResponseBlock
                    description={
                      'Array de dominios. Con withstats=true incluye keywordCount, avgPosition, '
                      + 'keywordsUpdated, scVisits, scImpressions y scPosition.'
                    }
                    json={`{
  "domains": [
    {
      "domain": "example.com",
      "slug": "example-com",
      "keywordCount": 150,
      "avgPosition": 12.5,
      "keywordsUpdated": 145,
      "scVisits": 1250,
      "scImpressions": 25000,
      "scPosition": 8.3
    }
  ]
}`}
                  />
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
                  <ResponseBlock
                    description="Puedes enviar URLs completas o hosts."
                    json={`{
  "domains": [
    "example.com",
    "https://another-site.com"
  ]
}`}
                  />
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "domains": [
    {
      "domain": "example.com",
      "slug": "example-com",
      "added": "2025-01-15T10:30:00.000Z"
    }
  ]
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="DomainSettings: configuración de notificaciones, Search Console, competidores, etc."
                    json={`{
  "notification_interval": "daily",
  "notification_emails": ["admin@example.com"],
  "competitors": ["competitor1.com", "competitor2.com"],
  "auto_fetch_top20": true
}`}
                  />
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
                  <ResponseBlock
                    json={`{
  "domainRemoved": 1,
  "keywordsRemoved": 150,
  "SCDataRemoved": true
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "domain": {
    "domain": "example.com",
    "slug": "example-com",
    "notification_interval": "daily",
    "notification_emails": ["admin@example.com"],
    "competitors": ["competitor1.com", "competitor2.com"]
  }
}`}
                  />
                </InfoRow>
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
                      <span className="font-semibold">GET</span> · devuelve estadísticas de scraping
                    </li>
                    <li>
                      <span className="font-semibold">DELETE</span> · reinicia los contadores
                    </li>
                    <li>
                      <span className="font-semibold">POST</span> · reconstruye estadísticas desde logs
                    </li>
                  </ul>
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    description="GET respuesta:"
                    json={`{
  "stats": {
    "totalScrapes": 5000,
    "last30Days": 1200,
    "monthlyStats": {
      "2025-01": 800,
      "2024-12": 950
    }
  }
}`}
                  />
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
                dominio) y la última URL detectada en los resultados. Además expone el
                <code className="bg-slate-100 px-1 py-0.5 rounded ml-1 mr-1">metaTitle</code>
                y la
                <code className="bg-slate-100 px-1 py-0.5 rounded ml-1 mr-1">metaDescription</code>
                asociadas al resultado orgánico principal (coincidencia propia si existe, o el
                primer resultado disponible).
              </p>
              <dl className="space-y-2">
                <InfoRow label="Auth">API key o sesión.</InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    description="Incluye histórico de últimos 7 días, cannibalization, lastUrl, metaTitle y metaDescription."
                    json={`{
  "keywords": [
    {
      "ID": 123,
      "keyword": "hosting wordpress",
      "domain": "example.com",
      "position": 8,
      "url": "https://example.com/hosting",
      "device": "desktop",
      "country": "US",
      "cannibalization": false,
      "lastUrl": "https://example.com/hosting",
      "metaTitle": "Hosting WordPress Premium",
      "metaDescription": "El mejor hosting...",
      "history": {
        "2025-01-22": { "position": 8 },
        "2025-01-21": { "position": 9 }
      }
    }
  ],
  "competitors": ["competitor1.com"],
  "sortOrderSupported": true
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    description="Incluye histórico completo (no limitado a 7 días), metaTitle y metaDescription."
                    json={`{
  "keyword": {
    "ID": 123,
    "keyword": "hosting wordpress",
    "domain": "example.com",
    "position": 8,
    "url": "https://example.com/hosting",
    "device": "desktop",
    "country": "US",
    "metaTitle": "Hosting WordPress Premium",
    "metaDescription": "El mejor hosting...",
    "history": {
      "2025-01-22": { "position": 8 },
      "2025-01-21": { "position": 9 },
      "2025-01-20": { "position": 10 }
    },
    "lastResult": [
      {
        "position": 8,
        "url": "https://example.com/hosting",
        "title": "Hosting WordPress Premium",
        "snippet": "El mejor hosting...",
        "matchesDomain": true
      }
    ]
  }
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="Array de KeywordAddPayload con palabra, dominio, dispositivo, país, tags opcionales y ajustes."
                    json={`{
  "keywords": [
    {
      "keyword": "hosting wordpress",
      "domain": "example.com",
      "device": "desktop",
      "country": "US",
      "tags": "hosting,wordpress",
      "fetchTop20": true
    }
  ]
}`}
                  />
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
                  <ResponseBlock
                    description="Actualiza sticky, tags o configuración personalizada como serpPages."
                    json={`{
  "sticky": true,
  "tags": {
    "123": ["seo", "importante"]
  },
  "settings": {
    "fetchTop20": true,
    "serpPages": 2
  }
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "keywordsRemoved": 3
}`}
                  />
                </InfoRow>
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
                <InfoRow label="Body">
                  <ResponseBlock
                    description="Record mapeando keywordId a su posición de ordenamiento."
                    json={`{
  "sortOrder": {
    "123": 1,
    "124": 2,
    "125": 3
  }
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="Puede devolver la petición en background."
                    json={`{
  "keywords": [
    {
      "ID": 123,
      "keyword": "hosting wordpress",
      "updating": true
    }
  ]
}`}
                  />
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
                  <ResponseBlock
                    json={`{
  "searchResult": {
    "keyword": "hosting",
    "position": 0,
    "country": "US",
    "results": [
      {
        "position": 1,
        "url": "https://competitor.com",
        "title": "Best Hosting 2025"
      }
    ]
  }
}`}
                  />
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
                  <ResponseBlock
                    description="Array de IDs de keywords, dominio completo, o bandera update."
                    json={`{
  "keywords": [123, 124, 125],
  "domain": "example.com",
  "update": true
}`}
                  />
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "updated": true,
  "keywordsUpdated": 25
}`}
                  />
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
                  <ResponseBlock
                    json={`{
  "data": {
    "domain": "example.com",
    "lastFetched": "2025-01-22T10:00:00.000Z",
    "stats7": {
      "clicks": 1250,
      "impressions": 25000,
      "ctr": 5.0,
      "position": 8.3
    },
    "stats30": {
      "clicks": 5200,
      "impressions": 98000,
      "ctr": 5.3,
      "position": 8.1
    }
  }
}`}
                  />
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
                  <ResponseBlock
                    json={`{
  "status": "completed"
}`}
                  />
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
                  <ResponseBlock
                    json={`{
  "data": {
    "topPages": [
      {
        "page": "/hosting-wordpress",
        "clicks": 850,
        "impressions": 12000
      }
    ],
    "topKeywords": [
      {
        "keyword": "hosting wordpress",
        "clicks": 450,
        "position": 3.2
      }
    ],
    "topCountries": [
      {
        "country": "US",
        "clicks": 2500
      }
    ]
  }
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "started": true
}`}
                  />
                </InfoRow>
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "success": true
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="GET respuesta:"
                    json={`{
  "logs": [
    {
      "domain": "example.com",
      "timestamp": "2025-01-22T10:00:00.000Z",
      "keywordsScraped": 150,
      "duration": 45000
    }
  ],
  "stats": {
    "totalCount": 1250,
    "totalSizeBytes": 524288
  }
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "cleared": true
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="GET responde si hay migraciones pendientes. POST ejecuta las migraciones."
                    json={`{
  "hasMigrations": false
}`}
                  />
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "data": {
    "domain": "example.com",
    "lastUpdated": "2025-01-22T10:00:00.000Z",
    "ideas": [
      {
        "keyword": "hosting vps",
        "volume": 8100,
        "competition": "medium",
        "favorite": false
      }
    ]
  }
}`}
                  />
                </InfoRow>
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
                  <ResponseBlock
                    description="Solicita ideas desde Google Ads. seedType puede ser 'keywords', 'url' o 'current'."
                    json={`{
  "keywords": ["hosting", "wordpress"],
  "country": "US",
  "language": "en",
  "domain": "example.com",
  "seedType": "keywords",
  "seedSCKeywords": false,
  "seedCurrentKeywords": false
}`}
                  />
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "success": true,
  "ideasCount": 150
}`}
                  />
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
                <InfoRow label="Body">
                  <ResponseBlock
                    json={`{
  "keywordID": "hosting-vps",
  "domain": "example.com"
}`}
                  />
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "updated": true
}`}
                  />
                </InfoRow>
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
                  GET responde HTML plano para mostrar el resultado de la integración.
                </InfoRow>
                <InfoRow label="Body">
                  <ResponseBlock
                    description="POST body para validar credenciales:"
                    json={`{
  "developer_token": "YOUR_DEVELOPER_TOKEN",
  "account_id": "1234567890"
}`}
                  />
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
                  <ResponseBlock
                    description="Los campos sensibles se guardan cifrados."
                    json={`{
  "settings": {
    "scraper": "scrapingant",
    "notification_interval": "daily",
    "notification_email_from": "noreply@example.com",
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "version": "2.0.0"
  }
}`}
                  />
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
                <InfoRow label="Body">
                  <ResponseBlock
                    json={`{
  "username": "admin",
  "password": "your-password"
}`}
                  />
                </InfoRow>
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "success": true
}`}
                  />
                </InfoRow>
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
                <InfoRow label="Respuesta">
                  <ResponseBlock
                    json={`{
  "success": true
}`}
                  />
                </InfoRow>
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
