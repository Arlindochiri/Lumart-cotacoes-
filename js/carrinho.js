// ============================================================
//  LUMART — Lógica do Carrinho
//  Gerencia adição, remoção, quantidade e persistência.
// ============================================================

const CHAVE_STORAGE = "lumart_carrinho";

// ─── Estado do carrinho ───────────────────────────────────────
let carrinho = carregarCarrinho();

// Carregar do localStorage
function carregarCarrinho() {
  try {
    const dados = localStorage.getItem(CHAVE_STORAGE);
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    console.warn("Erro ao carregar carrinho:", e);
    return [];
  }
}

// Salvar no localStorage
function salvarCarrinho() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(carrinho));
  } catch (e) {
    console.warn("Erro ao salvar carrinho:", e);
  }
}

// Adicionar produto (ou incrementar quantidade)
function adicionarAoCarrinho(produtoId, qtd = 1) {
  const produto = PRODUTOS.find((p) => p.id === Number(produtoId));
  if (!produto) return;

  const existente = carrinho.find((item) => item.id === produto.id);
  if (existente) {
    existente.qtd += qtd;
  } else {
    carrinho.push({ ...produto, qtd });
  }

  salvarCarrinho();
  atualizarUI();
  mostrarToast(`${produto.nome} adicionado ao carrinho`);
}

// Remover produto completamente
function removerDoCarrinho(produtoId) {
  carrinho = carrinho.filter((item) => item.id !== produtoId);
  salvarCarrinho();
  atualizarUI();
  renderizarCarrinhoModal();
}

// Alterar quantidade
function alterarQuantidade(produtoId, delta) {
  const item = carrinho.find((i) => i.id === produtoId);
  if (!item) return;

  item.qtd += delta;
  if (item.qtd <= 0) {
    removerDoCarrinho(produtoId);
    return;
  }

  salvarCarrinho();
  atualizarUI();
  renderizarCarrinhoModal();
}

// Limpar carrinho inteiro
function limparCarrinho() {
  carrinho = [];
  salvarCarrinho();
  atualizarUI();
}

// Subtotal (sem frete) — considerando descontos
function calcularSubtotal() {
  return carrinho.reduce((acc, item) => acc + precoComDesconto(item) * item.qtd, 0);
}

// Frete (calculado por shipping.js, com fallback 0)
function calcularFrete() {
  return typeof obterValorFrete === "function" ? obterValorFrete() : 0;
}

// Total da cotação (subtotal + frete)
function calcularTotal() {
  return calcularSubtotal() + calcularFrete();
}

// Total de itens
function contarItens() {
  return carrinho.reduce((acc, item) => acc + item.qtd, 0);
}

// ─── Atualizar UI ─────────────────────────────────────────────
function atualizarUI() {
  atualizarBadgeCarrinho();
  atualizarBarraInferior();
  atualizarBotoesAdicionados();
  const cotacao = document.getElementById("secao-cotacao");
  if (cotacao && cotacao.classList.contains("ativo") && typeof renderizarResumoFinal === "function") {
    renderizarResumoFinal();
  }
}

function atualizarBadgeCarrinho() {
  const badge = document.getElementById("badge-carrinho");
  const total = contarItens();
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }
}

function atualizarBarraInferior() {
  const barra = document.getElementById("barra-inferior");
  const textoItens = document.getElementById("barra-itens");
  const total = contarItens();

  if (!barra) return;

  if (total > 0) {
    barra.classList.add("visivel");
    if (textoItens) {
      textoItens.textContent = `${total} ${total === 1 ? "item adicionado" : "itens adicionados"}`;
    }
  } else {
    barra.classList.remove("visivel");
  }
}

function atualizarBotoesAdicionados() {
  document.querySelectorAll(".btn-adicionar").forEach((btn) => {
    const id = parseInt(btn.dataset.id);
    const noCarrinho = carrinho.find((i) => i.id === id);
    if (noCarrinho) {
      btn.classList.add("no-carrinho");
      btn.textContent = "✓ Adicionado";
    } else {
      btn.classList.remove("no-carrinho");
      btn.textContent = "+ Adicionar";
    }
  });
}

// ─── Modal do Carrinho ────────────────────────────────────────
function abrirCarrinho() {
  const modal = document.getElementById("modal-carrinho");
  if (modal) {
    modal.classList.add("aberto");
    renderizarCarrinhoModal();
  }
}

function fecharCarrinho() {
  const modal = document.getElementById("modal-carrinho");
  if (modal) modal.classList.remove("aberto");
}

function renderizarCarrinhoModal() {
  const lista = document.getElementById("lista-carrinho");
  const totalEl = document.getElementById("total-carrinho");
  if (!lista) return;

  if (carrinho.length === 0) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <span class="carrinho-vazio-icone">🛒</span>
        <p>Nenhum produto adicionado ainda.</p>
      </div>`;
    if (totalEl) totalEl.textContent = formatarMZN(0);
    return;
  }

  lista.innerHTML = carrinho
    .map((item) => {
      const precoUnit = precoComDesconto(item);
      const temDesconto = (item.desconto || 0) > 0;
      return `
    <div class="item-carrinho" id="item-${item.id}">
      <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23e2e8f0%22 width=%2280%22 height=%2280%22/></svg>'" />
      <div class="item-info">
        <span class="item-nome">${item.nome}</span>
        <span class="item-preco">
          ${temDesconto ? `<s class="text-muted small me-1">${formatarMZN(item.preco)}</s>` : ""}
          ${formatarMZN(precoUnit)}
        </span>
      </div>
      <div class="item-controles">
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, -1)" aria-label="Diminuir quantidade">−</button>
        <span class="item-qtd">${item.qtd}</span>
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, 1)" aria-label="Aumentar quantidade">+</button>
      </div>
      <button class="btn-remover" onclick="removerDoCarrinho(${item.id})" title="Remover" aria-label="Remover">✕</button>
    </div>`;
    })
    .join("");

  if (totalEl) totalEl.textContent = formatarMZN(calcularSubtotal());
}

// ─── Toast de feedback ────────────────────────────────────────
function mostrarToast(mensagem) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("visivel");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visivel"), 2500);
}
