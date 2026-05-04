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
function adicionarAoCarrinho(produtoId) {
  const produto = PRODUTOS.find((p) => p.id === produtoId);
  if (!produto) return;

  const existente = carrinho.find((item) => item.id === produtoId);
  if (existente) {
    existente.qtd += 1;
  } else {
    carrinho.push({ ...produto, qtd: 1 });
  }

  salvarCarrinho();
  atualizarUI();
  mostrarToast(`${produto.nome} adicionado à cotação`);
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

// Total da cotação
function calcularTotal() {
  return carrinho.reduce((acc, item) => acc + item.preco * item.qtd, 0);
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
  if (document.getElementById("secao-cotacao")?.classList.contains("ativo")) {
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
      const nome = escaparHTML(item.nome);
      const imagem = escaparHTML(item.imagem);
      return `
    <div class="item-carrinho" id="item-${item.id}">
      <img src="${imagem}" alt="${nome}" loading="lazy" onerror="imgErro(this)" />
      <div class="item-info">
        <span class="item-nome">${nome}</span>
        <span class="item-preco">${formatarMZN(item.preco)}</span>
      </div>
      <div class="item-controles">
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, -1)" aria-label="Diminuir quantidade">−</button>
        <span class="item-qtd">${item.qtd}</span>
        <button class="btn-qtd" onclick="alterarQuantidade(${item.id}, 1)" aria-label="Aumentar quantidade">+</button>
      </div>
      <button class="btn-remover" onclick="removerDoCarrinho(${item.id})" aria-label="Remover ${nome}">✕</button>
    </div>`;
    })
    .join("");

  if (totalEl) totalEl.textContent = formatarMZN(calcularTotal());
}

// ─── Toast de feedback ────────────────────────────────────────
function mostrarToast(mensagem) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add("visivel");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visivel"), 2500);
}
