// ============================================================
//  LUMART — Lógica do Carrinho
// ============================================================

const CHAVE_STORAGE = "lumart_v2_carrinho";

let carrinho = carregarCarrinho();

function carregarCarrinho() {
  try { const d = localStorage.getItem(CHAVE_STORAGE); return d ? JSON.parse(d) : []; }
  catch(e) { return []; }
}
function salvarCarrinho() {
  try { localStorage.setItem(CHAVE_STORAGE, JSON.stringify(carrinho)); }
  catch(e) {}
}

function adicionarAoCarrinho(produtoId) {
  const produto = PRODUTOS.find(p => p.id === produtoId);
  if (!produto) return;
  const existente = carrinho.find(i => i.id === produtoId);
  if (existente) { existente.qtd += 1; }
  else { carrinho.push({ ...produto, qtd: 1 }); }
  salvarCarrinho();
  atualizarUI();
  // Animação de "pulse" no botão do carrinho
  const btn = document.getElementById("btn-cart-main");
  if (btn) { btn.classList.add("pulse"); setTimeout(() => btn.classList.remove("pulse"), 400); }
  // Animação de confirmação nos botões "+" deste produto (cards)
  document.querySelectorAll(`[data-id="${produtoId}"]`).forEach(b => {
    b.classList.add("confirmado");
    setTimeout(() => b.classList.remove("confirmado"), 600);
  });
  mostrarToast((typeof t === "function" ? t("carrinho.adicionado_toast", { nome: produto.nome.substring(0,28) }) : `"${produto.nome.substring(0,28)}…" adicionado`));
}

function removerDoCarrinho(produtoId) {
  carrinho = carrinho.filter(i => i.id !== produtoId);
  salvarCarrinho(); atualizarUI(); renderizarDrawer();
}

function alterarQuantidade(produtoId, delta) {
  const item = carrinho.find(i => i.id === produtoId);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) { removerDoCarrinho(produtoId); return; }
  salvarCarrinho(); atualizarUI(); renderizarDrawer();
}

function limparCarrinho() {
  carrinho = []; salvarCarrinho(); atualizarUI();
}

function calcularTotal() { return carrinho.reduce((a, i) => a + precoComDesconto(i) * i.qtd, 0); }
function contarItens()   { return carrinho.reduce((a, i) => a + i.qtd, 0); }

// ── UI ────────────────────────────────────────────────────────
function atualizarUI() {
  atualizarBadge();
  atualizarBarraInferior();
  atualizarBotoes();
  if (document.getElementById("secao-cotacao")?.classList.contains("ativo")) renderizarResumoCotacao();
}

function atualizarBadge() {
  const badge = document.getElementById("badge-carrinho");
  const n = contarItens();
  if (!badge) return;
  badge.textContent = n;
  badge.style.display = n > 0 ? "flex" : "none";
  // Atualizar count no drawer header
  const dc = document.getElementById("drawer-count");
  if (dc) dc.textContent = n;
}

function atualizarBarraInferior() {
  const barra = document.getElementById("barra-inferior");
  const txt   = document.getElementById("barra-itens");
  if (!barra) return;
  const n = contarItens();
  const visivel = n > 0;
  barra.classList.toggle("visivel", visivel);
  // Fallback para browsers sem :has() — adiciona classe no body
  document.body.classList.toggle("com-barra-inferior", visivel);
  if (txt) {
    const unidade = (typeof t === "function") ? t(n === 1 ? "carrinho.unidade" : "carrinho.unidades") : (n === 1 ? "item" : "itens");
    txt.textContent = (typeof t === "function") ? t("carrinho.itens_na_cotacao", { n, unidade }) : `${n} ${unidade} na cotação`;
  }
}

function atualizarBotoes() {
  const tFn = (typeof t === "function") ? t : null;
  const txtAdicionar  = tFn ? tFn("card.adicionar")  : "Adicionar à Cotação";
  const txtAdicionado = tFn ? tFn("card.adicionado") : "✓ Adicionado";
  document.querySelectorAll("[data-id]").forEach(btn => {
    const id = parseInt(btn.dataset.id);
    const adicionado = !!carrinho.find(i => i.id === id);
    btn.classList.toggle("no-carrinho", adicionado);
    if (btn.classList.contains("btn-quick-add")) btn.textContent = adicionado ? txtAdicionado : txtAdicionar;
    if (btn.classList.contains("btn-add-mobile")) btn.textContent = adicionado ? "✓" : "+";
  });
}

// ── Drawer ────────────────────────────────────────────────────
function abrirCarrinho() {
  document.getElementById("modal-carrinho")?.classList.add("aberto");
  renderizarDrawer();
  document.body.style.overflow = "hidden";
}
function fecharCarrinho() {
  document.getElementById("modal-carrinho")?.classList.remove("aberto");
  document.body.style.overflow = "";
}

function renderizarDrawer() {
  const lista   = document.getElementById("lista-carrinho");
  const totalEl = document.getElementById("total-carrinho");
  if (!lista) return;
  const tFn = (typeof t === "function") ? t : null;

  if (carrinho.length === 0) {
    const tituloVazio = tFn ? tFn("carrinho.vazio_titulo") : "A sua cotação está vazia";
    const textoVazio  = tFn ? tFn("carrinho.vazio_texto")  : "Adicione produtos do catálogo para começar a sua cotação personalizada.";
    const verCat      = tFn ? tFn("carrinho.ver_catalogo") : "Ver catálogo";
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <span class="lmi lmi-xl" aria-hidden="true">shopping_bag</span>
        <h3 class="vazio-titulo">${tituloVazio}</h3>
        <p class="vazio-texto">${textoVazio}</p>
        <a href="index.html" class="btn-vazio-acao" onclick="fecharCarrinho()">
          <span class="lmi lmi-sm" aria-hidden="true">grid_view</span>
          ${verCat}
        </a>
      </div>`;
    if (totalEl) totalEl.textContent = formatarMZN(0);
    return;
  }

  const ariaDim = tFn ? tFn("comum.remover") : "Diminuir";
  const ariaAum = tFn ? tFn("comum.adicionar") : "Aumentar";
  const ariaRem = tFn ? tFn("comum.remover") : "Remover";

  lista.innerHTML = carrinho.map(item => {
    const precoUn = tFn ? tFn("carrinho.preco_un", { v: formatarMZN(precoComDesconto(item)) }) : `${formatarMZN(precoComDesconto(item))} / un.`;
    return `
    <div class="item-carrinho">
      <img src="${item.imagens[0]}" alt="${item.nome}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%23e8e6f0%22 width=%2260%22 height=%2260%22/></svg>'" />
      <div class="item-info">
        <span class="item-nome">${item.nome}</span>
        <span class="item-preco-unit">${precoUn}</span>
      </div>
      <div class="item-controles">
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id},-1)" aria-label="${ariaDim}"><span class="lmi lmi-sm" aria-hidden="true">remove</span></button>
        <span class="item-qtd">${item.qtd}</span>
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id},1)" aria-label="${ariaAum}"><span class="lmi lmi-sm" aria-hidden="true">add</span></button>
      </div>
      <button class="btn-remover" onclick="removerDoCarrinho(${item.id})" title="${ariaRem}" aria-label="${ariaRem}"><span class="lmi lmi-sm" aria-hidden="true">close</span></button>
    </div>
  `;
  }).join("");

  if (totalEl) totalEl.textContent = formatarMZN(calcularTotal());

  // Renderizar aviso de mínimo de cotação (se aplicável)
  renderizarAvisoMinimo();
}

// ── Aviso de Mínimo de Cotação ──────────────────────────────
function renderizarAvisoMinimo() {
  const aviso = document.getElementById("aviso-minimo-cart");
  const btnCheckout = document.querySelector(".drawer-footer .btn-checkout");
  if (!aviso) return;

  const val = validarMinimoCotacao(carrinho);

  if (val.maiorMinimo === 0 || val.valido) {
    aviso.classList.remove("activo");
    aviso.innerHTML = "";
    if (btnCheckout) btnCheckout.classList.remove("bloqueado");
    return;
  }

  // Bloqueado — mostrar aviso
  aviso.classList.add("activo");
  const tFn = (typeof t === "function") ? t : null;
  const titulo = tFn ? tFn("carrinho.aviso_minimo_titulo") : "Cotação mínima não atingida";
  const texto = tFn
    ? tFn("carrinho.aviso_minimo_texto", {
        produto: val.produtoLimitante.nome,
        minimo: formatarMZN(val.maiorMinimo),
        faltam: formatarMZN(val.faltam),
      })
    : `O produto <strong>${val.produtoLimitante.nome}</strong> requer cotação mínima de <strong>${formatarMZN(val.maiorMinimo)}</strong>. Faltam <strong>${formatarMZN(val.faltam)}</strong>.`;
  aviso.innerHTML = `
    <div class="aviso-minimo-icon" aria-hidden="true">
      <span class="lmi lmi-sm">lock</span>
    </div>
    <div class="aviso-minimo-texto">
      <strong>${titulo}</strong>
      <p>${texto}</p>
    </div>
  `;
  if (btnCheckout) btnCheckout.classList.add("bloqueado");
}

// ── Toast ─────────────────────────────────────────────────────
function mostrarToast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("visivel");
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.classList.remove("visivel"), 2800);
}

// ── Listener i18n (Fase 3C) ──────────────────────────────────
document.addEventListener("lumart:lang-changed", () => {
  // Re-renderizar barra inferior + botões do catálogo
  atualizarBarraInferior();
  atualizarBotoes();
  // Re-renderizar drawer SE estiver aberto
  const drawer = document.getElementById("modal-carrinho");
  if (drawer?.classList.contains("aberto")) renderizarDrawer();
});
