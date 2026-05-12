// ============================================================
//  LUMART COMERCIAL — Service Worker (PWA · Fase 10)
//  ============================================================
//  Estratégia: stale-while-revalidate
//    - Recursos cacheados são servidos imediatamente
//    - Em paralelo, é feita uma chamada à rede para actualizar o cache
//    - Próxima visita já mostra a versão mais recente
//
//  Cache buckets:
//    lumart-static-vN  → HTML/CSS/JS da app
//    lumart-images-vN  → imagens de produtos (com expiração de 7 dias)
//
//  Quando precisares de forçar refresh em todos os clientes:
//    - Aumentar CACHE_VERSION abaixo
//    - O activate handler limpa caches antigas automaticamente
//
//  Admin (admin.html, admin.js, admin.css) NÃO é cacheado de
//  propósito — queremos sempre a versão mais fresca.
// ============================================================

const CACHE_VERSION = "v1";
const STATIC_CACHE  = `lumart-static-${CACHE_VERSION}`;
const IMAGES_CACHE  = `lumart-images-${CACHE_VERSION}`;
const IMAGES_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7 dias

// Recursos a pré-cachear no install
const PRECACHE = [
  "/",
  "/index.html",
  "/produto.html",
  "/checkout.html",
  "/style.css",
  "/produtos.js",
  "/carrinho.js",
  "/pdf.js",
  "/produto-page.js",
  "/checkout.js",
  "/politicas.js",
  "/componentes.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Padrões que NUNCA devem ser cacheados (sempre rede)
const NEVER_CACHE = [
  /\/admin\.html$/,
  /\/admin\.js$/,
  /\/admin\.css$/,
  /\bwa\.me\b/,
  /\/cdn\.jsdelivr\.net\b/,     // jsPDF — usa cache do CDN
  /\/fonts\.googleapis\.com\b/, // Google Fonts — usa cache do Google
  /\/fonts\.gstatic\.com\b/,
];

// Tem ?source=pwa-shortcut → não cachear (vai para start_url normal)
function deveIgnorarCache(url) {
  return NEVER_CACHE.some(rgx => rgx.test(url));
}

// Detectar se um pedido é de imagem (extension ou content-type)
function ehImagem(req) {
  if (/\.(png|jpg|jpeg|webp|gif|svg|avif)(\?|$)/i.test(req.url)) return true;
  const accept = req.headers.get("accept") || "";
  return accept.includes("image/");
}

// ── Install: pré-cachear recursos essenciais ────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.warn("[SW] Falha no pré-cache:", err))
  );
});

// ── Activate: limpar caches antigas ─────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes
          .filter(nome => nome.startsWith("lumart-") &&
                          nome !== STATIC_CACHE &&
                          nome !== IMAGES_CACHE)
          .map(nome => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: stale-while-revalidate ────────────────────────────────
self.addEventListener("fetch", event => {
  const req = event.request;

  // Só GET é cacheável
  if (req.method !== "GET") return;

  // Ignorar requests para domínios na blacklist
  if (deveIgnorarCache(req.url)) return;

  // Imagens têm bucket próprio com expiração
  if (ehImagem(req)) {
    event.respondWith(staleWhileRevalidateImagens(req));
    return;
  }

  // Tudo o resto (HTML, CSS, JS) — stale-while-revalidate normal
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});

// Estratégia genérica: serve do cache, actualiza em background
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  // Promise para actualizar em background
  const fetchPromise = fetch(req)
    .then(resp => {
      // Só cachear respostas 200 (não 4xx/5xx) e do mesmo origin/opaque
      if (resp && resp.status === 200) {
        cache.put(req, resp.clone()).catch(() => {});
      }
      return resp;
    })
    .catch(err => {
      // Sem rede: devolve o cache (se houver). Caso contrário, propaga erro
      return cached || Promise.reject(err);
    });

  // Se temos cache, devolve já. Caso contrário, espera pela rede
  return cached || fetchPromise;
}

// Estratégia para imagens: como acima mas com verificação de TTL
async function staleWhileRevalidateImagens(req) {
  const cache = await caches.open(IMAGES_CACHE);
  const cached = await cache.match(req);

  // Verificar se o cache expirou
  let cacheExpirado = false;
  if (cached) {
    const dataCache = cached.headers.get("x-lumart-cache-time");
    if (dataCache) {
      const idade = Date.now() - parseInt(dataCache, 10);
      cacheExpirado = idade > IMAGES_TTL_MS;
    }
  }

  const fetchPromise = fetch(req)
    .then(async resp => {
      if (resp && resp.status === 200) {
        // Clonar e adicionar timestamp custom no header
        const cloneComTimestamp = new Response(await resp.clone().blob(), {
          status: resp.status,
          statusText: resp.statusText,
          headers: {
            ...Object.fromEntries(resp.headers.entries()),
            "x-lumart-cache-time": String(Date.now()),
          },
        });
        cache.put(req, cloneComTimestamp).catch(() => {});
      }
      return resp;
    })
    .catch(err => cached || Promise.reject(err));

  // Se há cache válido e não expirado, devolve já
  if (cached && !cacheExpirado) return cached;

  // Cache expirado mas existe — devolve já mesmo assim,
  // e a rede actualiza em background (não bloquear o utilizador)
  if (cached && cacheExpirado) {
    fetchPromise.catch(() => {});
    return cached;
  }

  // Sem cache — esperar pela rede
  return fetchPromise;
}

// ── Mensagens do cliente para o SW ──────────────────────────────
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "CLEAR_CACHE") {
    caches.keys().then(nomes => Promise.all(nomes.map(n => caches.delete(n))));
  }
});
