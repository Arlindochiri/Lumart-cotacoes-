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
  if (tab === "frete") renderizarFrete();
  if (tab === "dashboard") renderizarDashboard();
  if (tab === "produtos") renderizarTabela();
  if (tab === "historico") renderizarHistorico();

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
  const valores = produtosEditados.map(p => p.preco || 0);
  const valorMedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
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

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">💰</span> Valor médio</div>
      <div class="stat-card-num" style="font-size:1.6rem">${formatarMZN(valorMedio)}</div>
      <div class="stat-card-extra">Por produto</div>
    </div>

    <div class="stat-card">
      <div class="stat-card-eyebrow"><span class="stat-card-icon">⭐</span> Reviews</div>
      <div class="stat-card-num">${totalReviews}</div>
      <div class="stat-card-extra">
        Média: <strong>${mediaGlobal.toFixed(1)}</strong> ★
      </div>
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
};

let produtosSelecionados = new Set();

function aplicarFiltros() {
  filtrosAtuais.busca = document.getElementById("filtro-busca")?.value.toLowerCase() || "";
  filtrosAtuais.categoria = document.getElementById("filtro-categoria")?.value || "";
  filtrosAtuais.disp = document.getElementById("filtro-disp")?.value || "";
  filtrosAtuais.vis = document.getElementById("filtro-vis")?.value || "";
  filtrosAtuais.desc = document.getElementById("filtro-desc")?.value || "";
  renderizarTabela();
}

function limparFiltros() {
  document.getElementById("filtro-busca").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-disp").value = "";
  document.getElementById("filtro-vis").value = "";
  document.getElementById("filtro-desc").value = "";
  filtrosAtuais = { busca: "", categoria: "", disp: "", vis: "", desc: "" };
  renderizarTabela();
}

function obterProdutosFiltrados() {
  return produtosEditados.filter(p => {
    if (filtrosAtuais.busca) {
      const t = filtrosAtuais.busca;
      const match = p.nome.toLowerCase().includes(t) ||
                    p.marca.toLowerCase().includes(t) ||
                    p.categoria.toLowerCase().includes(t);
      if (!match) return false;
    }
     if (filtrosAtuais.categoria && p.categoria !== filtrosAtuais.categoria) return false;
    if (filtrosAtuais.disp && p.disponibilidade !== filtrosAtuais.disp) return false;
    if (filtrosAtuais.vis === "visiveis" && p.ativo === false) return false;
    if (filtrosAtuais.vis === "pausados" && p.ativo !== false) return false;
    if (filtrosAtuais.desc === "sim" && (!p.desconto || p.desconto === 0)) return false;
    if (filtrosAtuais.desc === "nao" && p.desconto && p.desconto > 0) return false;
    return true;
  });
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

  container.innerHTML = [0, 1, 2, 3].map(i => `
    <div class="galeria-input-card">
      <div class="galeria-input-thumb ${i === 0 ? 'principal' : ''}"
           id="thumb-${i}"
           data-num="${i + 1}"
           style="background-image:url('${escapeHTML(imagens[i] || '')}')"></div>
      <div class="galeria-input-fields">
        <label>${i === 0 ? 'Principal' : 'Imagem ' + (i + 1)}</label>
        <input type="text"
               id="ed-img-${i}"
               value="${escapeHTML(imagens[i] || '')}"
               placeholder="https://..."
               oninput="atualizarThumbGaleria(${i});atualizarPreviewCard()" />
      </div>
    </div>
  `).join("");
}

function atualizarThumbGaleria(i) {
  const input = document.getElementById(`ed-img-${i}`);
  const thumb = document.getElementById(`thumb-${i}`);
  if (!input || !thumb) return;
  const url = input.value.trim();
  thumb.style.backgroundImage = url ? `url('${url.replace(/'/g, "\\'")}')` : "";
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
      "Produtos em stock: 60% no pedido + 40% na entrega",
      "Produtos sob encomenda: 75% no pedido + 25% na entrega",
    ];
  }
  if (temSobEnc) {
    return ["75% no momento do pedido + 25% na entrega"];
  }
  return ["60% no momento do pedido + 40% na entrega"];
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

        
