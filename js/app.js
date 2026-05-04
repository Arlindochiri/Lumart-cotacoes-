// ============================================================
//  LUMART — App principal
//  Lógica de renderização, navegação e inicialização do catálogo
// ============================================================

let categoriaActiva = "Todos";

// ── Filtros de categoria ─────────────────────────────────────
function renderizarFiltros() {
  const container = document.getElementById("lista-filtros");
  if (!container) return;

  container.innerHTML = CATEGORIAS.map((cat) => `
    <button
      class="btn-filtro ${cat === categoriaActiva ? "ativo" : ""}"
      onclick="filtrarPor('${cat}')"
    >${cat}</button>
  `).join("");
}

function filtrarPor(categoria) {
  categoriaActiva = categoria;
  renderizarFiltros();
  renderizarProdutos();
}

// ── Grid de produtos ─────────────────────────────────────────
function renderizarProdutos() {
  const grid = document.getElementById("grid-produtos");
  if (!grid) return;

  const lista = categoriaActiva === "Todos"
    ? PRODUTOS
    : PRODUTOS.filter((p) => p.categoria === categoriaActiva);

  if (lista.length === 0) {
    grid.innerHTML = `<p class="text-muted py-4">Nenhum produto encontrado.</p>`;
    return;
  }

  grid.innerHTML = lista.map((prod, i) => {
    const desconto = prod.desconto || 0;
    const precoFinal = desconto > 0 ? prod.preco * (1 - desconto / 100) : prod.preco;
    const noCarrinho = carrinho.find((it) => it.id === prod.id);

    return `
      <article class="card-produto" style="animation-delay:${i * 50}ms">
        <a class="card-link" href="pages/produto.html?id=${prod.id}" aria-label="Ver detalhes de ${prod.nome}">
          <div class="card-imagem-wrap">
            <img
              class="card-imagem"
              src="${prod.imagem}"
              alt="${prod.nome}"
              loading="lazy"
              onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 160%22><rect fill=%22%23e2e8f0%22 width=%22200%22 height=%22160%22/><text fill=%22%2394a3b8%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2232%22>🎨</text></svg>'"
            />
            ${desconto > 0 ? `<span class="card-badge-desconto">-${desconto}%</span>` : ''}
          </div>
        </a>
        <div class="card-corpo">
          ${prod.destaque ? '<span class="card-badge-destaque">⭐ Destaque</span>' : ''}
          <p class="card-marca">${prod.marca}</p>
          <h3 class="card-nome">
            <a href="pages/produto.html?id=${prod.id}">${prod.nome}</a>
          </h3>
          <div class="card-precos">
            ${desconto > 0 ? `<span class="card-preco-antigo">${formatarMZN(prod.preco)}</span>` : ''}
            <span class="card-preco">${formatarMZN(precoFinal)}</span>
          </div>
          <button
            class="btn-adicionar ${noCarrinho ? 'no-carrinho' : ''}"
            data-id="${prod.id}"
            onclick="adicionarAoCarrinho(${prod.id})"
          >${noCarrinho ? '✓ Adicionado' : '+ Adicionar'}</button>
        </div>
      </article>
    `;
  }).join("");
}

// ── Resumo do pedido na cotação ──────────────────────────────
function renderizarResumoFinal() {
  const container = document.getElementById("resumo-produtos");
  const totalEl = document.getElementById("resumo-total");
  if (!container) return;

  if (carrinho.length === 0) {
    container.innerHTML = `<p class="text-muted small py-2">Nenhum produto adicionado.</p>`;
    if (totalEl) totalEl.textContent = formatarMZN(0);
    return;
  }

  container.innerHTML = carrinho.map((item) => {
    const precoUnit = precoComDesconto(item);
    return `
      <div class="resumo-produto">
        <img
          class="resumo-prod-icone"
          src="${item.imagem}"
          alt="${item.nome}"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 36 36%22><rect fill=%22%23e2e8f0%22 width=%2236%22 height=%2236%22/></svg>'"
        />
        <div class="resumo-prod-info">
          <div class="resumo-prod-nome">${item.nome}</div>
          <div class="resumo-prod-qtd">Qtd: ${item.qtd}</div>
        </div>
        <div class="resumo-prod-preco">${formatarMZN(precoUnit * item.qtd)}</div>
      </div>
    `;
  }).join("");

  atualizarTotaisCotacao();
}

// Atualiza os totais (subtotal + frete + total) no formulário de cotação
function atualizarTotaisCotacao() {
  const subtotal = calcularSubtotal();
  const frete = calcularFrete();
  const total = subtotal + frete;

  const subEl = document.getElementById("resumo-subtotal");
  const freteEl = document.getElementById("resumo-frete");
  const totalEl = document.getElementById("resumo-total");

  if (subEl) subEl.textContent = formatarMZN(subtotal);
  if (freteEl) freteEl.textContent = frete > 0 ? formatarMZN(frete) : "A calcular";
  if (totalEl) totalEl.textContent = formatarMZN(total);
}

// ── Navegação entre seções ───────────────────────────────────
function irParaCatalogo() {
  document.getElementById("secao-catalogo").classList.add("ativo");
  document.getElementById("secao-cotacao").classList.remove("ativo");
  document.getElementById("secao-catalogo").style.display = "block";
  document.getElementById("secao-cotacao").style.display = "none";
  document.getElementById("acoes-cotacao").classList.remove("ativo");
  document.getElementById("link-catalogo")?.classList.add("ativo");
  document.getElementById("link-cotacao")?.classList.remove("ativo");
  const rodape = document.getElementById("rodape");
  if (rodape) rodape.style.display = "block";
  fecharCarrinho();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function irParaFormulario() {
  if (carrinho.length === 0) {
    mostrarToast("Adicione pelo menos um produto antes de continuar.");
    return;
  }
  fecharCarrinho();
  document.getElementById("secao-catalogo").style.display = "none";
  document.getElementById("secao-cotacao").style.display = "block";
  document.getElementById("acoes-cotacao").classList.add("ativo");
  document.getElementById("link-catalogo")?.classList.remove("ativo");
  document.getElementById("link-cotacao")?.classList.add("ativo");
  const rodape = document.getElementById("rodape");
  if (rodape) rodape.style.display = "none";
  renderizarResumoFinal();
  atualizarPreviewPDF();
  if (typeof inicializarFormularioEnvio === "function") inicializarFormularioEnvio();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharCarrinhoOverlay(e) {
  if (e.target === document.getElementById("modal-carrinho")) fecharCarrinho();
}

function confirmarLimpar() {
  if (confirm("Deseja remover todos os produtos da cotação?")) {
    limparCarrinho();
    renderizarCarrinhoModal();
    renderizarProdutos();
  }
}

function atualizarPreviewPDF() {
  const numEl = document.getElementById("preview-num");
  const dataEl = document.getElementById("preview-data");
  if (numEl) numEl.innerHTML = `COTAÇÃO ${gerarNumeroCotacao()}<br/>`;
  if (dataEl) dataEl.textContent = `Data: ${dataFormatada()}`;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharCarrinho();
});

function init() {
  renderizarFiltros();
  renderizarProdutos();
  atualizarUI();
}

document.addEventListener("DOMContentLoaded", init);
