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
  mostrarToast(`"${produto.nome.substring(0,28)}…" adicionado`);
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
  if (txt) txt.textContent = `${n} ${n === 1 ? "item" : "itens"} na cotação`;
}

function atualizarBotoes() {
  document.querySelectorAll("[data-id]").forEach(btn => {
    const id = parseInt(btn.dataset.id);
    const adicionado = !!carrinho.find(i => i.id === id);
    btn.classList.toggle("no-carrinho", adicionado);
    if (btn.classList.contains("btn-quick-add")) btn.textContent = adicionado ? "✓ Adicionado" : "Adicionar à Cotação";
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

  if (carrinho.length === 0) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <span class="lmi lmi-xl" aria-hidden="true">shopping_bag</span>
        <h3 class="vazio-titulo">A sua cotação está vazia</h3>
        <p class="vazio-texto">Adicione produtos do catálogo para começar a sua cotação personalizada.</p>
        <a href="index.html" class="btn-vazio-acao" onclick="fecharCarrinho()">
          <span class="lmi lmi-sm" aria-hidden="true">grid_view</span>
          Ver catálogo
        </a>
      </div>`;
    if (totalEl) totalEl.textContent = formatarMZN(0);
    return;
  }

  lista.innerHTML = carrinho.map(item => `
    <div class="item-carrinho">
      <img src="${item.imagens[0]}" alt="${item.nome}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%23e8e6f0%22 width=%2260%22 height=%2260%22/></svg>'" />
      <div class="item-info">
        <span class="item-nome">${item.nome}</span>
        <span class="item-preco-unit">${formatarMZN(precoComDesconto(item))} / un.</span>
      </div>
      <div class="item-controles">
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id},-1)" aria-label="Diminuir"><span class="lmi lmi-sm" aria-hidden="true">remove</span></button>
        <span class="item-qtd">${item.qtd}</span>
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id},1)" aria-label="Aumentar"><span class="lmi lmi-sm" aria-hidden="true">add</span></button>
      </div>
      <button class="btn-remover" onclick="removerDoCarrinho(${item.id})" title="Remover" aria-label="Remover"><span class="lmi lmi-sm" aria-hidden="true">close</span></button>
    </div>
  `).join("");

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
  aviso.innerHTML = `
    <div class="aviso-minimo-icon" aria-hidden="true">
      <span class="lmi lmi-sm">lock</span>
    </div>
    <div class="aviso-minimo-texto">
      <strong>Cotação mínima não atingida</strong>
      <p>O produto <strong>${val.produtoLimitante.nome}</strong> requer cotação mínima de <strong>${formatarMZN(val.maiorMinimo)}</strong>. Faltam <strong>${formatarMZN(val.faltam)}</strong>.</p>
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
