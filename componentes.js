// ============================================================
//  LUMART — Componentes Globais
//  ============================================================
//  Responsabilidades:
//    - Injectar Footer profissional em todas as páginas
//    - Sistema de busca (overlay full-width)
//    - Filtro de pesquisa no catálogo (?q=termo)
// ============================================================


// ════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO — Editar links das redes e contactos aqui
// ════════════════════════════════════════════════════════════
const LUMART_INFO = {
  site:      "lumartcomercial.com",
  email:     "lumartcomercial@gmail.com",
  whatsapp:  WHATSAPP_NUMERO,  // já vem do produtos.js
  cidade:    "Maputo, Moçambique",

  redes: {
    facebook:  "https://www.facebook.com/share/1VrqXpT6o9/",
    instagram: "https://www.instagram.com/lumart.mz",
    tiktok:    "https://www.tiktok.com/@lumart.mz",
    whatsapp:  `https://wa.me/${WHATSAPP_NUMERO}`,
  },

  pagamentos: [
    "M-Pesa",
    "e-Mola",
    "m-Kesh",
    "BCI",
    "BIM",
    "Binance",
    "PayPal",
  ],
};


// ════════════════════════════════════════════════════════════
//  FOOTER PROFISSIONAL
// ════════════════════════════════════════════════════════════
function injectarFooter() {
  // Detectar rodapés antigos e remover
  document.querySelectorAll("footer.footer").forEach(f => f.remove());

  const footer = document.createElement("footer");
  footer.className = "footer-pro";
  footer.innerHTML = `
    <div class="footer-pro-inner">

      <!-- Coluna 1: Marca + Redes -->
      <div class="footer-col footer-col-marca">
        <a class="footer-pro-logo" href="index.html">Lu<em>mart</em></a>
        <p class="footer-pro-desc">
          Materiais artísticos profissionais com importação directa da Ásia e América.
          Traços que contam Histórias.
        </p>
        <div class="footer-redes">
          <a href="${LUMART_INFO.redes.facebook}" target="_blank" rel="noopener" class="rede-icon" aria-label="Facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="${LUMART_INFO.redes.instagram}" target="_blank" rel="noopener" class="rede-icon" aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="${LUMART_INFO.redes.tiktok}" target="_blank" rel="noopener" class="rede-icon" aria-label="TikTok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
          </a>
          <a href="${LUMART_INFO.redes.whatsapp}" target="_blank" rel="noopener" class="rede-icon" aria-label="WhatsApp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.683 5.534l-.999 3.648 3.805-.881zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        </div>
      </div>

      <!-- Coluna 2: Loja -->
      <div class="footer-col">
        <h4 class="footer-pro-titulo">Loja</h4>
        <a class="footer-pro-link" href="index.html">Catálogo Completo</a>
        <a class="footer-pro-link" href="checkout.html">Fazer Cotação</a>
        <a class="footer-pro-link" href="index.html?destaque=1">Produtos em Destaque</a>
        <a class="footer-pro-link" href="javascript:abrirBusca()">Procurar Produtos</a>
      </div>

      <!-- Coluna 3: Empresa -->
      <div class="footer-col">
        <h4 class="footer-pro-titulo">Empresa</h4>
        <a class="footer-pro-link" href="javascript:abrirModal('sobre')">Sobre a Lumart</a>
        <a class="footer-pro-link" href="javascript:abrirModal('comoFunciona')">Como funciona</a>
        <a class="footer-pro-link" href="javascript:abrirModal('faq')">Perguntas Frequentes</a>
        <a class="footer-pro-link" href="https://wa.me/${LUMART_INFO.whatsapp}" target="_blank" rel="noopener">Contactar</a>
      </div>

      <!-- Coluna 4: Ajuda -->
      <div class="footer-col">
        <h4 class="footer-pro-titulo">Ajuda</h4>
        <a class="footer-pro-link" href="javascript:abrirModal('entrega')">Política de Entrega</a>
        <a class="footer-pro-link" href="javascript:abrirModal('devolucao')">Política de Devolução</a>
        <a class="footer-pro-link" href="javascript:abrirModal('termos')">Termos e Condições</a>
        <a class="footer-pro-link" href="javascript:abrirModal('faq')">FAQ</a>
      </div>

      <!-- Coluna 5: Contacto + Pagamento -->
      <div class="footer-col">
        <h4 class="footer-pro-titulo">Contacto</h4>
        <a class="footer-pro-link footer-contact" href="https://wa.me/${LUMART_INFO.whatsapp}" target="_blank" rel="noopener">
          <span class="contact-icon">📱</span>
          +258 87 823 7402
        </a>
        <a class="footer-pro-link footer-contact" href="mailto:${LUMART_INFO.email}">
          <span class="contact-icon">✉</span>
          ${LUMART_INFO.email}
        </a>
        <a class="footer-pro-link footer-contact" href="https://${LUMART_INFO.site}" target="_blank" rel="noopener">
          <span class="contact-icon">🌐</span>
          ${LUMART_INFO.site}
        </a>
        <span class="footer-pro-link footer-contact">
          <span class="contact-icon">📍</span>
          ${LUMART_INFO.cidade}
        </span>
      </div>

    </div>

    <!-- Pagamentos -->
    <div class="footer-pagamentos">
      <span class="footer-pag-label">Aceitamos:</span>
      <div class="footer-pag-lista">
        ${LUMART_INFO.pagamentos.map(p => `<span class="pag-tag">${p}</span>`).join("")}
      </div>
    </div>

    <!-- Bottom -->
    <div class="footer-pro-bottom">
      <span class="footer-pro-copy">© <span id="footer-ano"></span> Lumart Comercial. Todos os direitos reservados.</span>
      <div class="footer-pro-legal">
        <a href="javascript:abrirModal('termos')">Termos</a>
        <span class="footer-pro-sep">·</span>
        <a href="javascript:abrirModal('entrega')">Entrega</a>
        <span class="footer-pro-sep">·</span>
        <a href="javascript:abrirModal('devolucao')">Devolução</a>
      </div>
    </div>
  `;

  document.body.appendChild(footer);

  // Atualizar ano automaticamente
  const anoEl = document.getElementById("footer-ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();
}


// ════════════════════════════════════════════════════════════
//  SISTEMA DE BUSCA
// ════════════════════════════════════════════════════════════

let buscaTermo = "";

function injectarBuscaOverlay() {
  // Já existe?
  if (document.getElementById("busca-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "busca-overlay";
  overlay.className = "busca-overlay";
  overlay.innerHTML = `
    <div class="busca-container" onclick="event.stopPropagation()">
      <div class="busca-header">
        <svg class="busca-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="busca-input" placeholder="O que procura?" autocomplete="off" spellcheck="false" />
        <button class="busca-fechar" onclick="fecharBusca()" aria-label="Fechar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="busca-resultados" id="busca-resultados">
        <div class="busca-vazio">
          <span class="busca-vazio-icon">🔍</span>
          <p>Comece a escrever para procurar entre os nossos produtos</p>
          <div class="busca-sugestoes">
            <span class="busca-sug-label">Sugestões:</span>
            ${["Aquarela", "Pincéis", "Sketchbook", "Lápis", "Tinta óleo"].map(s =>
              `<button class="sug-tag" onclick="document.getElementById('busca-input').value='${s}';onBuscaInput()">${s}</button>`
            ).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
  overlay.addEventListener("click", e => {
    if (e.target === overlay) fecharBusca();
  });
  document.body.appendChild(overlay);

  // Ligar listener ao input
  document.getElementById("busca-input").addEventListener("input", onBuscaInput);
}

function abrirBusca() {
  injectarBuscaOverlay();
  const overlay = document.getElementById("busca-overlay");
  overlay.classList.add("aberto");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("busca-input")?.focus(), 100);
}

function fecharBusca() {
  document.getElementById("busca-overlay")?.classList.remove("aberto");
  document.body.style.overflow = "";
}

function onBuscaInput() {
  const input = document.getElementById("busca-input");
  if (!input) return;
  const termo = input.value.trim().toLowerCase();
  buscaTermo = termo;

  const container = document.getElementById("busca-resultados");

  if (termo.length === 0) {
    // Estado vazio inicial
    container.innerHTML = `
      <div class="busca-vazio">
        <span class="busca-vazio-icon">🔍</span>
        <p>Comece a escrever para procurar entre os nossos produtos</p>
        <div class="busca-sugestoes">
          <span class="busca-sug-label">Sugestões:</span>
          ${["Aquarela", "Pincéis", "Sketchbook", "Lápis", "Tinta óleo"].map(s =>
            `<button class="sug-tag" onclick="document.getElementById('busca-input').value='${s}';onBuscaInput()">${s}</button>`
          ).join("")}
        </div>
      </div>`;
    return;
  }

  const resultados = procurarProdutos(termo);

  if (resultados.length === 0) {
    container.innerHTML = `
      <div class="busca-vazio">
        <span class="busca-vazio-icon">😶</span>
        <p>Nenhum produto encontrado para <strong>"${escapeHtml(termo)}"</strong></p>
        <p class="busca-vazio-sub">Tente uma palavra diferente ou veja todo o catálogo.</p>
        <a href="index.html" class="btn-ver-catalogo">Ver todo o catálogo</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="busca-stats">
      ${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'} para <strong>"${escapeHtml(termo)}"</strong>
    </div>
    <div class="busca-grid">
      ${resultados.map(p => {
        const temDesconto = p.desconto && p.desconto > 0;
        const precoFinal  = precoComDesconto(p);
        const dispLabel   = p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda";
        const dispClasse  = p.disponibilidade === "disponivel" ? "disp-stock" : "disp-encomenda";
        return `
          <a class="busca-item" href="produto.html?id=${p.id}">
            <div class="busca-item-img">
              <img src="${p.imagens[0]}" alt="${p.nome}" loading="lazy" />
            </div>
            <div class="busca-item-info">
              <div class="busca-item-marca">${p.marca}</div>
              <div class="busca-item-nome">${highlightTermo(p.nome, termo)}</div>
              <div class="busca-item-meta">
                <span class="busca-item-preco">${formatarMZN(precoFinal)}</span>
                <span class="card-badge ${dispClasse}">${dispLabel}</span>
              </div>
            </div>
            <svg class="busca-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

// Procurar nos produtos (nome + marca + categoria)
function procurarProdutos(termo) {
  const t = termo.toLowerCase();
  return PRODUTOS.filter(p =>
    p.nome.toLowerCase().includes(t) ||
    p.marca.toLowerCase().includes(t) ||
    p.categoria.toLowerCase().includes(t)
  );
}

// Highlight do termo no resultado
function highlightTermo(texto, termo) {
  if (!termo) return escapeHtml(texto);
  const safe = escapeHtml(texto);
  const re = new RegExp(`(${escapeRegex(termo)})`, "gi");
  return safe.replace(re, '<mark>$1</mark>');
}

function escapeHtml(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeRegex(t) { return String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }


// ════════════════════════════════════════════════════════════
//  BOTÃO DE BUSCA NO HEADER (injectar)
// ════════════════════════════════════════════════════════════
function injectarBotaoBusca() {
  const navAcoes = document.querySelector(".nav-acoes");
  if (!navAcoes) return;
  if (navAcoes.querySelector(".btn-busca")) return; // já existe

  const btn = document.createElement("button");
  btn.className = "btn-busca";
  btn.setAttribute("aria-label", "Procurar produtos");
  btn.onclick = abrirBusca;
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`;

  // Inserir antes do botão de carrinho
  const btnCart = navAcoes.querySelector(".btn-cart");
  if (btnCart) navAcoes.insertBefore(btn, btnCart);
  else navAcoes.appendChild(btn);
}


// ════════════════════════════════════════════════════════════
//  ATALHOS DE TECLADO
// ════════════════════════════════════════════════════════════
document.addEventListener("keydown", e => {
  // CTRL/CMD + K para abrir busca
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    abrirBusca();
  }
  // ESC para fechar busca
  if (e.key === "Escape") fecharBusca();
});


// ════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  injectarFooter();
  injectarBotaoBusca();

  // Suporte a ?q=termo na URL — abre busca automaticamente
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q) {
    setTimeout(() => {
      abrirBusca();
      const inp = document.getElementById("busca-input");
      if (inp) { inp.value = q; onBuscaInput(); }
    }, 200);
  }
});


// ════════════════════════════════════════════════════════════
//  BOTÃO "VOLTAR AO TOPO"
// ════════════════════════════════════════════════════════════
function injectarScrollTop() {
  if (document.getElementById("scroll-top")) return;
  const btn = document.createElement("button");
  btn.id = "scroll-top";
  btn.className = "btn-scroll-top";
  btn.setAttribute("aria-label", "Voltar ao topo");
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>`;
  btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.appendChild(btn);

  // Mostrar/esconder ao scroll
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle("visivel", window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


// ════════════════════════════════════════════════════════════
//  SKIP LINK (acessibilidade)
// ════════════════════════════════════════════════════════════
function injectarSkipLink() {
  if (document.getElementById("skip-link")) return;
  const skip = document.createElement("a");
  skip.id = "skip-link";
  skip.className = "skip-link";
  skip.href = "#main-content";
  skip.textContent = "Saltar para o conteúdo principal";
  document.body.insertBefore(skip, document.body.firstChild);

  // Adicionar id ao primeiro <main>
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";
}


// ════════════════════════════════════════════════════════════
//  ENRIQUECIMENTO PROGRESSIVO DE IMAGENS (lazy + decoding)
// ════════════════════════════════════════════════════════════
function enriquecerImagens() {
  document.querySelectorAll("img").forEach(img => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });
}


// ════════════════════════════════════════════════════════════
//  RESPEITAR prefers-reduced-motion
// ════════════════════════════════════════════════════════════
function respeitarMovimentoReduzido() {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) document.documentElement.classList.add("movimento-reduzido");
  mq.addEventListener?.("change", e => {
    document.documentElement.classList.toggle("movimento-reduzido", e.matches);
  });
}


// ════════════════════════════════════════════════════════════
//  Auto-init (executa depois do DOMContentLoaded)
// ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  injectarSkipLink();
  injectarScrollTop();
  enriquecerImagens();
  respeitarMovimentoReduzido();
});

// Re-enriquecer imagens quando produtos forem renderizados dinamicamente
const observerImagens = new MutationObserver(muts => {
  muts.forEach(m => {
    m.addedNodes.forEach(n => {
      if (n.nodeType === 1) {
        if (n.tagName === "IMG") {
          if (!n.hasAttribute("loading")) n.setAttribute("loading", "lazy");
          if (!n.hasAttribute("decoding")) n.setAttribute("decoding", "async");
        }
        n.querySelectorAll?.("img").forEach(img => {
          if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
          if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
        });
      }
    });
  });
});
observerImagens.observe(document.body, { childList: true, subtree: true });
