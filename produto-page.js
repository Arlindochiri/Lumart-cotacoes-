// ============================================================
//  LUMART — Página Individual do Produto
//  ============================================================
//  Lógica de:
//    - Carregamento do produto via ?id= na URL
//    - Galeria de imagens com lightbox e zoom
//    - Reprodutor de vídeo YouTube com capa custom
//    - Render de reviews
//    - Render de produtos relacionados
//    - Botões: Adicionar ao carrinho + Comprar via WhatsApp
// ============================================================

let produtoActual = null;
let imagemActualIndex = 0;

// ────────────────────────────────────────────────────────────
//  Inicialização
// ────────────────────────────────────────────────────────────
function initProdutoPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  produtoActual = PRODUTOS.find(p => p.id === id);

  // Produto não existe
  if (!produtoActual) {
    document.getElementById("produto-conteudo").innerHTML = `
      <div class="produto-erro">
        <h1>Produto não encontrado</h1>
        <p>O produto que procura não existe ou foi removido.</p>
        <a href="index.html" class="btn-voltar-erro">← Voltar ao catálogo</a>
      </div>`;
    document.title = "Produto não encontrado · Lumart";
    return;
  }

  // Produto pausado (escondido pelo admin)
  if (produtoActual.ativo === false) {
    document.getElementById("produto-conteudo").innerHTML = `
      <div class="produto-erro">
        <h1>Produto temporariamente indisponível</h1>
        <p>Este produto está actualmente fora de catálogo.<br/>Por favor, consulte os outros produtos disponíveis.</p>
        <a href="index.html" class="btn-voltar-erro">← Voltar ao catálogo</a>
      </div>`;
    document.title = "Produto indisponível · Lumart";
    produtoActual = null; // bloquear o resto da renderização
    return;
  }

  document.title = `${produtoActual.nome} · Lumart Comercial`;

  // SEO dinâmico: meta description + OG + Schema.org
  atualizarSEOProduto();

  renderizarBreadcrumb();
  renderizarProdutoPrincipal();
  renderizarVideo();
  renderizarReviews();
  renderizarRelacionados();

  // Atualizar UI do carrinho (badge, etc.)
  if (typeof atualizarUI === "function") atualizarUI();

  // Animação de entrada
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
  }, 100);
}

// ────────────────────────────────────────────────────────────
//  SEO Dinâmico — Atualiza meta tags e Schema.org
// ────────────────────────────────────────────────────────────
function atualizarSEOProduto() {
  const p = produtoActual;
  const precoFinal = precoComDesconto(p);

  // Meta description
  const desc = `${p.nome} (${p.marca}) — ${p.descricao.substring(0, 140)}...`;
  setMetaContent('meta[name="description"]', desc);

  // Open Graph
  setMetaContent('#og-title', `${p.nome} · Lumart Comercial`, "content");
  setMetaContent('#og-description', desc, "content");
  setMetaContent('#og-image', p.imagens[0], "content");

  // Schema.org Product
  const schema = document.getElementById("schema-product");
  if (schema) {
    const media = mediaReviews(p);
    const dispMap = {
      disponivel: "https://schema.org/InStock",
      sob_encomenda: "https://schema.org/PreOrder",
    };
    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.nome,
      "description": p.descricao,
      "image": p.imagens,
      "brand": { "@type": "Brand", "name": p.marca },
      "category": p.categoria,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "MZN",
        "price": precoFinal.toFixed(2),
        "availability": dispMap[p.disponibilidade] || "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": "Lumart Comercial" },
      },
    };
    if (p.reviews && p.reviews.length > 0) {
      data.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": media.toFixed(1),
        "reviewCount": p.reviews.length,
      };
      data.review = p.reviews.map(r => ({
        "@type": "Review",
        "author": { "@type": "Person", "name": r.nome },
        "datePublished": r.data,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.estrelas,
          "bestRating": 5,
        },
        "reviewBody": r.comentario,
      }));
    }
    schema.textContent = JSON.stringify(data, null, 2);
  }
}

function setMetaContent(selector, value, attr = "content") {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

// ────────────────────────────────────────────────────────────
//  Breadcrumb
// ────────────────────────────────────────────────────────────
function renderizarBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  if (!el) return;
  el.innerHTML = `
    <a href="index.html">Catálogo</a>
    <span class="bc-sep">›</span>
    <a href="index.html?cat=${encodeURIComponent(produtoActual.categoria)}">${produtoActual.categoria}</a>
    <span class="bc-sep">›</span>
    <span class="bc-current">${produtoActual.nome}</span>
  `;
}

// ────────────────────────────────────────────────────────────
//  Produto Principal — Galeria + Info
// ────────────────────────────────────────────────────────────
function renderizarProdutoPrincipal() {
  const p = produtoActual;
  const temDesconto  = p.desconto && p.desconto > 0;
  const precoFinal   = precoComDesconto(p);
  const dispLabel    = p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda";
  const dispClasse   = p.disponibilidade === "disponivel" ? "disp-stock" : "disp-encomenda";
  const media        = mediaReviews(p);
  const numReviews   = p.reviews ? p.reviews.length : 0;
  const emCart       = !!carrinho.find(i => i.id === p.id);

  // Texto informativo da disponibilidade
  const infoDisp = p.disponibilidade === "disponivel"
    ? {
        titulo: "Em stock — envio imediato",
        texto: "Este produto está disponível para envio imediato após confirmação do pagamento.",
        termos: "Pagamento: 60% no pedido + 40% na entrega",
      }
    : {
        titulo: "Sob encomenda — importação directa",
        texto: "Este produto é importado sob encomenda da Ásia ou América. Após confirmação do pagamento de 75%, iniciamos a importação directa para o seu endereço.",
        termos: "Pagamento: 75% no pedido + 25% na entrega · Prazo: 10–30 dias úteis",
      };

  document.getElementById("produto-conteudo").innerHTML = `
    <div class="produto-layout">

      <!-- Galeria -->
      <div class="produto-galeria reveal">
        <div class="galeria-thumbs" id="galeria-thumbs">
          ${p.imagens.map((img, i) => `
            <button class="thumb ${i === 0 ? 'activa' : ''}" data-i="${i}" onclick="trocarImagem(${i})">
              <img src="${img}" alt="${p.nome} - imagem ${i+1}" class="carregando"
                   onload="this.classList.remove('carregando')"
                   onerror="this.classList.remove('carregando')" />
            </button>
          `).join("")}
        </div>
        <div class="galeria-main">
          <img id="img-principal" class="carregando" src="${p.imagens[0]}" alt="${p.nome}"
               onclick="abrirLightbox(${0})"
               onload="this.classList.remove('carregando')"
               onerror="this.classList.remove('carregando')" />
          <button class="btn-zoom" onclick="abrirLightbox(imagemActualIndex)" aria-label="Ampliar imagem">
            <span class="lmi lmi-sm" aria-hidden="true">zoom_in</span>
          </button>
          <span class="img-counter"><span id="img-num">1</span> / ${p.imagens.length}</span>
          <div class="galeria-badges">
            ${p.destaque  ? '<span class="card-badge">⭐ Destaque</span>' : ''}
            ${temDesconto ? `<span class="card-badge badge-desc">−${p.desconto}%</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="produto-info reveal">
        <div class="info-marca">${p.marca}</div>
        <h1 class="info-nome">${p.nome}</h1>

        <div class="info-rating">
          <div class="estrelas">${renderEstrelas(media)}</div>
          <span class="rating-num">${media.toFixed(1)}</span>
          <span class="rating-count">(${numReviews} ${numReviews === 1 ? 'avaliação' : 'avaliações'})</span>
        </div>

        <div class="info-preco-wrap">
          ${temDesconto ? `<span class="info-preco-old">${formatarMZN(p.preco)}</span>` : ''}
          <span class="info-preco">${formatarMZN(precoFinal)}</span>
          ${temDesconto ? `<span class="info-poupa">Poupe ${formatarMZN(p.preco - precoFinal)}</span>` : ''}
        </div>

        <div class="info-disp">
          <span class="card-badge ${dispClasse}">${dispLabel}</span>
        </div>

        <div class="info-descricao">
          <p>${p.descricao}</p>
        </div>

        <div class="info-caixa">
          <div class="caixa-icon">
            ${p.disponibilidade === "disponivel"
              ? '<span class="lmi lmi-lg" aria-hidden="true">check_circle</span>'
              : '<span class="lmi lmi-lg" aria-hidden="true">inventory_2</span>'}
          </div>
          <div class="caixa-texto">
            <strong>${infoDisp.titulo}</strong>
            <p>${infoDisp.texto}</p>
            <small>${infoDisp.termos}</small>
          </div>
        </div>

        ${Number(p.minimoCotacao) > 0 ? `
          <div class="info-caixa info-caixa-minimo">
            <div class="caixa-icon">
              <span class="lmi lmi-lg" aria-hidden="true">lock</span>
            </div>
            <div class="caixa-texto">
              <strong>Cotação mínima: ${formatarMZN(p.minimoCotacao)}</strong>
              <p>Este produto só pode ser cotado quando o subtotal do carrinho atingir <strong>${formatarMZN(p.minimoCotacao)}</strong>. Pode misturar com outros produtos para chegar ao mínimo.</p>
            </div>
          </div>
        ` : ''}

        <div class="info-actions">
          <div class="info-qty">
            <button class="btn-qty" onclick="alterarQtdProduto(-1)" aria-label="Diminuir">−</button>
            <span id="qty-actual">1</span>
            <button class="btn-qty" onclick="alterarQtdProduto(1)" aria-label="Aumentar">+</button>
          </div>
          <button class="btn-add-produto ${emCart ? 'no-carrinho' : ''}" id="btn-add-produto" onclick="adicionarProduto()">
            ${emCart ? '✓ Adicionado à cotação' : 'Adicionar à Cotação'}
          </button>
        </div>

        <button class="btn-whatsapp-direto" onclick="comprarWhatsAppDirecto()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.859L0 24l6.335-1.511C8.05 23.452 9.99 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
          Comprar directamente via WhatsApp
        </button>

        <div class="info-features">
          <div class="feature">
            <span class="lmi lmi-sm" aria-hidden="true">local_shipping</span>
            <span>Entrega em todo Moçambique e África do Sul</span>
          </div>
          <div class="feature">
            <span class="lmi lmi-sm" aria-hidden="true">schedule</span>
            <span>Cotação processada em até 48 horas</span>
          </div>
          <div class="feature">
            <span class="lmi lmi-sm" aria-hidden="true">verified_user</span>
            <span>Pagamento seguro · sinal + restante na entrega</span>
          </div>
        </div>

      </div>

    </div>

    <!-- Sticky Add-to-Cart (apenas mobile, activa quando o botão original sai do viewport) -->
    <div class="produto-sticky-cta" id="produto-sticky-cta" aria-hidden="true">
      <div class="sticky-info">
        ${temDesconto ? `<span class="sticky-old">${formatarMZN(p.preco)}</span>` : ''}
        <span class="sticky-preco">${formatarMZN(precoFinal)}</span>
        <span class="sticky-nome">${p.nome}</span>
      </div>
      <button class="sticky-btn ${emCart ? 'no-carrinho' : ''}" id="sticky-btn-add" onclick="adicionarProduto()" aria-label="Adicionar à cotação">
        <span class="lmi lmi-sm">add_shopping_cart</span>
        <span class="sticky-btn-txt">${emCart ? 'Adicionado' : 'Adicionar'}</span>
      </button>
    </div>
  `;

  // Observar quando o botão principal sai do viewport para mostrar o sticky
  setTimeout(observarBotaoPrincipal, 100);
}

// ────────────────────────────────────────────────────────────
//  Sticky CTA — mostrar/esconder conforme scroll
// ────────────────────────────────────────────────────────────
function observarBotaoPrincipal() {
  const btn = document.getElementById("btn-add-produto");
  const sticky = document.getElementById("produto-sticky-cta");
  if (!btn || !sticky) return;

  // IntersectionObserver: quando o botão original sai do ecrã, mostra o sticky
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      // e.isIntersecting === true → botão visível → esconder sticky
      const mostrar = !e.isIntersecting;
      sticky.classList.toggle("visivel", mostrar);
      // Fallback para browsers sem :has()
      document.body.classList.toggle("com-sticky-cta", mostrar);
    });
  }, { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
  observer.observe(btn);

  // Esconder sticky quando o drawer estiver aberto
  const drawer = document.getElementById("modal-carrinho");
  if (drawer) {
    const obs2 = new MutationObserver(() => {
      const aberto = drawer.classList.contains("aberto");
      sticky.classList.toggle("drawer-aberto", aberto);
    });
    obs2.observe(drawer, { attributes: true, attributeFilter: ["class"] });
  }
}

// Render de estrelas
function renderEstrelas(media, tamanho = "normal") {
  const cheias = Math.floor(media);
  const meia   = (media - cheias) >= 0.5;
  const vazias = 5 - cheias - (meia ? 1 : 0);
  let html = "";
  for (let i = 0; i < cheias; i++) html += `<span class="estrela cheia">★</span>`;
  if (meia) html += `<span class="estrela meia">★</span>`;
  for (let i = 0; i < vazias; i++) html += `<span class="estrela vazia">★</span>`;
  return html;
}

// ────────────────────────────────────────────────────────────
//  Galeria — trocar imagem
// ────────────────────────────────────────────────────────────
function trocarImagem(i) {
  imagemActualIndex = i;
  const img = document.getElementById("img-principal");
  const num = document.getElementById("img-num");
  if (img) {
    img.classList.add("carregando");
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = produtoActual.imagens[i];
      img.style.opacity = "1";
    }, 150);
  }
  if (num) num.textContent = i + 1;
  document.querySelectorAll(".thumb").forEach((t, idx) => {
    t.classList.toggle("activa", idx === i);
  });
}

// ────────────────────────────────────────────────────────────
//  Lightbox — Imagem em ecrã cheio
// ────────────────────────────────────────────────────────────
function abrirLightbox(i) {
  imagemActualIndex = i;
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  lb.classList.add("aberto");
  document.body.style.overflow = "hidden";
  atualizarLightbox();
}

function fecharLightbox() {
  document.getElementById("lightbox")?.classList.remove("aberto");
  document.body.style.overflow = "";
}

function atualizarLightbox() {
  const img = document.getElementById("lightbox-img");
  const num = document.getElementById("lightbox-num");
  if (img) img.src = produtoActual.imagens[imagemActualIndex];
  if (num) num.textContent = `${imagemActualIndex + 1} / ${produtoActual.imagens.length}`;
}

function lightboxNav(delta) {
  const n = produtoActual.imagens.length;
  imagemActualIndex = (imagemActualIndex + delta + n) % n;
  atualizarLightbox();
  trocarImagem(imagemActualIndex); // sincroniza com a galeria principal
}

// Swipe touch
let touchStartX = 0;
function onLightboxTouchStart(e) { touchStartX = e.touches[0].clientX; }
function onLightboxTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) lightboxNav(dx > 0 ? -1 : 1);
}

// ────────────────────────────────────────────────────────────
//  Vídeo do produto (YouTube com capa custom)
// ────────────────────────────────────────────────────────────
function renderizarVideo() {
  const seccao = document.getElementById("seccao-video");
  if (!seccao) return;

  if (!produtoActual.video) {
    seccao.style.display = "none";
    return;
  }

  const videoId = produtoActual.video;
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallback = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  seccao.innerHTML = `
    <div class="video-header reveal">
      <h2 class="produto-h2">Vídeo do produto</h2>
      <p class="produto-sub">Veja-o em acção</p>
    </div>
    <div class="video-wrap reveal" onclick="abrirVideo()">
      <img class="video-thumb" src="${thumb}" alt="Vídeo de ${produtoActual.nome}"
           onerror="this.src='${fallback}'" />
      <button class="btn-play" aria-label="Reproduzir vídeo">
        <span class="lmi lmi-fill lmi-lg" aria-hidden="true">play_arrow</span>
      </button>
      <span class="video-label">Reproduzir vídeo</span>
    </div>
  `;
}

function abrirVideo() {
  const lb = document.getElementById("video-lightbox");
  const iframe = document.getElementById("video-iframe");
  if (!lb || !iframe) return;
  iframe.src = `https://www.youtube.com/embed/${produtoActual.video}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
  lb.classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharVideo() {
  const lb = document.getElementById("video-lightbox");
  const iframe = document.getElementById("video-iframe");
  if (lb) lb.classList.remove("aberto");
  if (iframe) iframe.src = ""; // para o vídeo
  document.body.style.overflow = "";
}

// ────────────────────────────────────────────────────────────
//  Reviews
// ────────────────────────────────────────────────────────────
function renderizarReviews() {
  const seccao = document.getElementById("seccao-reviews");
  if (!seccao) return;

  const reviews = produtoActual.reviews || [];
  if (reviews.length === 0) {
    seccao.style.display = "none";
    return;
  }

  const media = mediaReviews(produtoActual);

  // Distribuição de estrelas
  const dist = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5
  reviews.forEach(r => dist[r.estrelas - 1]++);

  seccao.innerHTML = `
    <div class="reviews-header reveal">
      <h2 class="produto-h2">Avaliações dos clientes</h2>
      <p class="produto-sub">${reviews.length} ${reviews.length === 1 ? 'avaliação real' : 'avaliações reais'}</p>
    </div>

    <div class="reviews-layout reveal">
      <div class="reviews-resumo">
        <div class="resumo-num">${media.toFixed(1)}</div>
        <div class="resumo-estrelas">${renderEstrelas(media)}</div>
        <div class="resumo-total">${reviews.length} ${reviews.length === 1 ? 'avaliação' : 'avaliações'}</div>

        <div class="resumo-dist">
          ${[5,4,3,2,1].map(n => {
            const count = dist[n-1];
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return `
              <div class="dist-row">
                <span class="dist-label">${n} ★</span>
                <div class="dist-bar"><div class="dist-fill" style="width:${pct}%"></div></div>
                <span class="dist-count">${count}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="reviews-lista">
        ${reviews.map(r => `
          <article class="review">
            <header class="review-header">
              <div class="review-avatar">${r.nome.charAt(0).toUpperCase()}</div>
              <div class="review-meta">
                <strong class="review-nome">${r.nome}</strong>
                <span class="review-data">${formatarDataReview(r.data)}</span>
              </div>
              <div class="review-estrelas">${renderEstrelas(r.estrelas)}</div>
            </header>
            <p class="review-texto">${r.comentario}</p>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function formatarDataReview(iso) {
  const d = new Date(iso);
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

// ────────────────────────────────────────────────────────────
//  Produtos Relacionados
// ────────────────────────────────────────────────────────────
function renderizarRelacionados() {
  const seccao = document.getElementById("seccao-relacionados");
  if (!seccao) return;

  let relacionados = produtosRelacionados(produtoActual, 4);

  // Fallback: se não há na mesma categoria, mostra outros produtos em destaque ou aleatórios
  if (relacionados.length === 0) {
    relacionados = produtosAtivos()
      .filter(p => p.id !== produtoActual.id)
      .filter(p => p.destaque)
      .slice(0, 4);
  }
  if (relacionados.length < 4) {
    const ids = new Set(relacionados.map(r => r.id).concat([produtoActual.id]));
    const extras = produtosAtivos().filter(p => !ids.has(p.id)).slice(0, 4 - relacionados.length);
    relacionados = [...relacionados, ...extras];
  }

  if (relacionados.length === 0) {
    seccao.style.display = "none";
    return;
  }

  seccao.innerHTML = `
    <div class="relacionados-header reveal">
      <h2 class="produto-h2">Pode também gostar</h2>
      <a href="index.html" class="ver-todos">Ver todo o catálogo →</a>
    </div>
    <div class="produtos-grid reveal">
      ${relacionados.map(p => {
        const emCart      = !!carrinho.find(i => i.id === p.id);
        const temDesconto = p.desconto && p.desconto > 0;
        const precoFinal  = precoComDesconto(p);
        const dispLabel   = p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda";
        const dispClasse  = p.disponibilidade === "disponivel" ? "disp-stock" : "disp-encomenda";

        return `
          <article class="card-produto">
            <a class="card-link" href="produto.html?id=${p.id}">
              <div class="card-img-wrap">
                <img class="card-imagem" src="${p.imagens[0]}" alt="${p.nome}" loading="lazy" />
                <div class="card-badges">
                  ${temDesconto ? `<span class="card-badge badge-desc">−${p.desconto}%</span>` : ''}
                  <span class="card-badge ${dispClasse}">${dispLabel}</span>
                </div>
              </div>
            </a>
            <div class="card-corpo">
              <div class="card-marca">${p.marca}</div>
              <h3 class="card-nome"><a href="produto.html?id=${p.id}">${p.nome}</a></h3>
              <div class="card-footer">
                <span class="card-preco-wrap">
                  ${temDesconto ? `<span class="card-preco-old">${formatarMZN(p.preco)}</span>` : ''}
                  <span class="card-preco">${formatarMZN(precoFinal)}</span>
                </span>
                <button class="btn-add-mobile ${emCart ? 'no-carrinho' : ''}" data-id="${p.id}" onclick="adicionarAoCarrinho(${p.id})" aria-label="Adicionar">
                  ${emCart ? '✓' : '+'}
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

// ────────────────────────────────────────────────────────────
//  Quantidade & Adição
// ────────────────────────────────────────────────────────────
function alterarQtdProduto(delta) {
  const el = document.getElementById("qty-actual");
  if (!el) return;
  let qtd = parseInt(el.textContent) + delta;
  if (qtd < 1) qtd = 1;
  if (qtd > 99) qtd = 99;
  el.textContent = qtd;
}

function adicionarProduto() {
  const qtdEl = document.getElementById("qty-actual");
  const qtd = qtdEl ? parseInt(qtdEl.textContent) : 1;

  // Adiciona N vezes para respeitar a quantidade
  for (let i = 0; i < qtd; i++) {
    adicionarAoCarrinho(produtoActual.id);
  }

  // Atualiza o botão principal
  const btn = document.getElementById("btn-add-produto");
  if (btn) {
    btn.classList.add("no-carrinho");
    btn.textContent = "✓ Adicionado à cotação";
  }

  // Atualiza o sticky (se existir)
  const stickyBtn = document.getElementById("sticky-btn-add");
  if (stickyBtn) {
    stickyBtn.classList.add("no-carrinho");
    const txt = stickyBtn.querySelector(".sticky-btn-txt");
    if (txt) txt.textContent = "Adicionado";
  }
}

function comprarWhatsAppDirecto() {
  const p = produtoActual;
  const qtdEl = document.getElementById("qty-actual");
  const qtd = qtdEl ? parseInt(qtdEl.textContent) : 1;
  const precoFinal = precoComDesconto(p);
  const total = precoFinal * qtd;

  const msg =
    `Olá! Gostaria de mais informações sobre este produto:\n\n` +
    `*${p.nome}*\n` +
    `Marca: ${p.marca}\n` +
    `Quantidade: ${qtd}\n` +
    `Preço unitário: ${formatarMZN(precoFinal)}\n` +
    `Total: ${formatarMZN(total)}\n\n` +
    `Disponibilidade: ${p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda"}\n\n` +
    `Aguardo confirmação. Obrigado!`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ────────────────────────────────────────────────────────────
//  Atalhos de teclado para o lightbox
// ────────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  const lb = document.getElementById("lightbox");
  const vlb = document.getElementById("video-lightbox");
  if (lb?.classList.contains("aberto")) {
    if (e.key === "Escape")     fecharLightbox();
    if (e.key === "ArrowLeft")  lightboxNav(-1);
    if (e.key === "ArrowRight") lightboxNav(1);
  }
  if (vlb?.classList.contains("aberto") && e.key === "Escape") fecharVideo();
});

// ────────────────────────────────────────────────────────────
//  Inicialização (a chamar no fim do <body>)
// ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initProdutoPage);
