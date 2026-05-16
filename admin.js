// ============================================================
//  LUMART ADMIN — Lógica do Painel
//  ============================================================
//  Fase 1:
//    - Login com password (definida na 1ª visita, hash SHA-256)
//    - Sessão em sessionStorage (logout ao fechar)
//    - Dashboard com stats, gráfico de categorias, top reviews, avisos
//    - CRUD de produtos: criar, editar, eliminar, duplicar, pausar
//    - Filtros, busca, acções em massa
//    - Editor com pré-visualização ao vivo
//    - Auto-save em localStorage
//    - Exportar produtos.js
// ============================================================


// ════════════════════════════════════════════════════════════
//  CONSTANTES E ESTADO
// ════════════════════════════════════════════════════════════
const ADMIN_KEY_PASS    = "lumart_admin_pass_hash";
const ADMIN_KEY_PRODS   = "lumart_admin_produtos";
const ADMIN_KEY_FRETE   = "lumart_admin_frete";
const ADMIN_KEY_CAMBIO  = "lumart_admin_cambio";    // Fase 4 — taxa MZN→ZAR
const ADMIN_KEY_TEMA    = "lumart_admin_tema";
const ADMIN_KEY_HIST    = "lumart_admin_historico";
const ADMIN_KEY_HIST_IDX= "lumart_admin_historico_idx";
const ADMIN_KEY_SESSAO  = "lumart_admin_sessao";
const ADMIN_KEY_LASTSAVE = "lumart_admin_lastsave";
const ADMIN_TIMEOUT_MIN = 30;
const HIST_MAX_ENTRIES  = 50;

// Estado em memória — clone editável dos produtos
let produtosEditados = [];
let freteEditado = null;        // clone editável do FRETE
let taxaCambioEditada = null;   // clone editável de TAXA_CAMBIO_ZAR (Fase 4)
let temMudancas = false;
let produtoEditando = null;
let timeoutInactividade = null;
let confirmCallback = null;
let promptCallback = null;
let reviewEditando = null;       // índice da review em edição (-1 = nova)

// Histórico
let historico = [];              // array de entradas: {id, tipo, descricao, timestamp, snapshot}
let historicoIdx = -1;           // ponteiro: índice da última acção aplicada (-1 = nenhuma)
let historicoFiltro = "";

// Drag and drop
let dragId = null;
let dragRow = null;


// ════════════════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════

// Hash SHA-256 (usa Web Crypto API — disponível no browser moderno)
async function sha256(texto) {
  const buffer = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function temPasswordDefinida() {
  return !!localStorage.getItem(ADMIN_KEY_PASS);
}

function estaAutenticado() {
  const sessao = sessionStorage.getItem(ADMIN_KEY_SESSAO);
  if (!sessao) return false;
  const dados = JSON.parse(sessao);
  // Verificar timeout
  if (Date.now() - dados.lastActivity > ADMIN_TIMEOUT_MIN * 60 * 1000) {
    sessionStorage.removeItem(ADMIN_KEY_SESSAO);
    return false;
  }
  return true;
}

function renovarSessao() {
  if (!estaAutenticado()) return;
  sessionStorage.setItem(ADMIN_KEY_SESSAO, JSON.stringify({
    lastActivity: Date.now(),
  }));

  // Renovar timeout
  if (timeoutInactividade) clearTimeout(timeoutInactividade);
  timeoutInactividade = setTimeout(() => {
    if (!estaAutenticado()) adminLogout();
  }, ADMIN_TIMEOUT_MIN * 60 * 1000);
}

async function adminSetup() {
  const p1 = document.getElementById("setup-pass").value;
  const p2 = document.getElementById("setup-pass2").value;

  if (p1.length < 8) {
    mostrarToast("Password deve ter no mínimo 8 caracteres");
    return;
  }
  if (p1 !== p2) {
    mostrarToast("Passwords não coincidem");
    return;
  }

  const hash = await sha256(p1);
  localStorage.setItem(ADMIN_KEY_PASS, hash);

  sessionStorage.setItem(ADMIN_KEY_SESSAO, JSON.stringify({
    lastActivity: Date.now(),
  }));

  mostrarToast("Password criada com sucesso!");
  setTimeout(() => entrarPainel(), 600);
}

async function adminLogin() {
  const pass = document.getElementById("login-pass").value;
  if (!pass) return;

  const hash = await sha256(pass);
  const hashGuardado = localStorage.getItem(ADMIN_KEY_PASS);

  if (hash !== hashGuardado) {
    mostrarToast("Password incorrecta");
    document.getElementById("login-pass").value = "";
    return;
  }

  sessionStorage.setItem(ADMIN_KEY_SESSAO, JSON.stringify({
    lastActivity: Date.now(),
  }));

  entrarPainel();
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY_SESSAO);
  if (timeoutInactividade) clearTimeout(timeoutInactividade);
  // Recarregar página para mostrar login limpo
  window.location.reload();
}

function esquecerPassword() {
  abrirConfirm({
    titulo: "Apagar password?",
    mensagem: "Isto vai apagar a password actual e os dados não exportados do admin. Os produtos no produtos.js do site permanecem intactos. Quer continuar?",
    btnTexto: "Sim, apagar tudo",
    perigo: true,
    callback: () => {
      localStorage.removeItem(ADMIN_KEY_PASS);
      localStorage.removeItem(ADMIN_KEY_PRODS);
      localStorage.removeItem(ADMIN_KEY_LASTSAVE);
      sessionStorage.removeItem(ADMIN_KEY_SESSAO);
      window.location.reload();
    },
  });
}

function entrarPainel() {
  document.getElementById("admin-auth").style.display = "none";
  document.getElementById("admin-shell").style.display = "flex";
  carregarDados();
  renovarSessao();
  inicializarPainel();

  // Eventos para renovar sessão (qualquer interacção)
  ["click", "keydown", "touchstart"].forEach(evt => {
    document.addEventListener(evt, () => renovarSessao(), { passive: true });
  });
}


// ════════════════════════════════════════════════════════════
//  CARREGAMENTO DE DADOS
// ════════════════════════════════════════════════════════════

function carregarDados() {
  // Verificar se há trabalho em progresso no localStorage
  const guardadoP = localStorage.getItem(ADMIN_KEY_PRODS);
  const guardadoF = localStorage.getItem(ADMIN_KEY_FRETE);
  const guardadoC = localStorage.getItem(ADMIN_KEY_CAMBIO);  // Fase 4
  const guardadoH = localStorage.getItem(ADMIN_KEY_HIST);
  const guardadoHIdx = localStorage.getItem(ADMIN_KEY_HIST_IDX);

  let temGuardado = false;

  if (guardadoP) {
    try {
      produtosEditados = JSON.parse(guardadoP);
      temGuardado = true;
    } catch (e) {
      console.warn("Erro ao carregar produtos do localStorage:", e);
      produtosEditados = clonarProdutos(PRODUTOS);
    }
  } else {
    produtosEditados = clonarProdutos(PRODUTOS);
  }

  if (guardadoF) {
    try {
      freteEditado = JSON.parse(guardadoF);
      temGuardado = true;
    } catch (e) {
      console.warn("Erro ao carregar frete do localStorage:", e);
      freteEditado = JSON.parse(JSON.stringify(FRETE));
    }
  } else {
    freteEditado = JSON.parse(JSON.stringify(FRETE));
  }

  // Taxa de câmbio MZN → ZAR (Fase 4)
  if (guardadoC) {
    try {
      taxaCambioEditada = JSON.parse(guardadoC);
      temGuardado = true;
    } catch (e) {
      console.warn("Erro ao carregar taxa de câmbio do localStorage:", e);
      taxaCambioEditada = clonarTaxaCambioPadrao();
    }
  } else {
    taxaCambioEditada = clonarTaxaCambioPadrao();
  }

  // Histórico
  if (guardadoH) {
    try {
      historico = JSON.parse(guardadoH);
      historicoIdx = parseInt(guardadoHIdx) || (historico.length - 1);
    } catch (e) {
      historico = [];
      historicoIdx = -1;
    }
  }

  if (temGuardado) {
    const lastSave = localStorage.getItem(ADMIN_KEY_LASTSAVE);
    if (lastSave) {
      const data = new Date(parseInt(lastSave));
      const agora = new Date();
      const diff = Math.floor((agora - data) / 60000);
      const tempo = diff < 1 ? "agora" : diff < 60 ? `há ${diff} min` : `há ${Math.floor(diff/60)}h`;
      mostrarToast(`Trabalho recuperado (auto-save ${tempo})`);
      temMudancas = true;
    }
  }
}

function clonarProdutos(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function salvarLocal() {
  try {
    localStorage.setItem(ADMIN_KEY_PRODS, JSON.stringify(produtosEditados));
    if (freteEditado) {
      localStorage.setItem(ADMIN_KEY_FRETE, JSON.stringify(freteEditado));
    }
    if (taxaCambioEditada) {
      localStorage.setItem(ADMIN_KEY_CAMBIO, JSON.stringify(taxaCambioEditada));
    }
    localStorage.setItem(ADMIN_KEY_LASTSAVE, Date.now().toString());
    temMudancas = true;
    atualizarStatusMudancas();
  } catch (e) {
    mostrarToast("Erro ao guardar no navegador");
  }
}

function descartarMudancas() {
  abrirConfirm({
    titulo: "Descartar mudanças?",
    mensagem: "Todas as alterações não exportadas serão perdidas, incluindo o histórico.",
    btnTexto: "Sim, descartar",
    perigo: true,
    callback: () => {
      localStorage.removeItem(ADMIN_KEY_PRODS);
      localStorage.removeItem(ADMIN_KEY_FRETE);
      localStorage.removeItem(ADMIN_KEY_HIST);
      localStorage.removeItem(ADMIN_KEY_HIST_IDX);
      localStorage.removeItem(ADMIN_KEY_LASTSAVE);
      produtosEditados = clonarProdutos(PRODUTOS);
      freteEditado = JSON.parse(JSON.stringify(FRETE));
      historico = [];
      historicoIdx = -1;
      temMudancas = false;
      atualizarStatusMudancas();
      atualizarBotoesUndoRedo();
      renderizarTabela();
      renderizarDashboard();
      renderizarFrete();
      mostrarToast("Mudanças descartadas");
    },
  });
}

function atualizarStatusMudancas() {
  const el = document.getElementById("status-mudancas");
  if (!el) return;
  if (temMudancas) {
    el.classList.add("tem-mudancas");
    el.querySelector(".status-text").textContent = "Mudanças não exportadas";
  } else {
    el.classList.remove("tem-mudancas");
    el.querySelector(".status-text").textContent = "Sem mudanças";
  }
}


// ════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO DO PAINEL
// ════════════════════════════════════════════════════════════

function inicializarPainel() {
  // Popular dropdowns de filtros (categorias)
  const filtroCat = document.getElementById("filtro-categoria");
  const datalistCat = document.getElementById("lista-categorias");
  const cats = [...new Set(produtosEditados.map(p => p.categoria))].sort();

  if (filtroCat) {
    filtroCat.innerHTML = '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  }
  if (datalistCat) {
    datalistCat.innerHTML = cats.map(c => `<option value="${escapeHTML(c)}">`).join("");
  }

  // Render inicial
  renderizarDashboard();
  renderizarTabela();
  atualizarStatusMudancas();
  atualizarBotoesUndoRedo();
  atualizarBadgeHistorico();

  // Atualizar badge na sidebar
  const badge = document.getElementById("nav-badge-produtos");
  if (badge) badge.textContent = produtosEditados.length;

  // Aviso ao tentar fechar com mudanças
  window.addEventListener("beforeunload", e => {
    if (temMudancas) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}


// ════════════════════════════════════════════════════════════
//  TABS
// ════════════════════════════════════════════════════════════

function mudarTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.style.display = "none");
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("ativo"));

  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.style.display = "block";

  const navEl = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navEl) navEl.classList.add("ativo");

  // Render específico de cada tab
  if (tab === "frete") { renderizarFrete(); renderizarCambio(); }
  if (tab === "dashboard") renderizarDashboard();
  if (tab === "produtos") renderizarTabela();
  if (tab === "historico") renderizarHistorico();
  if (tab === "idiomas") inicializarTabIdiomas();

  // Fechar sidebar no mobile após escolher
  if (window.innerWidth <= 900) {
    document.getElementById("admin-sidebar")?.classList.remove("aberto");
  }
}

function toggleSidebar() {
  document.getElementById("admin-sidebar")?.classList.toggle("aberto");
}


// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════

function renderizarDashboard() {
  renderizarStats();
  renderizarGraficoCategorias();
  renderizarFaixasPreco();
  renderizarTopReviews();
  renderizarAvisos();
}

function renderizarStats() {
  const total = produtosEditados.length;
  const ativos = produtosEditados.filter(p => p.ativo !== false).length;
  const pausados = total - ativos;
  const stock = produtosEditados.filter(p => p.disponibilidade === "disponivel" && p.ativo !== false).length;
  const encomenda = produtosEditados.filter(p => p.disponibilidade === "sob_encomenda" && p.ativo !== false).length;
  const comDesc = produtosEditados.filter(p => p.desconto && p.desconto > 0 && p.ativo !== false).length;
  const destaques = produtosEditados.filter(p => p.destaque && p.ativo !== false).length;
  const comMinimo = produtosEditados.filter(p => Number(p.minimoCotacao) > 0 && p.ativo !== false).length;
  const comVideo = produtosEditados.filter(p => p.video && p.video.length > 0).length;
  const semFoto = produtosEditados.filter(p => !p.imagens || p.imagens.length === 0 || !p.imagens[0]).length;
  const semDescricao = produtosEditados.filter(p => !p.descricao || p.descricao.trim().length < 30).length;
  const valores = produtosEditados.map(p => p.preco || 0);
  const valorMedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  const valorTotal = valores.reduce((a, b) => a + b, 0);
  const totalReviews = produtosEditados.reduce((acc, p) => acc + (p.reviews?.length || 0), 0);
  const mediaGlobal = (() => {
    let soma = 0, qtd = 0;
    produtosEditados.forEach(p => {
      (p.reviews || []).forEach(r => { soma += r.estrelas; qtd++; });
    });
    return qtd ? soma / qtd : 0;
  })();

  const grid = document.getElementById("stats-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">📦</span> Total</div>
      <div class="stat-card-num">${total}</div>
      <div class="stat-card-extra">
        <strong>${ativos}</strong> ativos · <strong>${pausados}</strong> pausados
      </div>
    </div>

    <div class="stat-card stat-stock">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🟢</span> Em stock</div>
      <div class="stat-card-num">${stock}</div>
      <div class="stat-card-extra">Envio rápido</div>
    </div>

    <div class="stat-card stat-encomenda">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🟡</span> Sob encomenda</div>
      <div class="stat-card-num">${encomenda}</div>
      <div class="stat-card-extra">Importação directa</div>
    </div>

    <div class="stat-card stat-desconto">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🏷️</span> Com desconto</div>
      <div class="stat-card-num">${comDesc}</div>
      <div class="stat-card-extra">Promoções activas</div>
    </div>

    <div class="stat-card stat-destaque">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">⭐</span> Em destaque</div>
      <div class="stat-card-num">${destaques}</div>
      <div class="stat-card-extra">Promovidos no catálogo</div>
    </div>

    <div class="stat-card stat-minimo">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🔒</span> Com mínimo</div>
      <div class="stat-card-num">${comMinimo}</div>
      <div class="stat-card-extra">Cotação mínima activa</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">💰</span> Valor médio</div>
      <div class="stat-card-num" style="font-size:1.6rem">${formatarMZN(valorMedio)}</div>
      <div class="stat-card-extra">Por produto</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">📊</span> Valor catálogo</div>
      <div class="stat-card-num" style="font-size:1.45rem">${formatarMZN(valorTotal)}</div>
      <div class="stat-card-extra">Soma total</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">★</span> Reviews</div>
      <div class="stat-card-num">${totalReviews}</div>
      <div class="stat-card-extra">
        Média: <strong>${mediaGlobal.toFixed(1)}</strong> ★
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🎬</span> Com vídeo</div>
      <div class="stat-card-num">${comVideo}</div>
      <div class="stat-card-extra">Vídeo de produto</div>
    </div>

    <div class="stat-card ${semFoto > 0 ? 'stat-aviso' : ''}">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">🖼️</span> Sem foto</div>
      <div class="stat-card-num">${semFoto}</div>
      <div class="stat-card-extra">${semFoto === 0 ? 'Todos têm imagem' : 'Precisam atenção'}</div>
    </div>

    <div class="stat-card ${semDescricao > 0 ? 'stat-aviso' : ''}">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">📝</span> Descrição curta</div>
      <div class="stat-card-num">${semDescricao}</div>
      <div class="stat-card-extra">${semDescricao === 0 ? 'Todas com texto' : '< 30 caracteres'}</div>
    </div>
  `;
}

function renderizarGraficoCategorias() {
  const container = document.getElementById("grafico-categorias");
  if (!container) return;

  const cats = {};
  produtosEditados.forEach(p => {
    cats[p.categoria] = (cats[p.categoria] || 0) + 1;
  });

  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]));

  if (entries.length === 0) {
    container.innerHTML = `<p style="color:var(--ash);font-size:.85rem;text-align:center;padding:20px">Sem dados</p>`;
    return;
  }

  container.innerHTML = entries.map(([cat, count]) => {
    const pct = (count / max) * 100;
    return `
      <div class="barra-categoria">
        <span class="barra-cat-label">${escapeHTML(cat)}</span>
        <div class="barra-cat-track">
          <div class="barra-cat-fill" style="width:${pct}%">${count}</div>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
//  Distribuição por faixa de preço (Fase 6C)
// ============================================================
function renderizarFaixasPreco() {
  const container = document.getElementById("grafico-precos");
  if (!container) return;

  const ativos = produtosEditados.filter(p => p.ativo !== false);
  if (ativos.length === 0) {
    container.innerHTML = `<p class="dashboard-vazio">Sem produtos para analisar.</p>`;
    return;
  }

  // Faixas: ≤1k, 1-3k, 3-5k, 5-10k, >10k
  const faixas = [
    { label: "Até 1.000 MT",        min: 0,      max: 1000,    count: 0 },
    { label: "1.000 — 3.000 MT",    min: 1000,   max: 3000,    count: 0 },
    { label: "3.000 — 5.000 MT",    min: 3000,   max: 5000,    count: 0 },
    { label: "5.000 — 10.000 MT",   min: 5000,   max: 10000,   count: 0 },
    { label: "Acima de 10.000 MT",  min: 10000,  max: Infinity, count: 0 },
  ];

  ativos.forEach(p => {
    const preco = Number(p.preco) || 0;
    const faixa = faixas.find(f => preco >= f.min && preco < f.max);
    if (faixa) faixa.count++;
  });

  const maxCount = Math.max(...faixas.map(f => f.count), 1);

  container.innerHTML = faixas.map(f => {
    const pct = (f.count / maxCount) * 100;
    return `
      <div class="barra-cat-row">
        <span class="barra-cat-label">${f.label}</span>
        <div class="barra-cat-track">
          <div class="barra-cat-fill barra-preco-fill" style="width:${pct}%">${f.count}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderizarTopReviews() {
  const container = document.getElementById("top-reviews");
  if (!container) return;

  const comReviews = produtosEditados
    .filter(p => p.reviews && p.reviews.length > 0)
    .map(p => ({
      ...p,
      mediaEstrelas: p.reviews.reduce((a, r) => a + r.estrelas, 0) / p.reviews.length,
    }))
    .sort((a, b) => b.mediaEstrelas - a.mediaEstrelas)
    .slice(0, 3);

  if (comReviews.length === 0) {
    container.innerHTML = `<p style="color:var(--ash);font-size:.85rem;text-align:center;padding:20px">Nenhum produto com reviews</p>`;
    return;
  }

  container.innerHTML = comReviews.map(p => `
    <div class="top-review-item">
      <img src="${escapeHTML(p.imagens?.[0] || '')}" alt="" />
      <div class="top-review-info">
        <span class="top-review-nome">${escapeHTML(p.nome)}</span>
        <div class="top-review-meta">
          <span class="top-review-stars">${p.mediaEstrelas.toFixed(1)} ★</span>
          <span>·</span>
          <span>${p.reviews.length} ${p.reviews.length === 1 ? 'review' : 'reviews'}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderizarAvisos() {
  const container = document.getElementById("avisos-lista");
  if (!container) return;

  const avisos = [];

  // Produtos com imagens Unsplash (placeholder)
  const semFotosReais = produtosEditados.filter(p =>
    (p.imagens || []).some(img => img.includes("unsplash.com"))
  );
  if (semFotosReais.length > 0) {
    avisos.push({
      icon: "🖼️",
      texto: `<strong>${semFotosReais.length}</strong> produto(s) ainda usam fotos do Unsplash (placeholder). Substitua pelas fotos reais.`,
    });
  }

  // Produtos sem descrição completa
  const semDesc = produtosEditados.filter(p => !p.descricao || p.descricao.length < 50);
  if (semDesc.length > 0) {
    avisos.push({
      icon: "📝",
      texto: `<strong>${semDesc.length}</strong> produto(s) sem descrição detalhada (mín. 50 caracteres).`,
    });
  }

  // Produtos sem reviews
  const semReviews = produtosEditados.filter(p => !p.reviews || p.reviews.length === 0);
  if (semReviews.length > 0) {
    avisos.push({
      icon: "⭐",
      texto: `<strong>${semReviews.length}</strong> produto(s) sem nenhuma review.`,
    });
  }

  // Produtos sem vídeo
  const semVideo = produtosEditados.filter(p => !p.video || p.video === "");
  if (semVideo.length > 0 && semVideo.length < produtosEditados.length) {
    avisos.push({
      icon: "🎬",
      texto: `<strong>${semVideo.length}</strong> produto(s) sem vídeo. Os outros têm — considere adicionar.`,
    });
  }

  // Produtos pausados
  const pausados = produtosEditados.filter(p => p.ativo === false);
  if (pausados.length > 0) {
    avisos.push({
      icon: "⏸️",
      texto: `<strong>${pausados.length}</strong> produto(s) pausados estão escondidos do site.`,
    });
  }

  if (avisos.length === 0) {
    container.innerHTML = `
      <div class="aviso-vazio">
        <span>✨</span>
        Tudo em ordem! Sem avisos para reportar.
      </div>`;
    return;
  }

  container.innerHTML = avisos.map(a => `
    <div class="aviso-item">
      <span class="aviso-icon">${a.icon}</span>
      <div class="aviso-texto">${a.texto}</div>
    </div>
  `).join("");
}


// ════════════════════════════════════════════════════════════
//  TABELA DE PRODUTOS — Filtros e renderização
// ════════════════════════════════════════════════════════════

let filtrosAtuais = {
  busca: "",
  categoria: "",
  disp: "",
  vis: "",
  desc: "",
  destaque: "",
  minimo: "",
  preco: "",
  ordenar: "padrao",
};

let produtosSelecionados = new Set();

function aplicarFiltros() {
  filtrosAtuais.busca     = document.getElementById("filtro-busca")?.value.toLowerCase() || "";
  filtrosAtuais.categoria = document.getElementById("filtro-categoria")?.value || "";
  filtrosAtuais.disp      = document.getElementById("filtro-disp")?.value || "";
  filtrosAtuais.vis       = document.getElementById("filtro-vis")?.value || "";
  filtrosAtuais.desc      = document.getElementById("filtro-desc")?.value || "";
  filtrosAtuais.destaque  = document.getElementById("filtro-destaque")?.value || "";
  filtrosAtuais.minimo    = document.getElementById("filtro-minimo")?.value || "";
  filtrosAtuais.preco     = document.getElementById("filtro-preco")?.value || "";
  filtrosAtuais.ordenar   = document.getElementById("filtro-ordenar")?.value || "padrao";
  renderizarTabela();
}

function limparFiltros() {
  ["filtro-busca", "filtro-categoria", "filtro-disp", "filtro-vis", "filtro-desc",
   "filtro-destaque", "filtro-minimo", "filtro-preco"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const ord = document.getElementById("filtro-ordenar");
  if (ord) ord.value = "padrao";
  filtrosAtuais = { busca: "", categoria: "", disp: "", vis: "", desc: "",
                    destaque: "", minimo: "", preco: "", ordenar: "padrao" };
  renderizarTabela();
}

function obterProdutosFiltrados() {
  // Aplicar filtros
  let lista = produtosEditados.filter(p => {
    if (filtrosAtuais.busca) {
      const txt = filtrosAtuais.busca;
      const match = p.nome.toLowerCase().includes(txt) ||
                    p.marca.toLowerCase().includes(txt) ||
                    p.categoria.toLowerCase().includes(txt);
      if (!match) return false;
    }
    if (filtrosAtuais.categoria && p.categoria !== filtrosAtuais.categoria) return false;
    if (filtrosAtuais.disp && p.disponibilidade !== filtrosAtuais.disp) return false;
    if (filtrosAtuais.vis === "visiveis" && p.ativo === false) return false;
    if (filtrosAtuais.vis === "pausados" && p.ativo !== false) return false;
    if (filtrosAtuais.desc === "sim" && (!p.desconto || p.desconto === 0)) return false;
    if (filtrosAtuais.desc === "nao" && p.desconto && p.desconto > 0) return false;
    // Novos filtros
    if (filtrosAtuais.destaque === "sim" && !p.destaque) return false;
    if (filtrosAtuais.destaque === "nao" && p.destaque) return false;
    if (filtrosAtuais.minimo === "sim" && !(Number(p.minimoCotacao) > 0)) return false;
    if (filtrosAtuais.minimo === "nao" && Number(p.minimoCotacao) > 0) return false;
    if (filtrosAtuais.preco) {
      const preco = Number(p.preco) || 0;
      if (filtrosAtuais.preco === "0-1000" && !(preco <= 1000)) return false;
      if (filtrosAtuais.preco === "1000-3000" && !(preco > 1000 && preco <= 3000)) return false;
      if (filtrosAtuais.preco === "3000-5000" && !(preco > 3000 && preco <= 5000)) return false;
      if (filtrosAtuais.preco === "5000-10000" && !(preco > 5000 && preco <= 10000)) return false;
      if (filtrosAtuais.preco === "10000+" && !(preco > 10000)) return false;
    }
    return true;
  });

  // Aplicar ordenação
  const ord = filtrosAtuais.ordenar || "padrao";
  if (ord === "nome-asc")    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  if (ord === "nome-desc")   lista.sort((a, b) => b.nome.localeCompare(a.nome, "pt"));
  if (ord === "preco-asc")   lista.sort((a, b) => (Number(a.preco)||0) - (Number(b.preco)||0));
  if (ord === "preco-desc")  lista.sort((a, b) => (Number(b.preco)||0) - (Number(a.preco)||0));
  if (ord === "id-recente")  lista.sort((a, b) => (b.id||0) - (a.id||0));
  if (ord === "id-antigo")   lista.sort((a, b) => (a.id||0) - (b.id||0));
  if (ord === "reviews")     lista.sort((a, b) => {
    const ma = (a.reviews?.length ? a.reviews.reduce((s,r) => s+r.estrelas, 0)/a.reviews.length : 0);
    const mb = (b.reviews?.length ? b.reviews.reduce((s,r) => s+r.estrelas, 0)/b.reviews.length : 0);
    return mb - ma;
  });
  // "padrao" mantém a ordem do array (ordem manual do drag&drop)

  return lista;
}

function renderizarTabela() {
  const tbody = document.getElementById("tbody-produtos");
  const vazia = document.getElementById("tabela-vazia");
  const tabela = document.getElementById("tabela-produtos");
  const subtitulo = document.getElementById("produtos-subtitulo");

  if (!tbody) return;

  const filtrados = obterProdutosFiltrados();

  if (subtitulo) {
    subtitulo.textContent = `${filtrados.length} de ${produtosEditados.length} produtos`;
  }

  if (filtrados.length === 0) {
    tabela.style.display = "none";
    vazia.style.display = "block";
    return;
  }

  tabela.style.display = "";
  vazia.style.display = "none";

  tbody.innerHTML = filtrados.map(p => {
    const temDesconto = p.desconto && p.desconto > 0;
    const precoFinal = temDesconto ? p.preco * (1 - p.desconto / 100) : p.preco;
    const ativo = p.ativo !== false;
    const checked = produtosSelecionados.has(p.id) ? "checked" : "";

    return `
      <tr class="${!ativo ? 'linha-pausada' : ''}" data-id="${p.id}" draggable="true">
        <td class="td-drag" title="Arraste para reordenar">⋮⋮</td>
        <td><input type="checkbox" ${checked} onchange="toggleSelecionado(${p.id}, this.checked)" /></td>
        <td><img class="tab-img" src="${escapeHTML(p.imagens?.[0] || '')}" alt="" loading="lazy" /></td>
        <td>
          <div class="tab-nome">${escapeHTML(p.nome)}</div>
          <div class="tab-marca">${escapeHTML(p.marca)}</div>
        </td>
        <td><span class="tab-categoria">${escapeHTML(p.categoria)}</span></td>
        <td>
          <div class="tab-preco-wrap">
            ${temDesconto ? `<span class="tab-preco-old">${formatarMZN(p.preco)}</span>` : ''}
            <span class="tab-preco">${formatarMZN(precoFinal)}</span>
            ${temDesconto ? `<span style="font-size:.65rem;color:var(--red);font-weight:700">−${p.desconto}%</span>` : ''}
          </div>
        </td>
        <td>
          <span class="tab-status ${p.disponibilidade === 'disponivel' ? 'disp' : 'encomenda'}">
            ${p.disponibilidade === 'disponivel' ? 'Em stock' : 'Sob encomenda'}
          </span>
        </td>
        <td>
          <button class="tab-vis-toggle ${!ativo ? 'pausado' : ''}" onclick="togglePausar(${p.id})">
            ${ativo ? '👁️ Sim' : '🔒 Não'}
          </button>
        </td>
        <td>
          <div class="tab-acoes">
            <button class="tab-btn-acao" onclick="editarProduto(${p.id})" title="Editar">✏️</button>
            <button class="tab-btn-acao" onclick="duplicarProduto(${p.id})" title="Duplicar">📋</button>
            <button class="tab-btn-acao btn-eliminar" onclick="eliminarProduto(${p.id})" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Configurar drag & drop nas novas linhas
  configurarDragDrop();
}


// ════════════════════════════════════════════════════════════
//  ACÇÕES DE PRODUTO (CRUD)
// ════════════════════════════════════════════════════════════

function novoProduto() {
  produtoEditando = null;
  abrirEditor({
    id: gerarNovoId(),
    nome: "",
    marca: "",
    categoria: "",
    preco: 0,
    desconto: 0,
    disponibilidade: "disponivel",
    destaque: false,
    ativo: true,
    imagens: ["", "", "", ""],
    video: "",
    descricao: "",
    reviews: [],
  });
}

function gerarNovoId() {
  const ids = produtosEditados.map(p => p.id);
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

function editarProduto(id) {
  const p = produtosEditados.find(x => x.id === id);
  if (!p) return;
  produtoEditando = id;
  abrirEditor(p);
}

function duplicarProduto(id) {
  const p = produtosEditados.find(x => x.id === id);
  if (!p) return;
  const novo = JSON.parse(JSON.stringify(p));
  novo.id = gerarNovoId();
  novo.nome = `${p.nome} (cópia)`;
  produtosEditados.push(novo);
  registarHistorico("duplicar", `Duplicou <strong>${escapeHTML(p.nome)}</strong>`);
  salvarLocal();
  renderizarTabela();
  renderizarDashboard();
  mostrarToast(`"${p.nome}" duplicado`);
}

function togglePausar(id) {
  const p = produtosEditados.find(x => x.id === id);
  if (!p) return;
  const novoEstado = !(p.ativo !== false);
  p.ativo = novoEstado;
  registarHistorico("pausar", `${novoEstado === false ? "Pausou" : "Reactivou"} <strong>${escapeHTML(p.nome)}</strong>`);
  salvarLocal();
  renderizarTabela();
  renderizarDashboard();
  mostrarToast(p.ativo === false ? `"${p.nome}" pausado` : `"${p.nome}" reactivado`);
}

function eliminarProduto(id) {
  const p = produtosEditados.find(x => x.id === id);
  if (!p) return;

  abrirConfirm({
    titulo: "Eliminar produto?",
    mensagem: `Tem a certeza que quer eliminar <strong>"${escapeHTML(p.nome)}"</strong>? Esta ação não pode ser desfeita facilmente (a menos que descartes mudanças não exportadas).`,
    btnTexto: "Sim, eliminar",
    perigo: true,
    callback: () => {
      produtosEditados = produtosEditados.filter(x => x.id !== id);
      produtosSelecionados.delete(id);
      registarHistorico("eliminar", `Eliminou <strong>${escapeHTML(p.nome)}</strong>`);
      salvarLocal();
      renderizarTabela();
      renderizarDashboard();
      mostrarToast(`"${p.nome}" eliminado`);
    },
  });
}


// ════════════════════════════════════════════════════════════
//  EDITOR DE PRODUTO
// ════════════════════════════════════════════════════════════

let produtoEmEdicao = null;

function abrirEditor(p) {
  produtoEmEdicao = JSON.parse(JSON.stringify(p));
  preencherEditor(produtoEmEdicao);

  document.getElementById("editor-titulo").textContent =
    produtoEditando === null ? "Novo produto" : `Editar: ${p.nome}`;

  document.getElementById("editor-overlay").classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function preencherEditor(p) {
  document.getElementById("ed-id").value = p.id || "Auto";
  document.getElementById("ed-nome").value = p.nome || "";
  document.getElementById("ed-marca").value = p.marca || "";
  document.getElementById("ed-categoria").value = p.categoria || "";
  document.getElementById("ed-preco").value = p.preco || "";
  document.getElementById("ed-desconto").value = p.desconto || 0;
  const edMin = document.getElementById("ed-minimo");
  if (edMin) edMin.value = p.minimoCotacao || 0;
  document.getElementById("ed-video").value = p.video || "";
  document.getElementById("ed-descricao").value = p.descricao || "";
  document.getElementById("ed-destaque").checked = !!p.destaque;
  document.getElementById("ed-ativo").checked = p.ativo !== false;

  // Disponibilidade
  document.querySelectorAll('input[name="ed-disp"]').forEach(r => {
    r.checked = r.value === (p.disponibilidade || "disponivel");
  });

  // Galeria
  renderizarGaleriaInputs(p.imagens || ["", "", "", ""]);

  // Reviews
  renderizarReviews();

  // Atualizar previews
  atualizarPreviewPreco();
  atualizarPreviewVideo();
  atualizarContadorDescricao();
  atualizarPreviewCard();

  // Eventos para atualizar preview ao vivo
  ["ed-nome", "ed-marca", "ed-categoria", "ed-preco", "ed-desconto", "ed-descricao"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el._editorListener) {
      el.addEventListener("input", atualizarPreviewCard);
      el._editorListener = true;
    }
  });
  document.querySelectorAll('input[name="ed-disp"]').forEach(r => {
    if (!r._editorListener) {
      r.addEventListener("change", atualizarPreviewCard);
      r._editorListener = true;
    }
  });
  document.getElementById("ed-destaque").addEventListener("change", atualizarPreviewCard);
  document.getElementById("ed-ativo").addEventListener("change", atualizarPreviewCard);
  document.getElementById("ed-descricao").addEventListener("input", atualizarContadorDescricao);
}

function renderizarGaleriaInputs(imagens) {
  const container = document.getElementById("galeria-inputs");
  if (!container) return;

  // Botão para gerar todos os 4 nomes locais de uma vez (Fase 7)
  const idProduto = parseInt(document.getElementById("ed-id")?.value) || gerarNovoId();
  container.innerHTML = `
    <div class="galeria-bulk-acoes">
      <button type="button" class="btn-admin-mini" onclick="gerarNomesImagensTodas()" title="Preenche os 4 slots com nomes locais (imagens/idN_imgX.jpg)">
        📁 Gerar todos os 4 nomes locais
      </button>
      <span class="galeria-info">ID actual: <strong>#${idProduto}</strong></span>
    </div>
  ` + [0, 1, 2, 3].map(i => {
    const valor = imagens[i] || '';
    const ehLocal = valor.startsWith('imagens/');
    return `
    <div class="galeria-input-card ${ehLocal ? 'tem-local' : ''}">
      <div class="galeria-input-thumb ${i === 0 ? 'principal' : ''}"
           id="thumb-${i}"
           data-num="${i + 1}"
           style="background-image:url('${escapeHTML(valor)}')">
        ${ehLocal ? '<span class="galeria-badge-local" title="Imagem local — carregar manualmente no GitHub">📁 LOCAL</span>' : ''}
      </div>
      <div class="galeria-input-fields">
        <div class="galeria-input-header">
          <label for="ed-img-${i}">${i === 0 ? 'Principal' : 'Imagem ' + (i + 1)}</label>
          <button type="button" class="btn-img-local" onclick="gerarNomeImagemLocal(${i})" title="Gerar nome local para esta imagem">
            📁 Local
          </button>
        </div>
        <input type="text"
               id="ed-img-${i}"
               value="${escapeHTML(valor)}"
               placeholder="https://… ou clique em Local"
               oninput="atualizarThumbGaleria(${i});atualizarPreviewCard()" />
      </div>
    </div>
  `;
  }).join("");
}

function atualizarThumbGaleria(i) {
  const input = document.getElementById(`ed-img-${i}`);
  const thumb = document.getElementById(`thumb-${i}`);
  const card = input?.closest(".galeria-input-card");
  if (!input || !thumb) return;
  const url = input.value.trim();
  thumb.style.backgroundImage = url ? `url('${url.replace(/'/g, "\\'")}')` : "";

  // Detectar se é local e marcar badge
  const ehLocal = url.startsWith("imagens/");
  if (card) card.classList.toggle("tem-local", ehLocal);
  // Re-render do badge no thumb
  let badge = thumb.querySelector(".galeria-badge-local");
  if (ehLocal && !badge) {
    badge = document.createElement("span");
    badge.className = "galeria-badge-local";
    badge.title = "Imagem local — carregar manualmente no GitHub";
    badge.textContent = "📁 LOCAL";
    thumb.appendChild(badge);
  } else if (!ehLocal && badge) {
    badge.remove();
  }
}

// ════════════════════════════════════════════════════════════
//  FASE 7 — Geração de nomes locais para imagens
// ════════════════════════════════════════════════════════════
//  Permite preencher um slot de imagem com "imagens/idN_imgX.jpg",
//  para que o utilizador faça upload manual da imagem para o
//  GitHub na pasta /imagens/ com esse nome.
//
//  O botão "Local" preenche um único slot. O botão "Gerar todos
//  os 4 nomes" preenche os 4 de uma vez.
// ════════════════════════════════════════════════════════════

function gerarNomeImagemLocal(i) {
  const idEl = document.getElementById("ed-id");
  const id = parseInt(idEl?.value) || gerarNovoId();
  // Se ainda não há ID guardado, salvar agora
  if (idEl && !idEl.value) idEl.value = id;

  const input = document.getElementById(`ed-img-${i}`);
  if (!input) return;

  const novoNome = `imagens/id${id}_img${i + 1}.jpg`;

  // Se o campo já tem um valor diferente, pedir confirmação
  if (input.value.trim() && input.value.trim() !== novoNome) {
    if (!confirm(`Substituir o valor actual?\n\nDe: ${input.value.trim().substring(0, 60)}\nPara: ${novoNome}`)) {
      return;
    }
  }

  input.value = novoNome;
  atualizarThumbGaleria(i);
  atualizarPreviewCard();
  mostrarToast(`Nome gerado: ${novoNome}`);
}

function gerarNomesImagensTodas() {
  const idEl = document.getElementById("ed-id");
  const id = parseInt(idEl?.value) || gerarNovoId();
  if (idEl && !idEl.value) idEl.value = id;

  // Verificar se algum slot já tem valor
  const valoresAtuais = [0, 1, 2, 3].map(i => document.getElementById(`ed-img-${i}`)?.value.trim() || "");
  const ocupados = valoresAtuais.filter(v => v && !v.startsWith(`imagens/id${id}_`)).length;

  if (ocupados > 0) {
    if (!confirm(`${ocupados} slot(s) já têm URLs preenchidas. Substituir todas pelos nomes locais?\n\nNomes a gerar:\n· imagens/id${id}_img1.jpg\n· imagens/id${id}_img2.jpg\n· imagens/id${id}_img3.jpg\n· imagens/id${id}_img4.jpg`)) {
      return;
    }
  }

  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`ed-img-${i}`);
    if (input) {
      input.value = `imagens/id${id}_img${i + 1}.jpg`;
      atualizarThumbGaleria(i);
    }
  }
  atualizarPreviewCard();
  mostrarToast(`4 nomes locais gerados para id#${id}`);
}

function atualizarPreviewPreco() {
  const preco = parseFloat(document.getElementById("ed-preco")?.value) || 0;
  const desc = parseFloat(document.getElementById("ed-desconto")?.value) || 0;
  const el = document.getElementById("preco-final-preview");
  if (!el) return;

  if (desc > 0 && preco > 0) {
    const final = preco * (1 - desc / 100);
    const poupanca = preco - final;
    el.classList.add("activo");
    el.innerHTML = `
      Preço final: <strong>${formatarMZN(final)}</strong>
      <span>(poupança ${formatarMZN(poupanca)})</span>
    `;
  } else {
    el.classList.remove("activo");
  }
}

function atualizarPreviewVideo() {
  const id = document.getElementById("ed-video")?.value.trim();
  const preview = document.getElementById("video-preview-admin");
  if (!preview) return;

  if (!id) {
    preview.classList.remove("activo");
    preview.innerHTML = "";
    return;
  }

  preview.classList.add("activo");
  preview.innerHTML = `<img src="https://img.youtube.com/vi/${escapeHTML(id)}/hqdefault.jpg" alt="Preview do vídeo" />`;
}

function atualizarContadorDescricao() {
  const txt = document.getElementById("ed-descricao")?.value || "";
  const cnt = document.getElementById("contador-descricao");
  if (cnt) cnt.textContent = `${txt.length} caracteres`;
}

function atualizarPreviewCard() {
  const nome = document.getElementById("ed-nome")?.value || "Nome do produto";
  const marca = document.getElementById("ed-marca")?.value || "Marca";
  const preco = parseFloat(document.getElementById("ed-preco")?.value) || 0;
  const desc = parseFloat(document.getElementById("ed-desconto")?.value) || 0;
  const disp = document.querySelector('input[name="ed-disp"]:checked')?.value || "disponivel";
  const destaque = document.getElementById("ed-destaque")?.checked;
  const ativo = document.getElementById("ed-ativo")?.checked;
  const img1 = document.getElementById("ed-img-0")?.value.trim();

  const temDesc = desc > 0;
  const final = temDesc ? preco * (1 - desc / 100) : preco;

  const dispLabel = disp === "disponivel" ? "Em stock" : "Sob encomenda";
  const dispClasse = disp === "disponivel" ? "preview-badge-stock" : "preview-badge-encomenda";

  document.getElementById("preview-card").innerHTML = `
    <div class="preview-card-img ${img1 ? '' : 'preview-card-img-vazia'}"
         style="background-image:${img1 ? `url('${img1.replace(/'/g, "\\'")}')` : 'none'}">
      <div class="preview-card-badges">
        ${destaque ? '<span class="preview-badge-destaque">⭐ Destaque</span>' : ''}
        ${temDesc ? `<span class="preview-badge-desc">−${desc}%</span>` : ''}
        ${!ativo ? '<span class="preview-badge-pausado">⏸ Pausado</span>' : ''}
        <span class="${dispClasse}">${dispLabel}</span>
      </div>
    </div>
    <div class="preview-card-corpo">
      <div class="preview-card-marca">${escapeHTML(marca)}</div>
      <div class="preview-card-nome">${escapeHTML(nome)}</div>
      <div class="preview-card-preco-wrap">
        ${temDesc ? `<span class="preview-card-preco-old">${formatarMZN(preco)}</span>` : ''}
        <span class="preview-card-preco">${formatarMZN(final)}</span>
      </div>
    </div>
  `;

  // Avisos do preview
  atualizarAvisosEditor();
}

function atualizarAvisosEditor() {
  const wrap = document.getElementById("preview-warnings");
  if (!wrap) return;

  const avisos = [];
  const nome = document.getElementById("ed-nome")?.value.trim();
  const marca = document.getElementById("ed-marca")?.value.trim();
  const cat = document.getElementById("ed-categoria")?.value.trim();
  const preco = parseFloat(document.getElementById("ed-preco")?.value) || 0;
  const desc = document.getElementById("ed-descricao")?.value.trim();
  const img1 = document.getElementById("ed-img-0")?.value.trim();

  if (!nome) avisos.push({ tipo: "erro", txt: "Nome é obrigatório" });
  if (!marca) avisos.push({ tipo: "erro", txt: "Marca é obrigatória" });
  if (!cat) avisos.push({ tipo: "erro", txt: "Categoria é obrigatória" });
  if (preco <= 0) avisos.push({ tipo: "erro", txt: "Preço deve ser maior que 0" });
  if (!img1) avisos.push({ tipo: "erro", txt: "Pelo menos a imagem principal é obrigatória" });
  if (desc.length < 30) avisos.push({ tipo: "aviso", txt: "Descrição muito curta (mín. 30 caracteres recomendado)" });
  if (img1 && img1.includes("unsplash.com")) avisos.push({ tipo: "aviso", txt: "Imagem ainda é placeholder Unsplash" });

  if (avisos.length === 0) {
    avisos.push({ tipo: "ok", txt: "Tudo pronto para salvar" });
  }

  wrap.innerHTML = avisos.map(a =>
    `<div class="preview-warning ${a.tipo === "erro" ? "erro" : a.tipo === "ok" ? "ok" : ""}">${escapeHTML(a.txt)}</div>`
  ).join("");
}

function fecharEditor() {
  document.getElementById("editor-overlay").classList.remove("aberto");
  document.body.style.overflow = "";
  produtoEmEdicao = null;
  produtoEditando = null;
}

function fecharEditorOverlay(e) {
  if (e.target === document.getElementById("editor-overlay")) fecharEditor();
}

function salvarProduto() {
  // Recolher dados do form
  const nome = document.getElementById("ed-nome")?.value.trim();
  const marca = document.getElementById("ed-marca")?.value.trim();
  const cat = document.getElementById("ed-categoria")?.value.trim();
  const preco = parseFloat(document.getElementById("ed-preco")?.value) || 0;
  const desconto = parseFloat(document.getElementById("ed-desconto")?.value) || 0;
  const disp = document.querySelector('input[name="ed-disp"]:checked')?.value || "disponivel";
  const destaque = document.getElementById("ed-destaque")?.checked;
  const ativo = document.getElementById("ed-ativo")?.checked;
  const video = document.getElementById("ed-video")?.value.trim();
  const descricao = document.getElementById("ed-descricao")?.value.trim();
  const imagens = [0, 1, 2, 3].map(i => document.getElementById(`ed-img-${i}`)?.value.trim() || "");

  // Validações
  if (!nome) { mostrarToast("Nome é obrigatório"); document.getElementById("ed-nome")?.focus(); return; }
  if (!marca) { mostrarToast("Marca é obrigatória"); document.getElementById("ed-marca")?.focus(); return; }
  if (!cat) { mostrarToast("Categoria é obrigatória"); document.getElementById("ed-categoria")?.focus(); return; }
  if (preco <= 0) { mostrarToast("Preço deve ser maior que 0"); document.getElementById("ed-preco")?.focus(); return; }
  if (!imagens[0]) { mostrarToast("Imagem principal é obrigatória"); document.getElementById("ed-img-0")?.focus(); return; }

  // Construir produto final
  const id = parseInt(document.getElementById("ed-id")?.value) || gerarNovoId();
  const dados = {
    id,
    nome,
    marca,
    categoria: cat,
    preco,
    desconto,
    disponibilidade: disp,
    destaque,
    ativo,
    imagens: imagens.map((img, i) => img || (i === 0 ? "" : imagens[0])), // fallback
    video,
    descricao,
    reviews: produtoEmEdicao?.reviews || [], // reviews actualizadas pelo editor de reviews
  };

  // Substituir ou adicionar
  const idx = produtosEditados.findIndex(p => p.id === id);
  if (idx >= 0) {
    produtosEditados[idx] = dados;
    registarHistorico("editar", `Editou <strong>${escapeHTML(nome)}</strong>`);
    mostrarToast(`"${nome}" actualizado`);
  } else {
    produtosEditados.push(dados);
    registarHistorico("criar", `Criou <strong>${escapeHTML(nome)}</strong>`);
    mostrarToast(`"${nome}" criado`);
  }

  salvarLocal();
  fecharEditor();
  renderizarTabela();
  renderizarDashboard();
  inicializarPainel(); // re-popular categorias
}


// ════════════════════════════════════════════════════════════
//  SELEÇÃO E ACÇÕES EM MASSA
// ════════════════════════════════════════════════════════════

function toggleSelecionado(id, checked) {
  if (checked) produtosSelecionados.add(id);
  else produtosSelecionados.delete(id);
  atualizarBulkBar();
}

function bulkToggleAll(checkbox) {
  const filtrados = obterProdutosFiltrados();
  if (checkbox.checked) {
    filtrados.forEach(p => produtosSelecionados.add(p.id));
  } else {
    filtrados.forEach(p => produtosSelecionados.delete(p.id));
  }
  renderizarTabela();
  atualizarBulkBar();
}

function bulkLimpar() {
  produtosSelecionados.clear();
  renderizarTabela();
  atualizarBulkBar();
}

function atualizarBulkBar() {
  const bar = document.getElementById("bulk-bar");
  const num = document.getElementById("bulk-count-num");
  if (!bar) return;
  if (produtosSelecionados.size === 0) {
    bar.style.display = "none";
  } else {
    bar.style.display = "flex";
    if (num) num.textContent = produtosSelecionados.size;
  }
}

function bulkAcao(acao) {
  if (produtosSelecionados.size === 0) return;
  const ids = [...produtosSelecionados];
  const lista = produtosEditados.filter(p => ids.includes(p.id));

  if (acao === "pausar") {
    lista.forEach(p => p.ativo = false);
    registarHistorico("bulk", `Pausou <strong>${ids.length}</strong> produto(s) em massa`);
    salvarLocal();
    renderizarTabela();
    renderizarDashboard();
    mostrarToast(`${ids.length} produto(s) pausados`);
  }

  else if (acao === "despausar") {
    lista.forEach(p => p.ativo = true);
    registarHistorico("bulk", `Reactivou <strong>${ids.length}</strong> produto(s) em massa`);
    salvarLocal();
    renderizarTabela();
    renderizarDashboard();
    mostrarToast(`${ids.length} produto(s) reactivados`);
  }

  else if (acao === "desconto") {
    abrirPrompt({
      titulo: "Aplicar desconto",
      mensagem: `Insira a percentagem de desconto a aplicar aos ${ids.length} produto(s) seleccionados (0–100). Use 0 para remover desconto.`,
      placeholder: "Ex: 15",
      callback: (valor) => {
        const pct = parseFloat(valor);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          mostrarToast("Valor inválido");
          return;
        }
        lista.forEach(p => p.desconto = pct);
        registarHistorico("bulk", `Aplicou ${pct}% desconto a <strong>${ids.length}</strong> produto(s)`);
        salvarLocal();
        renderizarTabela();
        renderizarDashboard();
        mostrarToast(`Desconto de ${pct}% aplicado a ${ids.length} produto(s)`);
        bulkLimpar();
      },
    });
  }

  else if (acao === "destacar") {
    lista.forEach(p => p.destaque = true);
    registarHistorico("bulk", `Destacou <strong>${ids.length}</strong> produto(s) em massa`);
    salvarLocal();
    renderizarTabela();
    renderizarDashboard();
    mostrarToast(`${ids.length} produto(s) destacados`);
  }

  else if (acao === "desdestacar") {
    lista.forEach(p => p.destaque = false);
    registarHistorico("bulk", `Tirou destaque a <strong>${ids.length}</strong> produto(s)`);
    salvarLocal();
    renderizarTabela();
    renderizarDashboard();
    mostrarToast(`${ids.length} produto(s) sem destaque`);
  }

  else if (acao === "categoria") {
    // Categorias actuais (excluindo "Todos")
    const cats = [...new Set(produtosEditados.map(p => p.categoria).filter(Boolean))].sort();
    if (cats.length === 0) {
      mostrarToast("Não há categorias definidas ainda");
      return;
    }
    const opcoesTexto = cats.map((c, i) => `${i+1}. ${c}`).join("\n");
    abrirPrompt({
      titulo: "Mudar categoria",
      mensagem: `Escreva o número da categoria a aplicar aos ${ids.length} produto(s) seleccionados, ou escreva uma nova categoria.\n\nCategorias existentes:\n${opcoesTexto}`,
      placeholder: "Ex: 2 ou nome da nova categoria",
      callback: (valor) => {
        const txt = String(valor || "").trim();
        if (!txt) { mostrarToast("Valor vazio"); return; }
        let categoria = txt;
        const idx = parseInt(txt, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= cats.length) {
          categoria = cats[idx - 1];
        }
        lista.forEach(p => p.categoria = categoria);
        registarHistorico("bulk", `Categoria de <strong>${ids.length}</strong> produto(s) → <strong>${escapeHTML(categoria)}</strong>`);
        salvarLocal();
        renderizarTabela();
        renderizarDashboard();
        inicializarPainel();
        mostrarToast(`Categoria "${categoria}" aplicada a ${ids.length} produto(s)`);
        bulkLimpar();
      },
    });
  }

  else if (acao === "minimo") {
    abrirPrompt({
      titulo: "Definir mínimo de cotação",
      mensagem: `Insira o valor mínimo de cotação em MZN para os ${ids.length} produto(s) seleccionados. Use 0 para remover o mínimo.`,
      placeholder: "Ex: 2000",
      callback: (valor) => {
        const min = parseFloat(valor);
        if (isNaN(min) || min < 0) {
          mostrarToast("Valor inválido");
          return;
        }
        lista.forEach(p => p.minimoCotacao = min);
        registarHistorico("bulk", min > 0
          ? `Definiu mínimo de ${formatarMZN(min)} em <strong>${ids.length}</strong> produto(s)`
          : `Removeu mínimo de <strong>${ids.length}</strong> produto(s)`
        );
        salvarLocal();
        renderizarTabela();
        renderizarDashboard();
        mostrarToast(min > 0 ? `Mínimo de ${formatarMZN(min)} aplicado` : `Mínimo removido`);
        bulkLimpar();
      },
    });
  }

  else if (acao === "eliminar") {
    abrirConfirm({
      titulo: `Eliminar ${ids.length} produto(s)?`,
      mensagem: "Esta acção não pode ser desfeita facilmente.",
      btnTexto: "Sim, eliminar todos",
      perigo: true,
      callback: () => {
        produtosEditados = produtosEditados.filter(p => !ids.includes(p.id));
        produtosSelecionados.clear();
        registarHistorico("bulk", `Eliminou <strong>${ids.length}</strong> produto(s) em massa`);
        salvarLocal();
        renderizarTabela();
        renderizarDashboard();
        mostrarToast(`${ids.length} produto(s) eliminados`);
      },
    });
  }
}


// ════════════════════════════════════════════════════════════
//  EXPORTAR PRODUTOS.JS
// ════════════════════════════════════════════════════════════

function exportarProdutos() {
  if (produtosEditados.length === 0) {
    mostrarToast("Não há produtos para exportar");
    return;
  }

  const conteudo = gerarConteudoProdutosJs();
  const blob = new Blob([conteudo], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "produtos.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Marcar como "exportado" mas manter em localStorage caso queira mais alterações
  temMudancas = false;
  atualizarStatusMudancas();
  mostrarToast("produtos.js exportado!");
}

// ════════════════════════════════════════════════════════════
//  GERAR SITEMAP.XML (Fase 11B — SEO)
// ════════════════════════════════════════════════════════════
//  Gera um sitemap actualizado com todos os produtos activos.
//  O ficheiro tem de ser feito push manualmente para a raiz do
//  repositório GitHub para o Google indexar.
// ════════════════════════════════════════════════════════════
function exportarSitemap() {
  const ativos = produtosEditados.filter(p => p.ativo !== false);
  if (ativos.length === 0) {
    mostrarToast("Não há produtos activos");
    return;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const BASE = "https://lumartcomercial.com";

  const linhas = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    '  <url>',
    `    <loc>${BASE}/</loc>`,
    `    <lastmod>${hoje}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
  ];

  // Uma <url> por cada produto activo (com imagem para Google Image Search)
  ativos.sort((a, b) => a.id - b.id).forEach(p => {
    linhas.push('  <url>');
    linhas.push(`    <loc>${BASE}/produto.html?id=${p.id}</loc>`);
    linhas.push(`    <lastmod>${hoje}</lastmod>`);
    linhas.push('    <changefreq>monthly</changefreq>');
    linhas.push('    <priority>0.8</priority>');
    // Imagem principal (se for URL válida — não data: ou vazia)
    const img0 = p.imagens && p.imagens[0];
    if (img0 && typeof img0 === "string" && /^https?:\/\//i.test(img0)) {
      linhas.push('    <image:image>');
      linhas.push(`      <image:loc>${escapeXML(img0)}</image:loc>`);
      linhas.push(`      <image:title>${escapeXML(p.nome)}</image:title>`);
      linhas.push('    </image:image>');
    }
    linhas.push('  </url>');
  });

  linhas.push('</urlset>');

  const xml = linhas.join("\n");
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "sitemap.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarToast(`sitemap.xml gerado · ${ativos.length} produtos + página inicial`);
}

// Escapa caracteres especiais para XML
function escapeXML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function gerarConteudoProdutosJs() {
  // Recriar o ficheiro produtos.js com todos os dados actualizados
  const produtosOrdenados = [...produtosEditados].sort((a, b) => a.id - b.id);

  let conteudo = `// ============================================================
//  LUMART COMERCIAL — Catálogo + Configurações Globais
//  ============================================================
//  Gerado pelo painel de administração em ${new Date().toLocaleString("pt-BR")}
// ============================================================


// ════════════════════════════════════════════════════════════
//  1. CATÁLOGO DE PRODUTOS
// ════════════════════════════════════════════════════════════

const PRODUTOS = ${jsonParaJsLiteral(produtosOrdenados)};


// ════════════════════════════════════════════════════════════
//  2. CATEGORIAS (gerado automaticamente)
// ════════════════════════════════════════════════════════════
const CATEGORIAS = ["Todos", ...new Set(PRODUTOS.map(p => p.categoria))];


// ════════════════════════════════════════════════════════════
//  3. CONFIGURAÇÕES DA LOJA
// ════════════════════════════════════════════════════════════
const WHATSAPP_NUMERO = "${WHATSAPP_NUMERO}";


// ════════════════════════════════════════════════════════════
//  3.1 TAXA DE CÂMBIO MZN → ZAR (Fase 4)
// ════════════════════════════════════════════════════════════
//  Usado quando o cliente escolhe África do Sul como destino.
//  Cálculo: precoZAR = precoMZN × TAXA_CAMBIO_ZAR.valor
//  Edição: pelo painel admin (Tab "Frete" → secção "Taxa de Câmbio")
// ════════════════════════════════════════════════════════════
const TAXA_CAMBIO_ZAR = ${JSON.stringify(taxaCambioEditada || (typeof TAXA_CAMBIO_ZAR !== "undefined" ? TAXA_CAMBIO_ZAR : { valor: 0.27, dataActualizacao: new Date().toISOString().slice(0,10) }), null, 2)};


// ════════════════════════════════════════════════════════════
//  4. TABELA DE FRETE (em MZN)
// ════════════════════════════════════════════════════════════

const FRETE = ${JSON.stringify(freteEditado || FRETE, null, 2)};


// ════════════════════════════════════════════════════════════
//  5. ZONAS DE ENTREGA
// ════════════════════════════════════════════════════════════

const ZONAS_ENTREGA = ${JSON.stringify(ZONAS_ENTREGA, null, 2)};


// ════════════════════════════════════════════════════════════
//  6. PRAZOS DE ENTREGA (em dias úteis)
// ════════════════════════════════════════════════════════════

const PRAZOS = ${JSON.stringify(PRAZOS, null, 2)};


// ════════════════════════════════════════════════════════════
//  7. REGRAS DE PAGAMENTO
// ════════════════════════════════════════════════════════════

const PAGAMENTO_REGRAS = ${JSON.stringify(PAGAMENTO_REGRAS, null, 2)};


// ════════════════════════════════════════════════════════════
//  8. PAÍSES DISPONÍVEIS
// ════════════════════════════════════════════════════════════

const PAISES = ${JSON.stringify(PAISES, null, 2)};


// ════════════════════════════════════════════════════════════
//  9. FUNÇÕES UTILITÁRIAS
// ════════════════════════════════════════════════════════════

function formatarMZN(valor) {
  return "MZN\\u00a0" + Number(valor).toFixed(2)
    .replace(".", ",")
    .replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
}

// Conversão MZN → ZAR (Fase 4) — usado quando cliente escolhe África do Sul
function mznParaZar(valorMZN) {
  const taxa = (typeof TAXA_CAMBIO_ZAR !== "undefined") ? TAXA_CAMBIO_ZAR.valor : 0;
  return Number(valorMZN) * Number(taxa);
}

function formatarZAR(valor) {
  return "R\\u00a0" + Number(valor).toFixed(2)
    .replace(".", ",")
    .replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
}

function formatarComZAR(valorMZN) {
  return formatarMZN(valorMZN) + " (\\u2248 " + formatarZAR(mznParaZar(valorMZN)) + ")";
}

function precoComDesconto(produto) {
  if (!produto.desconto || produto.desconto <= 0) return produto.preco;
  return produto.preco * (1 - produto.desconto / 100);
}

function obterZona(provincia) {
  return ZONAS_ENTREGA[provincia] || null;
}

function calcularFrete(pais, provincia) {
  if (!pais || !provincia) return 0;
  return FRETE[pais]?.[provincia] || 0;
}

function calcularPrazoEntrega(carrinho, provincia) {
  const zona = obterZona(provincia);
  if (!zona || carrinho.length === 0) return { min: 0, max: 0, limitadoPor: null };

  const tiposNoCarrinho = new Set(carrinho.map(item => item.disponibilidade));

  if (tiposNoCarrinho.size === 1) {
    const tipo = [...tiposNoCarrinho][0];
    const prazo = PRAZOS[tipo][zona];
    return { min: prazo.min, max: prazo.max, limitadoPor: tipo };
  }

  const prazoDisp = PRAZOS.disponivel[zona];
  const prazoSob  = PRAZOS.sob_encomenda[zona];
  const limitadoPor = prazoSob.max > prazoDisp.max ? "sob_encomenda" : "disponivel";

  return {
    min:        Math.max(prazoDisp.min, prazoSob.min),
    max:        Math.max(prazoDisp.max, prazoSob.max),
    limitadoPor,
  };
}

function calcularSinal(carrinho) {
  let sinalDisponivel    = 0;
  let sinalSobEncomenda  = 0;
  let totalDisponivel    = 0;
  let totalSobEncomenda  = 0;

  carrinho.forEach(item => {
    const valor = precoComDesconto(item) * item.qtd;
    if (item.disponibilidade === "disponivel") {
      totalDisponivel += valor;
      sinalDisponivel += valor * PAGAMENTO_REGRAS.disponivel.sinal;
    } else {
      totalSobEncomenda += valor;
      sinalSobEncomenda += valor * PAGAMENTO_REGRAS.sob_encomenda.sinal;
    }
  });

  const sinal     = sinalDisponivel + sinalSobEncomenda;
  const total     = totalDisponivel + totalSobEncomenda;
  const restante  = total - sinal;

  return {
    sinal,
    restante,
    total,
    detalhes: {
      totalDisponivel,
      totalSobEncomenda,
      sinalDisponivel,
      sinalSobEncomenda,
    },
  };
}

function termosPagamentoTexto(carrinho) {
  const temDisponivel = carrinho.some(i => i.disponibilidade === "disponivel");
  const temSobEnc     = carrinho.some(i => i.disponibilidade === "sob_encomenda");

  if (temDisponivel && temSobEnc) {
    return [
      "Produtos em stock: 100% no pedido",
      "Produtos sob encomenda: 75% no pedido + 25% na entrega",
    ];
  }
  if (temSobEnc) {
    return ["75% no momento do pedido + 25% na entrega"];
  }
  return ["100% no momento do pedido"];
}

function mediaReviews(produto) {
  if (!produto.reviews || produto.reviews.length === 0) return 0;
  const soma = produto.reviews.reduce((a, r) => a + r.estrelas, 0);
  return soma / produto.reviews.length;
}

function produtosRelacionados(produto, limite = 4) {
  return produtosAtivos()
    .filter(p => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, limite);
}

function tipoEnvio(provincia) {
  const zona = obterZona(provincia);
  if (!zona) return null;
  switch (zona) {
    case "MZ-sul":
      return { tipo: "Terrestre", detalhe: "Via taxistas regionais" };
    case "MZ-centro":
    case "MZ-norte":
      return { tipo: "Aéreo nacional", detalhe: "Via correios de Moçambique" };
    case "ZA":
      return { tipo: "Aéreo internacional", detalhe: "Via correios internacionais" };
    default:
      return null;
  }
}

function produtosAtivos() {
  return PRODUTOS.filter(p => p.ativo !== false);
}


// ════════════════════════════════════════════════════════════
//  10. REGRAS DE MÍNIMO DE COTAÇÃO
// ════════════════════════════════════════════════════════════
//  Cada produto pode ter um campo \`minimoCotacao\` (em MZN). Quando há
//  produtos com mínimo no carrinho, o subtotal de produtos tem de ser
//  >= ao maior mínimo entre eles. O frete não conta.
// ════════════════════════════════════════════════════════════

function validarMinimoCotacao(carrinho) {
  const subtotal = (carrinho || []).reduce(
    (a, i) => a + precoComDesconto(i) * i.qtd, 0
  );

  if (!carrinho || carrinho.length === 0) {
    return {
      valido: true, subtotal: 0, maiorMinimo: 0,
      produtoLimitante: null, produtosComMinimo: [], faltam: 0,
    };
  }

  const produtosComMinimo = carrinho.filter(p => (Number(p.minimoCotacao) || 0) > 0);

  if (produtosComMinimo.length === 0) {
    return {
      valido: true, subtotal, maiorMinimo: 0,
      produtoLimitante: null, produtosComMinimo: [], faltam: 0,
    };
  }

  const produtoLimitante = produtosComMinimo.reduce((maior, p) =>
    (Number(p.minimoCotacao) > Number(maior?.minimoCotacao || 0) ? p : maior), null);

  const maiorMinimo = Number(produtoLimitante.minimoCotacao);
  const valido = subtotal >= maiorMinimo;
  const faltam = valido ? 0 : (maiorMinimo - subtotal);

  return { valido, subtotal, maiorMinimo, produtoLimitante, produtosComMinimo, faltam };
}
`;

  return conteudo;
}

// Converter array de produtos para literal JS legível e bem formatado
function jsonParaJsLiteral(produtos) {
  const linhas = ["["];
  produtos.forEach((p, idx) => {
    linhas.push(`  {`);
    linhas.push(`    id: ${p.id},`);
    linhas.push(`    nome: ${JSON.stringify(p.nome)},`);
    linhas.push(`    marca: ${JSON.stringify(p.marca)},`);
    linhas.push(`    categoria: ${JSON.stringify(p.categoria)},`);
    linhas.push(`    preco: ${p.preco},`);
    linhas.push(`    desconto: ${p.desconto || 0},`);
    linhas.push(`    disponibilidade: ${JSON.stringify(p.disponibilidade)},`);
    linhas.push(`    destaque: ${!!p.destaque},`);
    linhas.push(`    ativo: ${p.ativo !== false},`);
    linhas.push(`    minimoCotacao: ${Number(p.minimoCotacao) || 0},`);
    linhas.push(`    imagens: [`);
    (p.imagens || []).forEach((img, i) => {
      linhas.push(`      ${JSON.stringify(img)}${i < p.imagens.length - 1 ? "," : ""}`);
    });
    linhas.push(`    ],`);
    linhas.push(`    video: ${JSON.stringify(p.video || "")},`);
    linhas.push(`    descricao: ${JSON.stringify(p.descricao || "")},`);
    linhas.push(`    reviews: [`);
    (p.reviews || []).forEach((r, i) => {
      linhas.push(`      { nome: ${JSON.stringify(r.nome)}, estrelas: ${r.estrelas}, data: ${JSON.stringify(r.data)}, comentario: ${JSON.stringify(r.comentario)} }${i < p.reviews.length - 1 ? "," : ""}`);
    });
    linhas.push(`    ],`);
    linhas.push(`  }${idx < produtos.length - 1 ? "," : ""}`);
  });
  linhas.push("]");
  return linhas.join("\n");
}


// ════════════════════════════════════════════════════════════
//  CONFIRM / PROMPT GENÉRICOS (substitutos do alert/confirm)
// ════════════════════════════════════════════════════════════

function abrirConfirm({ titulo, mensagem, btnTexto = "Confirmar", perigo = false, callback }) {
  document.getElementById("confirm-titulo").textContent = titulo;
  document.getElementById("confirm-msg").innerHTML = mensagem;
  const btn = document.getElementById("confirm-ok");
  btn.textContent = btnTexto;
  btn.classList.toggle("btn-admin-perigo", perigo);
  btn.classList.toggle("btn-admin-primary", !perigo);
  confirmCallback = callback;
  document.getElementById("confirm-overlay").classList.add("aberto");
}

function confirmConfirmar() {
  document.getElementById("confirm-overlay").classList.remove("aberto");
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
}

function confirmCancelar() {
  document.getElementById("confirm-overlay").classList.remove("aberto");
  confirmCallback = null;
}

function abrirPrompt({ titulo, mensagem, placeholder = "", callback }) {
  document.getElementById("prompt-titulo").textContent = titulo;
  document.getElementById("prompt-msg").textContent = mensagem;
  const inp = document.getElementById("prompt-input");
  inp.placeholder = placeholder;
  inp.value = "";
  promptCallback = callback;
  document.getElementById("prompt-overlay").classList.add("aberto");
  setTimeout(() => inp.focus(), 100);
  inp.onkeydown = e => { if (e.key === "Enter") promptConfirmar(); if (e.key === "Escape") promptCancelar(); };
}

function promptConfirmar() {
  const v = document.getElementById("prompt-input").value;
  document.getElementById("prompt-overlay").classList.remove("aberto");
  if (promptCallback) promptCallback(v);
  promptCallback = null;
}

function promptCancelar() {
  document.getElementById("prompt-overlay").classList.remove("aberto");
  promptCallback = null;
}


// ════════════════════════════════════════════════════════════
//  TOAST (caso o site não tenha carregado um)
// ════════════════════════════════════════════════════════════

function mostrarToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("visivel");
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.classList.remove("visivel"), 2800);
}


// ════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ════════════════════════════════════════════════════════════
//  FRETE — Editor das tarifas
// ════════════════════════════════════════════════════════════

function renderizarFrete() {
  if (!freteEditado) freteEditado = JSON.parse(JSON.stringify(FRETE));

  // Tabela MZ
  const tabMZ = document.getElementById("tabela-frete-mz");
  if (tabMZ) tabMZ.innerHTML = renderTabelaFretePais("MZ");

  // Tabela ZA
  const tabZA = document.getElementById("tabela-frete-za");
  if (tabZA) tabZA.innerHTML = renderTabelaFretePais("ZA");

  // Stats
  atualizarFreteStats();
}

function renderTabelaFretePais(pais) {
  const provincias = Object.keys(freteEditado[pais] || {});
  if (provincias.length === 0) return "<tbody><tr><td>Sem dados</td></tr></tbody>";

  let html = `
    <thead>
      <tr>
        <th>Província</th>
        <th>Tipo de envio</th>
        <th>Tarifa</th>
      </tr>
    </thead>
    <tbody>`;

  provincias.forEach(prov => {
    const valorOriginal = FRETE[pais]?.[prov] ?? 0;
    const valorActual = freteEditado[pais][prov];
    const alterado = valorOriginal !== valorActual;

    const zona = ZONAS_ENTREGA[prov];
    let tipoLabel = "—", tipoClass = "";
    if (zona === "MZ-sul") { tipoLabel = "🚐 Terrestre"; tipoClass = "terrestre"; }
    else if (zona === "MZ-centro" || zona === "MZ-norte") { tipoLabel = "✈️ Aéreo nacional"; tipoClass = "aereo-nac"; }
    else if (zona === "ZA") { tipoLabel = "✈️ Aéreo internacional"; tipoClass = "aereo-int"; }

    html += `
      <tr>
        <td><span class="frete-provincia">${escapeHTML(prov)}</span></td>
        <td><span class="frete-tipo ${tipoClass}">${tipoLabel}</span></td>
        <td>
          <div class="frete-input-wrap">
            <span class="frete-mzn">MZN</span>
            <input type="number"
                   class="frete-input ${alterado ? 'alterado' : ''}"
                   value="${valorActual}"
                   min="0"
                   step="50"
                   data-pais="${pais}"
                   data-prov="${escapeHTML(prov)}"
                   onchange="atualizarValorFrete(this)" />
          </div>
        </td>
      </tr>`;
  });

  html += `</tbody>`;
  return html;
}

function atualizarValorFrete(input) {
  const pais = input.dataset.pais;
  const prov = input.dataset.prov;
  const novoValor = parseFloat(input.value) || 0;

  if (novoValor < 0) {
    mostrarToast("Valor não pode ser negativo");
    input.value = freteEditado[pais][prov];
    return;
  }

  const valorAnterior = freteEditado[pais][prov];
  freteEditado[pais][prov] = novoValor;

  // Marcar como alterado se diferente do original
  const original = FRETE[pais]?.[prov] ?? 0;
  if (novoValor !== original) {
    input.classList.add("alterado");
  } else {
    input.classList.remove("alterado");
  }

  if (valorAnterior !== novoValor) {
    registarHistorico("frete", `Frete ${prov}: ${formatarMZN(valorAnterior)} → ${formatarMZN(novoValor)}`);
  }
  salvarLocal();
  atualizarFreteStats();
}

function atualizarFreteStats() {
  if (!freteEditado) return;

  const valoresMZ = Object.values(freteEditado.MZ || {});
  const valoresZA = Object.values(freteEditado.ZA || {});
  const todos = [...valoresMZ, ...valoresZA];

  if (todos.length === 0) return;

  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const mediaMZ = valoresMZ.length ? valoresMZ.reduce((a,b) => a+b, 0) / valoresMZ.length : 0;
  const mediaZA = valoresZA.length ? valoresZA.reduce((a,b) => a+b, 0) / valoresZA.length : 0;

  setTextoEl("frete-min", formatarMZN(min));
  setTextoEl("frete-max", formatarMZN(max));
  setTextoEl("frete-media-mz", formatarMZN(mediaMZ));
  setTextoEl("frete-media-za", formatarMZN(mediaZA));
}

function setTextoEl(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function restaurarFretePadrao() {
  abrirConfirm({
    titulo: "Restaurar valores padrão?",
    mensagem: "Todos os valores de frete voltarão aos originais. As suas alterações ao frete serão perdidas (mas não afecta os produtos).",
    btnTexto: "Sim, restaurar",
    perigo: true,
    callback: () => {
      freteEditado = JSON.parse(JSON.stringify(FRETE));
      registarHistorico("frete", "Restaurou tarifas de frete aos valores padrão");
      salvarLocal();
      renderizarFrete();
      mostrarToast("Tarifas restauradas aos valores originais");
    },
  });
}


// ════════════════════════════════════════════════════════════
//  TAXA DE CÂMBIO MZN → ZAR (Fase 4)
// ════════════════════════════════════════════════════════════

// Padrão a usar quando não há nada guardado
function clonarTaxaCambioPadrao() {
  if (typeof TAXA_CAMBIO_ZAR !== "undefined") {
    return JSON.parse(JSON.stringify(TAXA_CAMBIO_ZAR));
  }
  return { valor: 0.27, dataActualizacao: new Date().toISOString().slice(0, 10) };
}

// Renderiza os campos do painel com os valores actuais e liga a preview ao input
function renderizarCambio() {
  const inpValor = document.getElementById("ed-taxa-zar");
  const inpData  = document.getElementById("ed-data-cambio");
  if (!inpValor || !inpData) return;

  inpValor.value = Number(taxaCambioEditada?.valor || 0.27);
  inpData.value  = taxaCambioEditada?.dataActualizacao || new Date().toISOString().slice(0, 10);

  atualizarPreviewCambio();

  // Live preview ao digitar
  inpValor.oninput = atualizarPreviewCambio;
  inpData.oninput  = () => {};
}

function atualizarPreviewCambio() {
  const inp = document.getElementById("ed-taxa-zar");
  const taxa = Number(inp?.value) || 0;
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (typeof formatarZAR === "function")
      ? formatarZAR(v * taxa)
      : "R " + (v * taxa).toFixed(2);
  };
  set("cambio-prev-1000", 1000);
  set("cambio-prev-5000", 5000);
  set("cambio-prev-10000", 10000);
}

function guardarTaxaCambio() {
  const inpValor = document.getElementById("ed-taxa-zar");
  const inpData  = document.getElementById("ed-data-cambio");
  if (!inpValor) return;

  const valor = parseFloat(inpValor.value);
  if (!Number.isFinite(valor) || valor <= 0) {
    mostrarToast("Valor inválido. Use um número maior que 0 (ex: 0.27)");
    inpValor.focus();
    return;
  }
  const data = inpData?.value || new Date().toISOString().slice(0, 10);

  taxaCambioEditada = {
    valor: Number(valor.toFixed(6)),
    dataActualizacao: data,
  };

  registarHistorico("cambio", `Taxa de câmbio actualizada para 1 MZN = ${valor.toFixed(4)} R`);
  salvarLocal();
  mostrarToast(`Taxa guardada: 1 MZN = ${valor.toFixed(4)} R`);
}

function restaurarTaxaCambio() {
  abrirConfirm({
    titulo: "Restaurar taxa padrão?",
    mensagem: "A taxa voltará para 1 MZN = 0.27 R com a data de hoje.",
    btnTexto: "Sim, restaurar",
    perigo: true,
    callback: () => {
      taxaCambioEditada = {
        valor: 0.27,
        dataActualizacao: new Date().toISOString().slice(0, 10),
      };
      registarHistorico("cambio", "Restaurou taxa de câmbio para 0.27");
      salvarLocal();
      renderizarCambio();
      mostrarToast("Taxa restaurada para 0.27");
    },
  });
}


// ════════════════════════════════════════════════════════════
//  REVIEWS — Editor dentro do produto
// ════════════════════════════════════════════════════════════

function renderizarReviews() {
  if (!produtoEmEdicao) return;

  const lista = document.getElementById("reviews-lista");
  const stats = document.getElementById("reviews-stats");
  if (!lista) return;

  const reviews = produtoEmEdicao.reviews || [];

  if (stats) {
    if (reviews.length === 0) {
      stats.textContent = "Sem reviews";
    } else {
      const media = reviews.reduce((a, r) => a + r.estrelas, 0) / reviews.length;
      stats.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''} · média ${media.toFixed(1)} ★`;
    }
  }

  if (reviews.length === 0) {
    lista.innerHTML = `<div class="reviews-vazio">Nenhuma review ainda. Adicione uma para mostrar avaliações no site.</div>`;
    return;
  }

  lista.innerHTML = reviews.map((r, i) => `
    <div class="review-card">
      <div class="review-card-content">
        <div class="review-card-header">
          <span class="review-card-nome">${escapeHTML(r.nome)}</span>
          <span class="review-card-stars">${'★'.repeat(r.estrelas)}${'☆'.repeat(5 - r.estrelas)}</span>
          <span class="review-card-data">${escapeHTML(formatarDataReview(r.data))}</span>
        </div>
        <p class="review-card-comentario">${escapeHTML(r.comentario)}</p>
      </div>
      <div class="review-card-acoes">
        <button class="review-acao-btn" onclick="editarReview(${i})" title="Editar">✏️</button>
        <button class="review-acao-btn eliminar" onclick="eliminarReview(${i})" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join("");
}

function formatarDataReview(data) {
  if (!data) return "";
  // Aceitar formatos ISO (2024-01-15) ou já formatados
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString("pt-BR");
  } catch { return data; }
}

function adicionarReview() {
  reviewEditando = -1; // -1 indica nova review
  document.getElementById("review-titulo").textContent = "Nova review";
  document.getElementById("rv-nome").value = "";
  document.getElementById("rv-comentario").value = "";
  document.getElementById("rv-data").value = new Date().toISOString().split("T")[0];
  setReviewEstrelas(5);
  document.getElementById("review-overlay").classList.add("aberto");
  setTimeout(() => document.getElementById("rv-nome")?.focus(), 100);
}

function editarReview(idx) {
  if (!produtoEmEdicao || !produtoEmEdicao.reviews) return;
  const r = produtoEmEdicao.reviews[idx];
  if (!r) return;

  reviewEditando = idx;
  document.getElementById("review-titulo").textContent = "Editar review";
  document.getElementById("rv-nome").value = r.nome || "";
  document.getElementById("rv-comentario").value = r.comentario || "";

  // Tentar normalizar data para input type=date (yyyy-mm-dd)
  let dataIso = r.data || "";
  try {
    const d = new Date(r.data);
    if (!isNaN(d.getTime())) dataIso = d.toISOString().split("T")[0];
  } catch {}
  document.getElementById("rv-data").value = dataIso;

  setReviewEstrelas(r.estrelas || 5);
  document.getElementById("review-overlay").classList.add("aberto");
}

function setReviewEstrelas(n) {
  document.getElementById("rv-estrelas").value = n;
  document.querySelectorAll("#stars-picker button").forEach(btn => {
    const r = parseInt(btn.dataset.rating);
    btn.classList.toggle("activo", r <= n);
  });
}

function fecharReviewEditor() {
  document.getElementById("review-overlay").classList.remove("aberto");
  reviewEditando = null;
}

function salvarReview() {
  if (!produtoEmEdicao) return;

  const nome = document.getElementById("rv-nome").value.trim();
  const estrelas = parseInt(document.getElementById("rv-estrelas").value) || 5;
  const data = document.getElementById("rv-data").value;
  const comentario = document.getElementById("rv-comentario").value.trim();

  if (!nome) { mostrarToast("Nome do cliente é obrigatório"); return; }
  if (!comentario || comentario.length < 10) { mostrarToast("Comentário muito curto (mín. 10 caracteres)"); return; }
  if (estrelas < 1 || estrelas > 5) { mostrarToast("Estrelas devem ser entre 1 e 5"); return; }

  const review = {
    nome,
    estrelas,
    data: data || new Date().toISOString().split("T")[0],
    comentario,
  };

  if (!produtoEmEdicao.reviews) produtoEmEdicao.reviews = [];

  if (reviewEditando === -1) {
    produtoEmEdicao.reviews.push(review);
    registarHistorico("reviews", `Adicionou review de <strong>${escapeHTML(nome)}</strong>`);
    mostrarToast("Review adicionada");
  } else {
    produtoEmEdicao.reviews[reviewEditando] = review;
    registarHistorico("reviews", `Editou review de <strong>${escapeHTML(nome)}</strong>`);
    mostrarToast("Review actualizada");
  }

  // Salvar imediato no localStorage para reflectir nas mudanças
  salvarLocal();
  fecharReviewEditor();
  renderizarReviews();
}

function eliminarReview(idx) {
  if (!produtoEmEdicao || !produtoEmEdicao.reviews) return;
  const r = produtoEmEdicao.reviews[idx];
  if (!r) return;

  abrirConfirm({
    titulo: "Eliminar review?",
    mensagem: `Quer eliminar a review de <strong>"${escapeHTML(r.nome)}"</strong>?`,
    btnTexto: "Sim, eliminar",
    perigo: true,
    callback: () => {
      produtoEmEdicao.reviews.splice(idx, 1);
      registarHistorico("reviews", `Eliminou review de <strong>${escapeHTML(r.nome)}</strong>`);
      salvarLocal();
      renderizarReviews();
      mostrarToast("Review eliminada");
    },
  });
}


// ════════════════════════════════════════════════════════════
//  TEMA (claro / escuro)
// ════════════════════════════════════════════════════════════

function carregarTema() {
  const tema = localStorage.getItem(ADMIN_KEY_TEMA) || "claro";
  aplicarTema(tema);
}

function aplicarTema(tema) {
  if (tema === "escuro") {
    document.body.classList.add("admin-tema-escuro");
  } else {
    document.body.classList.remove("admin-tema-escuro");
  }
}

function toggleTema() {
  const actual = localStorage.getItem(ADMIN_KEY_TEMA) || "claro";
  const novo = actual === "claro" ? "escuro" : "claro";
  localStorage.setItem(ADMIN_KEY_TEMA, novo);
  aplicarTema(novo);
  mostrarToast(novo === "escuro" ? "Modo escuro activado" : "Modo claro activado");
}


// ════════════════════════════════════════════════════════════
//  PRÉ-VISUALIZAÇÃO COMPLETA
// ════════════════════════════════════════════════════════════

let previewTab = "catalogo";

function abrirPreviewCompleto() {
  // Recolher dados actuais do form (não precisa salvar)
  const dados = obterDadosPreview();
  if (!dados) {
    mostrarToast("Preencha pelo menos o nome e a imagem principal");
    return;
  }

  document.getElementById("preview-completo-overlay").classList.add("aberto");
  mudarPreviewTab("catalogo");
}

function fecharPreviewCompleto() {
  document.getElementById("preview-completo-overlay").classList.remove("aberto");
}

function fecharPreviewCompletoOverlay(e) {
  if (e.target === document.getElementById("preview-completo-overlay")) {
    fecharPreviewCompleto();
  }
}

function obterDadosPreview() {
  const nome = document.getElementById("ed-nome")?.value.trim();
  if (!nome) return null;

  return {
    id: parseInt(document.getElementById("ed-id")?.value) || 0,
    nome,
    marca: document.getElementById("ed-marca")?.value.trim() || "Marca",
    categoria: document.getElementById("ed-categoria")?.value.trim() || "Categoria",
    preco: parseFloat(document.getElementById("ed-preco")?.value) || 0,
    desconto: parseFloat(document.getElementById("ed-desconto")?.value) || 0,
    minimoCotacao: parseFloat(document.getElementById("ed-minimo")?.value) || 0,
    disponibilidade: document.querySelector('input[name="ed-disp"]:checked')?.value || "disponivel",
    destaque: document.getElementById("ed-destaque")?.checked || false,
    ativo: document.getElementById("ed-ativo")?.checked !== false,
    imagens: [0,1,2,3].map(i => document.getElementById(`ed-img-${i}`)?.value.trim() || ""),
    video: document.getElementById("ed-video")?.value.trim() || "",
    descricao: document.getElementById("ed-descricao")?.value.trim() || "",
    reviews: produtoEmEdicao?.reviews || [],
  };
}

function mudarPreviewTab(tab) {
  previewTab = tab;
  document.querySelectorAll(".preview-tab-btn").forEach(b => {
    b.classList.toggle("ativo", b.dataset.pv === tab);
  });

  const dados = obterDadosPreview();
  const body = document.getElementById("preview-completo-body");
  if (!body) return;

  if (!dados) {
    body.innerHTML = `<p style="text-align:center;color:var(--txt-tertiary);padding:40px;">Preencha o formulário para ver pré-visualização.</p>`;
    return;
  }

  switch (tab) {
    case "catalogo":  body.innerHTML = renderizarPreviewCatalogo(dados);  break;
    case "busca":     body.innerHTML = renderizarPreviewBusca(dados);     break;
    case "carrinho":  body.innerHTML = renderizarPreviewCarrinho(dados);  break;
    case "produto":   body.innerHTML = renderizarPreviewProduto(dados);   break;
  }
}

function renderizarPreviewCatalogo(p) {
  const temDesc = p.desconto && p.desconto > 0;
  const final = temDesc ? p.preco * (1 - p.desconto / 100) : p.preco;
  const dispLabel = p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda";
  const dispClasse = p.disponibilidade === "disponivel" ? "preview-badge-stock" : "preview-badge-encomenda";
  const img = p.imagens[0];
  const media = p.reviews.length > 0 ? p.reviews.reduce((a, r) => a + r.estrelas, 0) / p.reviews.length : 0;

  let aviso = "";
  if (!p.ativo) {
    aviso = `<div class="preview-pausado-aviso">⚠️ Este produto está pausado e <strong>não aparece</strong> no catálogo público.</div>`;
  }

  return `
    ${aviso}
    <p class="preview-secao-titulo">Como aparece no catálogo principal</p>
    <div class="preview-cat-grid">
      <div class="preview-cat-card">
        <div class="preview-cat-card-img ${img ? '' : 'preview-cat-card-img-vazia'}"
             style="background-image:${img ? `url('${img.replace(/'/g, "\\'")}')` : 'none'}">
          ${img ? '' : 'Sem imagem'}
          <div class="preview-cat-badges">
            ${p.destaque ? '<span class="preview-badge-destaque">⭐ Destaque</span>' : ''}
            ${temDesc ? `<span class="preview-badge-desc">−${p.desconto}%</span>` : ''}
            <span class="${dispClasse}">${dispLabel}</span>
          </div>
        </div>
        <div class="preview-cat-corpo">
          <div class="preview-cat-marca">${escapeHTML(p.marca)}</div>
          <div class="preview-cat-nome">${escapeHTML(p.nome)}</div>
          ${media > 0 ? `<div class="preview-cat-stars">${'★'.repeat(Math.round(media))}${'☆'.repeat(5 - Math.round(media))} <span>(${p.reviews.length})</span></div>` : ''}
          ${temDesc ? `<span class="preview-cat-preco-old">${formatarMZN(p.preco)}</span>` : ''}
          <span class="preview-cat-preco">${formatarMZN(final)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderizarPreviewBusca(p) {
  const final = (p.desconto && p.desconto > 0) ? p.preco * (1 - p.desconto / 100) : p.preco;
  const dispLabel = p.disponibilidade === "disponivel" ? "Em stock" : "Sob encomenda";
  const dispClasse = p.disponibilidade === "disponivel" ? "preview-badge-stock" : "preview-badge-encomenda";
  const img = p.imagens[0];

  let aviso = "";
  if (!p.ativo) {
    aviso = `<div class="preview-pausado-aviso">⚠️ Produto pausado <strong>não aparece</strong> nos resultados de busca.</div>`;
  }

  return `
    ${aviso}
    <p class="preview-secao-titulo">Como aparece quando alguém procura</p>
    <div class="preview-busca-wrap">
      <div class="preview-busca-input">
        🔍 Resultado para <strong>"${escapeHTML(p.nome.split(" ")[0])}"</strong>
      </div>
      <div class="preview-busca-item">
        <img src="${escapeHTML(img || '')}" alt="" />
        <div class="preview-busca-info">
          <div class="preview-busca-marca">${escapeHTML(p.marca)}</div>
          <div class="preview-busca-nome">${escapeHTML(p.nome)}</div>
          <div>
            <span class="preview-busca-preco">${formatarMZN(final)}</span>
            <span class="${dispClasse}" style="font-size:.55rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding:2px 6px;border-radius:3px">${dispLabel}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderizarPreviewCarrinho(p) {
  const final = (p.desconto && p.desconto > 0) ? p.preco * (1 - p.desconto / 100) : p.preco;
  const img = p.imagens[0];
  const qtd = 2;
  const total = final * qtd;

  return `
    <p class="preview-secao-titulo">Como aparece quando o cliente adiciona ao carrinho (com quantidade 2)</p>
    <div class="preview-carrinho-wrap">
      <div class="preview-carrinho-header">A sua cotação · 1 item</div>
      <div class="preview-carrinho-item">
        <img src="${escapeHTML(img || '')}" alt="" />
        <div class="preview-carrinho-info">
          <div class="preview-carrinho-nome">${escapeHTML(p.nome)}</div>
          <div class="preview-carrinho-preco">${formatarMZN(final)} cada · <strong>${formatarMZN(total)}</strong></div>
          <div class="preview-carrinho-controles">
            <button style="width:24px;height:24px;border-radius:50%;background:var(--bg-mist);border:none">−</button>
            <span class="preview-carrinho-qtd">${qtd}</span>
            <button style="width:24px;height:24px;border-radius:50%;background:var(--bg-mist);border:none">+</button>
          </div>
        </div>
      </div>
      <div class="preview-carrinho-total">
        <span>Total parcial</span>
        <strong>${formatarMZN(total)}</strong>
      </div>
    </div>
  `;
}

function renderizarPreviewProduto(p) {
  const temDesc = p.desconto && p.desconto > 0;
  const final = temDesc ? p.preco * (1 - p.desconto / 100) : p.preco;
  const poupanca = p.preco - final;
  const dispLabel = p.disponibilidade === "disponivel" ? "🟢 Em stock — envio em 1–14 dias" : "🟡 Sob encomenda — importação em 10–30 dias";
  const img = p.imagens[0];
  const media = p.reviews.length > 0 ? p.reviews.reduce((a, r) => a + r.estrelas, 0) / p.reviews.length : 0;

  let aviso = "";
  if (!p.ativo) {
    aviso = `<div class="preview-pausado-aviso">⚠️ Produto pausado: ao aceder, o cliente vê "Produto temporariamente indisponível".</div>`;
  }

  return `
    ${aviso}
    <p class="preview-secao-titulo">Página individual do produto (resumo simplificado)</p>
    <div class="preview-prod-wrap">
      <div class="preview-prod-grid">
        <div class="preview-prod-img-main" style="background-image:${img ? `url('${img.replace(/'/g, "\\'")}')` : 'none'};"></div>
        <div class="preview-prod-info">
          <div class="preview-prod-marca">${escapeHTML(p.marca)} · ${escapeHTML(p.categoria)}</div>
          <h3 class="preview-prod-nome">${escapeHTML(p.nome)}</h3>
          ${media > 0 ? `<div class="preview-prod-stars">${'★'.repeat(Math.round(media))}${'☆'.repeat(5 - Math.round(media))} <span>${media.toFixed(1)} · ${p.reviews.length} ${p.reviews.length === 1 ? 'review' : 'reviews'}</span></div>` : ''}

          <div class="preview-prod-preco-bloco">
            ${temDesc ? `<span class="preview-prod-preco-old">${formatarMZN(p.preco)}</span>` : ''}
            <div class="preview-prod-preco">${formatarMZN(final)}</div>
            ${temDesc ? `<div class="preview-prod-poupanca">Poupa ${formatarMZN(poupanca)} (${p.desconto}%)</div>` : ''}
          </div>

          <div class="preview-prod-disp">${dispLabel}</div>

          ${p.descricao ? `<p class="preview-prod-desc">${escapeHTML(p.descricao)}</p>` : '<p class="preview-prod-desc" style="color:var(--txt-tertiary);font-style:italic">Sem descrição</p>'}
        </div>
      </div>
    </div>
  `;
}


// ════════════════════════════════════════════════════════════
//  HISTÓRICO — Undo/Redo + lista de mudanças
// ════════════════════════════════════════════════════════════

const HIST_TIPOS = {
  criar:    { icone: "✨", label: "Criar" },
  editar:   { icone: "✏️", label: "Editar" },
  eliminar: { icone: "🗑️", label: "Eliminar" },
  duplicar: { icone: "📋", label: "Duplicar" },
  pausar:   { icone: "👁️", label: "Pausar" },
  bulk:     { icone: "📦", label: "Massa" },
  frete:    { icone: "🚚", label: "Frete" },
  reordenar:{ icone: "🔀", label: "Reordenar" },
  reviews:  { icone: "⭐", label: "Reviews" },
  import:   { icone: "📥", label: "Importação" },
};

/**
 * Regista uma nova entrada no histórico capturando o estado actual
 * (após a acção). Trunca histórico futuro se estávamos no meio (depois de undo).
 */
function registarHistorico(tipo, descricao) {
  // Se estamos no meio do histórico (após undos), descartar entradas futuras
  if (historicoIdx < historico.length - 1) {
    historico = historico.slice(0, historicoIdx + 1);
  }

  // Criar nova entrada com snapshot completo
  const entrada = {
    id: Date.now() + Math.random().toString(36).slice(2, 8),
    tipo,
    descricao,
    timestamp: Date.now(),
    snapshot: {
      produtos: JSON.parse(JSON.stringify(produtosEditados)),
      frete: JSON.parse(JSON.stringify(freteEditado)),
      cambio: JSON.parse(JSON.stringify(taxaCambioEditada)),
    },
  };

  historico.push(entrada);

  // Limitar tamanho
  if (historico.length > HIST_MAX_ENTRIES) {
    historico.shift();
  }

  historicoIdx = historico.length - 1;

  // Persistir
  try {
    localStorage.setItem(ADMIN_KEY_HIST, JSON.stringify(historico));
    localStorage.setItem(ADMIN_KEY_HIST_IDX, String(historicoIdx));
  } catch (e) {
    console.warn("Erro ao guardar histórico:", e);
  }

  atualizarBotoesUndoRedo();
  atualizarBadgeHistorico();
}

function historicoUndo() {
  if (historicoIdx < 0) return;
  // Para fazer undo, voltamos ao estado ANTERIOR à acção actual
  // Se estamos na entrada 0 (primeira), voltamos ao estado original (PRODUTOS/FRETE/CAMBIO)
  if (historicoIdx === 0) {
    produtosEditados = clonarProdutos(PRODUTOS);
    freteEditado = JSON.parse(JSON.stringify(FRETE));
    taxaCambioEditada = clonarTaxaCambioPadrao();
    historicoIdx = -1;
  } else {
    historicoIdx--;
    const entrada = historico[historicoIdx];
    produtosEditados = JSON.parse(JSON.stringify(entrada.snapshot.produtos));
    freteEditado = JSON.parse(JSON.stringify(entrada.snapshot.frete));
    if (entrada.snapshot.cambio) {
      taxaCambioEditada = JSON.parse(JSON.stringify(entrada.snapshot.cambio));
    }
  }
  guardarHistoricoIdx();
  refreshUI();
  mostrarToast("Acção desfeita");
}

function historicoRedo() {
  if (historicoIdx >= historico.length - 1) return;
  historicoIdx++;
  const entrada = historico[historicoIdx];
  produtosEditados = JSON.parse(JSON.stringify(entrada.snapshot.produtos));
  freteEditado = JSON.parse(JSON.stringify(entrada.snapshot.frete));
  if (entrada.snapshot.cambio) {
    taxaCambioEditada = JSON.parse(JSON.stringify(entrada.snapshot.cambio));
  }
  guardarHistoricoIdx();
  refreshUI();
  mostrarToast("Acção refeita");
}

function reverterParaHistorico(idx) {
  if (idx < 0 || idx >= historico.length) return;
  abrirConfirm({
    titulo: "Reverter ao estado deste momento?",
    mensagem: "Todas as acções posteriores serão desfeitas, mas continuam no histórico para recuperar com 'Refazer'.",
    btnTexto: "Sim, reverter",
    perigo: false,
    callback: () => {
      historicoIdx = idx;
      const entrada = historico[idx];
      produtosEditados = JSON.parse(JSON.stringify(entrada.snapshot.produtos));
      freteEditado = JSON.parse(JSON.stringify(entrada.snapshot.frete));
      guardarHistoricoIdx();
      refreshUI();
      mostrarToast("Estado revertido");
    },
  });
}

function guardarHistoricoIdx() {
  try {
    localStorage.setItem(ADMIN_KEY_HIST_IDX, String(historicoIdx));
    localStorage.setItem(ADMIN_KEY_PRODS, JSON.stringify(produtosEditados));
    localStorage.setItem(ADMIN_KEY_FRETE, JSON.stringify(freteEditado));
    localStorage.setItem(ADMIN_KEY_LASTSAVE, Date.now().toString());
    temMudancas = true;
    atualizarStatusMudancas();
  } catch (e) {}
}

function refreshUI() {
  atualizarBotoesUndoRedo();
  renderizarTabela();
  renderizarDashboard();
  renderizarFrete();
  renderizarCambio();
  renderizarHistorico();
}

function atualizarBotoesUndoRedo() {
  const podeUndo = historicoIdx >= 0;
  const podeRedo = historicoIdx < historico.length - 1;

  ["btn-undo", "hist-btn-undo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !podeUndo;
  });
  ["btn-redo", "hist-btn-redo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !podeRedo;
  });
}

function atualizarBadgeHistorico() {
  const badge = document.getElementById("nav-badge-historico");
  if (badge) badge.textContent = historico.length;
}

function renderizarHistorico() {
  const lista = document.getElementById("historico-lista");
  const sub = document.getElementById("historico-subtitulo");
  if (!lista) return;

  const filtroTipo = document.getElementById("filtro-hist-tipo")?.value || "";
  const filtrado = filtroTipo
    ? historico.filter(h => h.tipo === filtroTipo)
    : historico;

  if (sub) {
    sub.textContent = `${historico.length} acç${historico.length === 1 ? 'ão registada' : 'ões registadas'} (mostrando ${filtrado.length})`;
  }

  if (filtrado.length === 0) {
    lista.innerHTML = `
      <div class="hist-vazio">
        <span>📜</span>
        ${historico.length === 0 ? "Nenhuma acção registada ainda. Acções como criar, editar e eliminar produtos aparecerão aqui." : "Nenhuma acção corresponde ao filtro."}
      </div>`;
    return;
  }

  // Reverso (mais recente primeiro)
  const ordenado = [...filtrado].reverse();

  lista.innerHTML = ordenado.map(entrada => {
    const idxReal = historico.indexOf(entrada);
    const tipoInfo = HIST_TIPOS[entrada.tipo] || { icone: "📌", label: "Acção" };
    const isActual = idxReal === historicoIdx;
    const isFutura = idxReal > historicoIdx;
    const data = new Date(entrada.timestamp);
    const dataFmt = formatarHistData(data);

    return `
      <div class="hist-item ${isActual ? 'hist-actual' : ''} ${isFutura ? 'hist-futura' : ''}">
        <div class="hist-icone hist-${entrada.tipo}">${tipoInfo.icone}</div>
        <div class="hist-info">
          <div class="hist-titulo">${entrada.descricao}</div>
          <div class="hist-data">
            <span class="hist-tipo-badge">${tipoInfo.label}</span>
            <span>${dataFmt}</span>
          </div>
        </div>
        ${isActual
          ? '<span class="hist-actual-badge">Estado actual</span>'
          : `<div class="hist-acoes-item"><button class="hist-btn-reverter" onclick="reverterParaHistorico(${idxReal})">${isFutura ? 'Refazer até aqui' : 'Reverter'}</button></div>`
        }
      </div>
    `;
  }).join("");
}

function formatarHistData(data) {
  const agora = new Date();
  const diff = (agora - data) / 1000;

  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function limparHistorico() {
  if (historico.length === 0) return;
  abrirConfirm({
    titulo: "Limpar histórico?",
    mensagem: "Todas as entradas do histórico serão eliminadas. Não afecta os produtos nem o frete actuais.",
    btnTexto: "Sim, limpar",
    perigo: true,
    callback: () => {
      historico = [];
      historicoIdx = -1;
      localStorage.removeItem(ADMIN_KEY_HIST);
      localStorage.removeItem(ADMIN_KEY_HIST_IDX);
      atualizarBotoesUndoRedo();
      atualizarBadgeHistorico();
      renderizarHistorico();
      mostrarToast("Histórico limpo");
    },
  });
}


// ════════════════════════════════════════════════════════════
//  DRAG AND DROP — Reordenação de produtos
// ════════════════════════════════════════════════════════════

function configurarDragDrop() {
  const linhas = document.querySelectorAll("#tbody-produtos tr[data-id]");

  linhas.forEach(linha => {
    linha.addEventListener("dragstart", e => {
      dragId = parseInt(linha.dataset.id);
      dragRow = linha;
      linha.classList.add("linha-arrastando");
      e.dataTransfer.effectAllowed = "move";
      // Hack: definir um pequeno data para Firefox aceitar drag
      e.dataTransfer.setData("text/plain", String(dragId));
    });

    linha.addEventListener("dragend", () => {
      linha.classList.remove("linha-arrastando");
      document.querySelectorAll(".linha-drop-target, .linha-drop-target-bottom").forEach(r => {
        r.classList.remove("linha-drop-target", "linha-drop-target-bottom");
      });
      dragId = null;
      dragRow = null;
    });

    linha.addEventListener("dragover", e => {
      e.preventDefault();
      if (!dragId || dragId === parseInt(linha.dataset.id)) return;

      // Limpar markers anteriores
      document.querySelectorAll(".linha-drop-target, .linha-drop-target-bottom").forEach(r => {
        r.classList.remove("linha-drop-target", "linha-drop-target-bottom");
      });

      // Determinar se é em cima ou em baixo da linha
      const rect = linha.getBoundingClientRect();
      const meio = rect.top + rect.height / 2;
      if (e.clientY < meio) {
        linha.classList.add("linha-drop-target");
      } else {
        linha.classList.add("linha-drop-target-bottom");
      }

      e.dataTransfer.dropEffect = "move";
    });

    linha.addEventListener("drop", e => {
      e.preventDefault();
      if (!dragId) return;
      const targetId = parseInt(linha.dataset.id);
      if (dragId === targetId) return;

      const rect = linha.getBoundingClientRect();
      const meio = rect.top + rect.height / 2;
      const inserirAntes = e.clientY < meio;

      reordenarProduto(dragId, targetId, inserirAntes);
    });
  });
}

function reordenarProduto(idArrastado, idTarget, antes) {
  const idxFrom = produtosEditados.findIndex(p => p.id === idArrastado);
  let idxTo = produtosEditados.findIndex(p => p.id === idTarget);

  if (idxFrom === -1 || idxTo === -1) return;

  const produto = produtosEditados[idxFrom];
  const nomeArrastado = produto.nome;
  const nomeTarget = produtosEditados[idxTo].nome;

  // Remover do original
  produtosEditados.splice(idxFrom, 1);

  // Recalcular idxTo (pode ter mudado se idxFrom < idxTo)
  idxTo = produtosEditados.findIndex(p => p.id === idTarget);

  // Inserir antes ou depois
  produtosEditados.splice(antes ? idxTo : idxTo + 1, 0, produto);

  registarHistorico("reordenar", `Moveu <strong>${escapeHTML(nomeArrastado)}</strong> ${antes ? "antes" : "depois"} de <strong>${escapeHTML(nomeTarget)}</strong>`);
  salvarLocal();
  renderizarTabela();
  mostrarToast("Ordem actualizada");
}


// ════════════════════════════════════════════════════════════
//  IMPORT / EXPORT — JSON e CSV
// ════════════════════════════════════════════════════════════

function abrirMenuBackup() {
  document.getElementById("backup-overlay").classList.add("aberto");
}

function fecharBackup() {
  document.getElementById("backup-overlay").classList.remove("aberto");
}

// ── EXPORT JSON ─────────────────────────────────────────────
function exportarJSON() {
  const backup = {
    versao: "1.0",
    timestamp: Date.now(),
    data: new Date().toISOString(),
    produtos: produtosEditados,
    frete: freteEditado,
    historico: historico,
    historicoIdx: historicoIdx,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dataStr = new Date().toISOString().split("T")[0];
  a.download = `lumart-backup-${dataStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarToast("Backup JSON exportado");
}

// ── IMPORT JSON ─────────────────────────────────────────────
function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const dados = JSON.parse(e.target.result);

      // Validar estrutura mínima
      if (!Array.isArray(dados.produtos)) {
        mostrarToast("Ficheiro inválido: 'produtos' não é um array");
        return;
      }

      abrirConfirm({
        titulo: "Importar backup?",
        mensagem: `Vai importar:<br/>• <strong>${dados.produtos.length}</strong> produtos<br/>• Tarifas de frete (se presentes)<br/>• Histórico (${(dados.historico || []).length} entradas)<br/><br/>⚠️ <strong>Os dados actuais serão substituídos.</strong>`,
        btnTexto: "Sim, importar",
        perigo: true,
        callback: () => {
          produtosEditados = dados.produtos;
          if (dados.frete) freteEditado = dados.frete;
          if (Array.isArray(dados.historico)) {
            historico = dados.historico;
            historicoIdx = dados.historicoIdx ?? historico.length - 1;
          }
          registarHistorico("import", `Importou backup JSON (${dados.produtos.length} produtos)`);
          salvarLocal();
          inicializarPainel();
          atualizarBadgeHistorico();
          renderizarFrete();
          mostrarToast("Backup importado com sucesso");
          fecharBackup();
        },
      });
    } catch (err) {
      mostrarToast("Erro ao ler ficheiro JSON");
      console.error(err);
    }
    // Reset input para permitir re-import do mesmo ficheiro
    event.target.value = "";
  };
  reader.readAsText(file);
}

// ── EXPORT CSV ──────────────────────────────────────────────
function exportarCSV() {
  const headers = [
    "id", "nome", "marca", "categoria", "preco", "desconto",
    "disponibilidade", "destaque", "ativo", "descricao", "video",
    "imagem1", "imagem2", "imagem3", "imagem4"
  ];

  const linhas = [headers.join(",")];

  produtosEditados.forEach(p => {
    const linha = [
      p.id,
      csvEscape(p.nome),
      csvEscape(p.marca),
      csvEscape(p.categoria),
      p.preco || 0,
      p.desconto || 0,
      p.disponibilidade || "disponivel",
      p.destaque ? "true" : "false",
      p.ativo !== false ? "true" : "false",
      csvEscape(p.descricao || ""),
      csvEscape(p.video || ""),
      csvEscape(p.imagens?.[0] || ""),
      csvEscape(p.imagens?.[1] || ""),
      csvEscape(p.imagens?.[2] || ""),
      csvEscape(p.imagens?.[3] || ""),
    ];
    linhas.push(linha.join(","));
  });

  // BOM para Excel reconhecer UTF-8
  const csv = "\uFEFF" + linhas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dataStr = new Date().toISOString().split("T")[0];
  a.download = `lumart-produtos-${dataStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarToast("CSV exportado");
}

function csvEscape(valor) {
  if (valor === null || valor === undefined) return "";
  const str = String(valor);
  // Se contém vírgula, aspas ou newline, envolver em aspas
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── IMPORT CSV ──────────────────────────────────────────────
function importarCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const texto = e.target.result;
      const linhas = parseCSV(texto);

      if (linhas.length < 2) {
        mostrarToast("CSV vazio ou sem dados");
        return;
      }

      const headers = linhas[0].map(h => h.trim().toLowerCase());
      const dadosCSV = linhas.slice(1);

      // Verificar campos obrigatórios
      const obrigatorios = ["id", "nome", "marca", "categoria", "preco"];
      const faltam = obrigatorios.filter(c => !headers.includes(c));
      if (faltam.length > 0) {
        mostrarToast(`CSV inválido — faltam colunas: ${faltam.join(", ")}`);
        return;
      }

      // Construir produtos importados (preservando reviews dos existentes)
      const produtosNovos = dadosCSV
        .filter(linha => linha.some(c => c.trim()))
        .map(linha => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = linha[i] || "");

          const id = parseInt(obj.id) || gerarNovoId();
          const existente = produtosEditados.find(p => p.id === id);

          return {
            id,
            nome: obj.nome.trim(),
            marca: obj.marca.trim(),
            categoria: obj.categoria.trim(),
            preco: parseFloat(obj.preco) || 0,
            desconto: parseFloat(obj.desconto) || 0,
            disponibilidade: obj.disponibilidade?.trim() || "disponivel",
            destaque: obj.destaque?.toLowerCase() === "true",
            ativo: obj.ativo?.toLowerCase() !== "false",
            descricao: (obj.descricao || "").trim(),
            video: (obj.video || "").trim(),
            imagens: [
              (obj.imagem1 || "").trim(),
              (obj.imagem2 || "").trim(),
              (obj.imagem3 || "").trim(),
              (obj.imagem4 || "").trim(),
            ],
            reviews: existente?.reviews || [],
          };
        });

      abrirConfirm({
        titulo: "Importar CSV?",
        mensagem: `Vai importar <strong>${produtosNovos.length}</strong> produtos.<br/><br/>⚠️ <strong>Os produtos actuais serão substituídos</strong> (as reviews dos produtos com mesmo ID serão preservadas).<br/><br/>O frete e o histórico não são afectados.`,
        btnTexto: "Sim, importar",
        perigo: true,
        callback: () => {
          produtosEditados = produtosNovos;
          registarHistorico("import", `Importou CSV (${produtosNovos.length} produtos)`);
          salvarLocal();
          inicializarPainel();
          mostrarToast(`${produtosNovos.length} produtos importados`);
          fecharBackup();
        },
      });
    } catch (err) {
      mostrarToast("Erro ao ler CSV");
      console.error(err);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

/**
 * Parser CSV que respeita aspas, vírgulas escapadas, etc.
 */
function parseCSV(texto) {
  // Remover BOM se presente
  if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);

  const linhas = [];
  let linhaActual = [];
  let campoActual = "";
  let dentroAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    const seguinte = texto[i + 1];

    if (dentroAspas) {
      if (c === '"' && seguinte === '"') {
        campoActual += '"';
        i++;
      } else if (c === '"') {
        dentroAspas = false;
      } else {
        campoActual += c;
      }
    } else {
      if (c === '"') {
        dentroAspas = true;
      } else if (c === ',') {
        linhaActual.push(campoActual);
        campoActual = "";
      } else if (c === '\n' || c === '\r') {
        if (campoActual !== "" || linhaActual.length > 0) {
          linhaActual.push(campoActual);
          linhas.push(linhaActual);
        }
        linhaActual = [];
        campoActual = "";
        // Skip \r\n
        if (c === '\r' && seguinte === '\n') i++;
      } else {
        campoActual += c;
      }
    }
  }

  // Última linha (se não termina com newline)
  if (campoActual !== "" || linhaActual.length > 0) {
    linhaActual.push(campoActual);
    linhas.push(linhaActual);
  }

  return linhas;
}


// ════════════════════════════════════════════════════════════
//  AJUDA / ATALHOS
// ════════════════════════════════════════════════════════════

function mostrarAjuda() {
  document.getElementById("ajuda-overlay").classList.add("aberto");
}

function fecharAjuda() {
  document.getElementById("ajuda-overlay").classList.remove("aberto");
}


// ════════════════════════════════════════════════════════════
//  ATALHOS DE TECLADO
// ════════════════════════════════════════════════════════════

let teclaG = false; // estado para combos como "G + D"
let timeoutG = null;

document.addEventListener("keydown", e => {
  // Ignorar atalhos quando user está a escrever em campos de texto
  const noInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  const ctrlOuCmd = e.ctrlKey || e.metaKey;

  // ── Atalhos com Ctrl/Cmd ────────────────────────────────
  if (ctrlOuCmd && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (estaAutenticado()) exportarProdutos();
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "n") {
    e.preventDefault();
    if (estaAutenticado()) novoProduto();
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "b") {
    e.preventDefault();
    if (estaAutenticado()) abrirMenuBackup();
    return;
  }
  if (ctrlOuCmd && e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (estaAutenticado()) historicoRedo();
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "y") {
    e.preventDefault();
    if (estaAutenticado()) historicoRedo();
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (estaAutenticado()) historicoUndo();
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "f") {
    e.preventDefault();
    if (estaAutenticado()) {
      mudarTab("produtos");
      setTimeout(() => document.getElementById("filtro-busca")?.focus(), 50);
    }
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "e") {
    e.preventDefault();
    if (estaAutenticado() && produtosSelecionados.size > 0) {
      const primeiro = [...produtosSelecionados][0];
      editarProduto(primeiro);
    }
    return;
  }
  if (ctrlOuCmd && e.key.toLowerCase() === "d") {
    e.preventDefault();
    if (estaAutenticado() && produtosSelecionados.size > 0) {
      const primeiro = [...produtosSelecionados][0];
      duplicarProduto(primeiro);
    }
    return;
  }

  // ── Atalho ? para ajuda ────────────────────────────────
  if (!noInput && e.key === "?") {
    e.preventDefault();
    if (estaAutenticado()) mostrarAjuda();
    return;
  }

  // ── ESC fecha modais ───────────────────────────────────
  if (e.key === "Escape") {
    if (document.getElementById("ajuda-overlay")?.classList.contains("aberto")) {
      fecharAjuda();
    } else if (document.getElementById("backup-overlay")?.classList.contains("aberto")) {
      fecharBackup();
    } else if (document.getElementById("preview-completo-overlay")?.classList.contains("aberto")) {
      fecharPreviewCompleto();
    } else if (document.getElementById("review-overlay")?.classList.contains("aberto")) {
      fecharReviewEditor();
    } else if (document.getElementById("editor-overlay")?.classList.contains("aberto")) {
      fecharEditor();
    } else if (document.getElementById("confirm-overlay")?.classList.contains("aberto")) {
      confirmCancelar();
    } else if (document.getElementById("prompt-overlay")?.classList.contains("aberto")) {
      promptCancelar();
    }
    return;
  }

  // ── Atalhos G + tecla (estilo Vim/Gmail) ───────────────
  if (!noInput && !ctrlOuCmd && estaAutenticado()) {
    if (e.key.toLowerCase() === "g" && !teclaG) {
      teclaG = true;
      clearTimeout(timeoutG);
      timeoutG = setTimeout(() => { teclaG = false; }, 1500);
      return;
    }
    if (teclaG) {
      teclaG = false;
      clearTimeout(timeoutG);
      const k = e.key.toLowerCase();
      if (k === "d") { mudarTab("dashboard"); return; }
      if (k === "p") { mudarTab("produtos"); return; }
      if (k === "f") { mudarTab("frete"); return; }
      if (k === "h") { mudarTab("historico"); return; }
    }
  }
});


// ════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════

// Inicializar imediatamente se DOM já carregou, ou esperar
function adminInit() {
  // Carregar tema imediatamente (antes de qualquer outra coisa)
  carregarTema();

  if (!temPasswordDefinida()) {
    document.getElementById("auth-setup").style.display = "block";
    document.getElementById("auth-login").style.display = "none";
    setTimeout(() => document.getElementById("setup-pass")?.focus(), 200);
  } else if (!estaAutenticado()) {
    document.getElementById("auth-setup").style.display = "none";
    document.getElementById("auth-login").style.display = "block";
    setTimeout(() => document.getElementById("login-pass")?.focus(), 200);
  } else {
    entrarPainel();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", adminInit);
} else {
  // DOM já carregou — executar já
  adminInit();
}


// ════════════════════════════════════════════════════════════
//  FASE 6A — Painel de Gestão de Idiomas
// ════════════════════════════════════════════════════════════
//  Permite editar traduções PT/EN do site sem mexer no código.
//  Guarda overrides em localStorage ("lumart_admin_i18n_overrides").
//  Exporta i18n.js actualizado para fazer push manual no GitHub.
// ════════════════════════════════════════════════════════════

const ADMIN_KEY_I18N = "lumart_admin_i18n_overrides";
let idiomasOverrides = {}; // { pt: {chave: novoValor}, en: {chave: novoValor} }

function carregarOverridesIdiomas() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY_I18N);
    if (raw) idiomasOverrides = JSON.parse(raw);
    if (!idiomasOverrides.pt) idiomasOverrides.pt = {};
    if (!idiomasOverrides.en) idiomasOverrides.en = {};
  } catch (e) {
    idiomasOverrides = { pt: {}, en: {} };
  }
}

function salvarOverridesIdiomas() {
  try {
    localStorage.setItem(ADMIN_KEY_I18N, JSON.stringify(idiomasOverrides));
  } catch (e) {
    console.warn("Erro a guardar overrides i18n:", e);
  }
}

// Devolve o valor de uma chave: override → ou TRADUCOES original
function getValorChave(lang, chave) {
  if (idiomasOverrides[lang]?.[chave] !== undefined) {
    return idiomasOverrides[lang][chave];
  }
  return (typeof TRADUCOES !== "undefined" && TRADUCOES[lang]?.[chave]) || "";
}

// Devolve a secção de uma chave: "header.cart" → "header"
function getSecaoChave(chave) {
  const idx = chave.indexOf(".");
  return idx === -1 ? "(outras)" : chave.substring(0, idx);
}

// Devolve lista de todas as chaves únicas (PT ∪ EN)
function todasAsChaves() {
  if (typeof TRADUCOES === "undefined") return [];
  const set = new Set();
  Object.keys(TRADUCOES.pt || {}).forEach(k => set.add(k));
  Object.keys(TRADUCOES.en || {}).forEach(k => set.add(k));
  return Array.from(set).sort();
}

function contarModificadas() {
  return Object.keys(idiomasOverrides.pt || {}).length + Object.keys(idiomasOverrides.en || {}).length;
}

function renderizarIdiomas() {
  if (typeof TRADUCOES === "undefined") {
    document.getElementById("idiomas-tabela").innerHTML = `
      <div class="idi-vazio">
        <strong>i18n.js não carregado.</strong><br>
        Verifica que <code>i18n.js</code> está incluído antes de <code>admin.js</code>.
      </div>`;
    return;
  }

  const busca = (document.getElementById("idi-busca")?.value || "").toLowerCase().trim();
  const filtroSecao = document.getElementById("idi-filtro-secao")?.value || "";
  const filtroEstado = document.getElementById("idi-filtro-estado")?.value || "";

  // Recolher e filtrar
  const chaves = todasAsChaves();
  const chavesFiltradas = chaves.filter(chave => {
    const ptVal = getValorChave("pt", chave);
    const enVal = getValorChave("en", chave);
    const ptMod = idiomasOverrides.pt?.[chave] !== undefined;
    const enMod = idiomasOverrides.en?.[chave] !== undefined;

    // Filtro de busca (na chave ou nos valores)
    if (busca) {
      const match =
        chave.toLowerCase().includes(busca) ||
        ptVal.toLowerCase().includes(busca) ||
        enVal.toLowerCase().includes(busca);
      if (!match) return false;
    }

    // Filtro de secção
    if (filtroSecao && getSecaoChave(chave) !== filtroSecao) return false;

    // Filtro de estado
    if (filtroEstado === "modificadas" && !ptMod && !enMod) return false;
    if (filtroEstado === "vazias" && ptVal && enVal) return false;

    return true;
  });

  // Agrupar por secção
  const porSecao = new Map();
  chavesFiltradas.forEach(chave => {
    const sec = getSecaoChave(chave);
    if (!porSecao.has(sec)) porSecao.set(sec, []);
    porSecao.get(sec).push(chave);
  });

  const tabela = document.getElementById("idiomas-tabela");
  if (!tabela) return;

  if (chavesFiltradas.length === 0) {
    tabela.innerHTML = `<div class="idi-vazio">Nenhuma chave corresponde aos filtros aplicados.</div>`;
    return;
  }

  // Construir HTML
  let html = "";
  porSecao.forEach((listaChaves, secao) => {
    html += `<div class="idi-secao-header">${secao} · ${listaChaves.length}</div>`;
    listaChaves.forEach(chave => {
      const ptVal = getValorChave("pt", chave);
      const enVal = getValorChave("en", chave);
      const ptMod = idiomasOverrides.pt?.[chave] !== undefined;
      const enMod = idiomasOverrides.en?.[chave] !== undefined;
      const linhaMod = ptMod || enMod;
      const linhaVazia = !ptVal || !enVal;

      html += `
        <div class="idi-linha ${linhaMod ? 'modificada' : ''} ${linhaVazia ? 'vazia' : ''}">
          <div class="idi-chave" title="${chave}">${chave}</div>
          <textarea
            class="idi-input ${!ptVal ? 'em_falta' : ''}"
            data-chave="${chave}"
            data-lang="pt"
            placeholder="(sem tradução PT)"
            rows="1"
            oninput="idiomasEditar(this)"
          >${escapeHtmlIdi(ptVal)}</textarea>
          <textarea
            class="idi-input ${!enVal ? 'em_falta' : ''}"
            data-chave="${chave}"
            data-lang="en"
            placeholder="(sem tradução EN)"
            rows="1"
            oninput="idiomasEditar(this)"
          >${escapeHtmlIdi(enVal)}</textarea>
        </div>
      `;
    });
  });

  tabela.innerHTML = html;

  // Auto-resize dos textareas
  tabela.querySelectorAll("textarea.idi-input").forEach(autoResizeTextarea);
}

function escapeHtmlIdi(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function autoResizeTextarea(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.max(32, Math.min(200, ta.scrollHeight)) + "px";
}

function idiomasEditar(input) {
  const chave = input.dataset.chave;
  const lang = input.dataset.lang;
  const novoValor = input.value;
  const valorOriginal = (TRADUCOES[lang] && TRADUCOES[lang][chave]) || "";

  if (novoValor === valorOriginal) {
    // Voltou ao valor original → remover override
    if (idiomasOverrides[lang]?.[chave] !== undefined) {
      delete idiomasOverrides[lang][chave];
    }
  } else {
    // Diferente do original → guardar override
    if (!idiomasOverrides[lang]) idiomasOverrides[lang] = {};
    idiomasOverrides[lang][chave] = novoValor;
  }

  salvarOverridesIdiomas();
  autoResizeTextarea(input);
  idiomasAtualizarUI();
}

function idiomasAtualizarUI() {
  // Stats
  const totalChaves = todasAsChaves().length;
  const totalModif = contarModificadas();
  document.getElementById("idi-total-chaves").textContent = totalChaves;
  document.getElementById("idi-modificadas").textContent = totalModif;

  // Aviso de mudanças
  document.getElementById("idiomas-aviso").style.display = totalModif > 0 ? "flex" : "none";
  document.getElementById("btn-idiomas-descartar").disabled = totalModif === 0;

  // Marcar linhas modificadas/originais sem re-render completo
  document.querySelectorAll(".idi-linha").forEach(linha => {
    const inputs = linha.querySelectorAll(".idi-input");
    const ptInput = Array.from(inputs).find(i => i.dataset.lang === "pt");
    const enInput = Array.from(inputs).find(i => i.dataset.lang === "en");
    if (!ptInput || !enInput) return;
    const chave = ptInput.dataset.chave;
    const ptMod = idiomasOverrides.pt?.[chave] !== undefined;
    const enMod = idiomasOverrides.en?.[chave] !== undefined;
    linha.classList.toggle("modificada", ptMod || enMod);
  });
}

function idiomasPopularSecoes() {
  const select = document.getElementById("idi-filtro-secao");
  if (!select || typeof TRADUCOES === "undefined") return;
  const secoes = new Set();
  todasAsChaves().forEach(k => secoes.add(getSecaoChave(k)));
  const ordenadas = Array.from(secoes).sort();
  select.innerHTML = `<option value="">Todas as secções (${secoes.size})</option>` +
    ordenadas.map(s => `<option value="${s}">${s}</option>`).join("");
  document.getElementById("idi-secoes").textContent = secoes.size;
}

function idiomasDescartarOverrides() {
  if (contarModificadas() === 0) return;
  if (!confirm("Descartar todas as alterações não exportadas?\n\nIsto não pode ser desfeito.")) return;
  idiomasOverrides = { pt: {}, en: {} };
  salvarOverridesIdiomas();
  renderizarIdiomas();
  idiomasAtualizarUI();
  mostrarToastAdmin("Alterações descartadas");
}

function idiomasExportar() {
  if (typeof TRADUCOES === "undefined") {
    alert("i18n.js não carregado.");
    return;
  }

  // Combinar TRADUCOES + overrides
  const novasTraducoes = { pt: {}, en: {} };
  ["pt", "en"].forEach(lang => {
    Object.keys(TRADUCOES[lang] || {}).forEach(chave => {
      novasTraducoes[lang][chave] = TRADUCOES[lang][chave];
    });
    Object.keys(idiomasOverrides[lang] || {}).forEach(chave => {
      novasTraducoes[lang][chave] = idiomasOverrides[lang][chave];
    });
  });

  // Construir o ficheiro i18n.js completo
  const conteudo = gerarConteudoI18nJs(novasTraducoes);

  // Download
  const blob = new Blob([conteudo], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "i18n.js";
  a.click();
  URL.revokeObjectURL(url);

  mostrarToastAdmin("i18n.js exportado — substitua o ficheiro no GitHub");
}

function gerarConteudoI18nJs(traducoes) {
  // Lê o ficheiro i18n.js actual e substitui apenas o objecto TRADUCOES
  // Como não temos acesso ao ficheiro raw, reconstruímos o objecto a partir das chaves
  // mantendo a ordem original (chaves do TRADUCOES original primeiro, depois novas)

  // Agrupar chaves por secção para output mais legível
  const agrupar = (langDict) => {
    const porSecao = new Map();
    Object.keys(langDict).forEach(chave => {
      const sec = getSecaoChave(chave);
      if (!porSecao.has(sec)) porSecao.set(sec, []);
      porSecao.get(sec).push([chave, langDict[chave]]);
    });
    return porSecao;
  };

  const fmt = (langDict) => {
    const agrupado = agrupar(langDict);
    const linhas = [];
    agrupado.forEach((pares, secao) => {
      linhas.push(`    // ── ${secao} ──────────────────────────────`);
      pares.forEach(([k, v]) => {
        const valorEscapado = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
        linhas.push(`    "${k}": "${valorEscapado}",`);
      });
      linhas.push("");
    });
    return linhas.join("\n");
  };

  return `// ════════════════════════════════════════════════════════════
//  LUMART COMERCIAL — Sistema Multi-idioma (Fase 3)
//  Exportado pelo painel admin em ${new Date().toLocaleString("pt-PT")}
// ════════════════════════════════════════════════════════════

const I18N_STORAGE_KEY = "lumart_lang";
const I18N_SUGERIDO_KEY = "lumart_lang_sugerido";
const I18N_DEFAULT = "pt";
const I18N_SUPPORTED = ["pt", "en"];

let LANG_ACTUAL = I18N_DEFAULT;

const TRADUCOES = {
  pt: {
${fmt(traducoes.pt)}
  },

  en: {
${fmt(traducoes.en)}
  },
};

// ── API ─────────────────────────────────────────────────────
function t(chave, params = {}) {
  const dict = TRADUCOES[LANG_ACTUAL] || TRADUCOES[I18N_DEFAULT];
  let texto = dict[chave];
  if (texto === undefined && LANG_ACTUAL !== I18N_DEFAULT) {
    texto = TRADUCOES[I18N_DEFAULT][chave];
  }
  if (texto === undefined) return chave;
  return texto.replace(/\\{(\\w+)\\}/g, (_, key) =>
    params[key] !== undefined ? params[key] : "{" + key + "}"
  );
}

function getLang() { return LANG_ACTUAL; }

function setLang(lang) {
  if (!I18N_SUPPORTED.includes(lang)) lang = I18N_DEFAULT;
  if (LANG_ACTUAL === lang) return;
  LANG_ACTUAL = lang;
  try { localStorage.setItem(I18N_STORAGE_KEY, lang); } catch (e) {}
  document.documentElement.lang = lang === "pt" ? "pt-MZ" : "en";
  aplicarI18nNoDOM();
  document.dispatchEvent(new CustomEvent("lumart:lang-changed", { detail: { lang } }));
}

function alternarLang() { setLang(LANG_ACTUAL === "pt" ? "en" : "pt"); }

function detectarIdiomaInicial() {
  try {
    const g = localStorage.getItem(I18N_STORAGE_KEY);
    if (g && I18N_SUPPORTED.includes(g)) return g;
  } catch (e) {}
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q && I18N_SUPPORTED.includes(q)) {
      try { localStorage.setItem(I18N_STORAGE_KEY, q); } catch (e) {}
      return q;
    }
  } catch (e) {}
  return I18N_DEFAULT;
}

function deveSugerirEn() {
  try {
    if (localStorage.getItem(I18N_STORAGE_KEY)) return false;
    if (localStorage.getItem(I18N_SUGERIDO_KEY)) return false;
    return (navigator.language || "pt").toLowerCase().startsWith("en");
  } catch (e) { return false; }
}

function aplicarI18nNoDOM(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    const params = parseDataI18nParams(el);
    el.innerHTML = t(chave, params);
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  scope.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  document.querySelectorAll(".btn-lang").forEach(b => {
    b.classList.toggle("ativo", b.getAttribute("data-lang") === LANG_ACTUAL);
  });
}

function parseDataI18nParams(el) {
  const raw = el.getAttribute("data-i18n-params");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

LANG_ACTUAL = detectarIdiomaInicial();
document.documentElement.lang = LANG_ACTUAL === "pt" ? "pt-MZ" : "en";

document.addEventListener("DOMContentLoaded", () => {
  aplicarI18nNoDOM();
  if (deveSugerirEn()) setTimeout(() => sugerirIdiomaEn(), 1500);
});

function sugerirIdiomaEn() {
  try { localStorage.setItem(I18N_SUGERIDO_KEY, "1"); } catch (e) {}
  const banner = document.createElement("div");
  banner.id = "i18n-suggest-banner";
  banner.className = "i18n-suggest";
  banner.setAttribute("role", "dialog");
  banner.innerHTML = \`
    <span class="lmi lmi-sm" aria-hidden="true">translate</span>
    <span class="i18n-suggest-texto">\${t("i18n.sugerir_en")}</span>
    <div class="i18n-suggest-acoes">
      <button class="i18n-suggest-btn i18n-suggest-primario" onclick="setLang('en');this.closest('.i18n-suggest').remove()">\${t("i18n.btn_sim_en")}</button>
      <button class="i18n-suggest-btn" onclick="this.closest('.i18n-suggest').remove()">\${t("i18n.btn_nao_pt")}</button>
    </div>
  \`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("visivel"));
  setTimeout(() => {
    banner.classList.remove("visivel");
    setTimeout(() => banner.remove(), 350);
  }, 12000);
}
`;
}

// Toast simples para o admin (se mostrarToast não existir no contexto)
function mostrarToastAdmin(msg) {
  let t = document.getElementById("toast-admin");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast-admin";
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink,#0d0c10);color:#fff;padding:12px 24px;border-radius:8px;font-size:.9rem;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.3)";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.style.opacity = "0", 3000);
}

// Hook: inicializar quando a tab idiomas é aberta
function inicializarTabIdiomas() {
  carregarOverridesIdiomas();
  idiomasPopularSecoes();
  renderizarIdiomas();
  idiomasAtualizarUI();
}
