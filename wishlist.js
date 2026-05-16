// ════════════════════════════════════════════════════════════
//  LUMART COMERCIAL — Sistema de Wishlist (Fase 8C)
// ════════════════════════════════════════════════════════════
//  Gere a lista de produtos favoritos do utilizador.
//  Persistência em localStorage ("lumart_v2_wishlist").
//  Estrutura simples: array de IDs de produto.
//
//  API pública:
//    - alternarFavorito(id)  → adiciona ou remove
//    - eFavorito(id)         → boolean
//    - contarFavoritos()     → número
//    - listaFavoritos()      → array de produtos completos
//    - abrirWishlist()       → abre o drawer
//    - fecharWishlist()      → fecha o drawer
//    - limparWishlist()      → remove todos (com confirmação)
// ════════════════════════════════════════════════════════════

const WISHLIST_STORAGE_KEY = "lumart_v2_wishlist";

let wishlistIds = carregarWishlist();

function carregarWishlist() {
  try {
    const dados = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!dados) return [];
    const arr = JSON.parse(dados);
    return Array.isArray(arr) ? arr.filter(id => Number.isFinite(id)) : [];
  } catch (e) {
    console.warn("Erro ao carregar wishlist:", e);
    return [];
  }
}

function salvarWishlist() {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  } catch (e) {
    console.warn("Erro ao guardar wishlist:", e);
  }
}

// ── API pública ─────────────────────────────────────────────

function eFavorito(produtoId) {
  return wishlistIds.includes(Number(produtoId));
}

function contarFavoritos() {
  return wishlistIds.length;
}

function listaFavoritos() {
  // Resolver IDs para produtos completos, na ordem em que foram adicionados (LIFO)
  if (typeof PRODUTOS === "undefined") return [];
  return wishlistIds
    .slice()
    .reverse()
    .map(id => PRODUTOS.find(p => p.id === id))
    .filter(Boolean)
    .filter(p => p.ativo !== false);
}

function alternarFavorito(produtoId) {
  const id = Number(produtoId);
  if (!Number.isFinite(id)) return false;

  const idx = wishlistIds.indexOf(id);
  if (idx === -1) {
    // Adicionar
    wishlistIds.push(id);
    salvarWishlist();
    atualizarBadgeWishlist();
    atualizarTodosBotoesFav(id, true);
    const p = (typeof PRODUTOS !== "undefined") ? PRODUTOS.find(p => p.id === id) : null;
    if (p && typeof mostrarToast === "function") {
      mostrarToast(typeof t === "function"
        ? t("wishlist.adicionado_toast", { nome: p.nome.substring(0, 28) })
        : `"${p.nome.substring(0, 28)}…" adicionado aos favoritos`);
    }
    return true;
  } else {
    // Remover
    wishlistIds.splice(idx, 1);
    salvarWishlist();
    atualizarBadgeWishlist();
    atualizarTodosBotoesFav(id, false);
    if (typeof renderizarWishlistDrawer === "function") {
      // Se o drawer está aberto, re-renderizar para remover o item
      const drawer = document.getElementById("modal-wishlist");
      if (drawer?.classList.contains("aberto")) renderizarWishlistDrawer();
    }
    return false;
  }
}

function limparWishlist() {
  wishlistIds = [];
  salvarWishlist();
  atualizarBadgeWishlist();
  // Sincronizar todos os botões de coração da página
  document.querySelectorAll(".btn-fav, .btn-fav-produto").forEach(b => {
    b.classList.remove("activo");
    const icone = b.querySelector(".lmi");
    if (icone) icone.textContent = "favorite_border";
  });
  renderizarWishlistDrawer();
}

function confirmarLimparWishlist() {
  if (wishlistIds.length === 0) return;
  if (confirm("Tem a certeza que quer remover todos os favoritos?")) {
    limparWishlist();
    if (typeof mostrarToast === "function") mostrarToast(typeof t === "function" ? t("wishlist.removidos_toast") : "Favoritos removidos");
  }
}

// ── UI: Badge e botões de coração ──────────────────────────

function atualizarBadgeWishlist() {
  const badge = document.getElementById("badge-wishlist");
  if (badge) {
    const n = contarFavoritos();
    badge.textContent = n;
    badge.style.display = n > 0 ? "" : "none";
  }
  const btn = document.getElementById("btn-wishlist-main");
  if (btn) {
    btn.classList.toggle("tem-favoritos", contarFavoritos() > 0);
  }
}

// Sincroniza todos os botões de coração para um produto específico
function atualizarTodosBotoesFav(produtoId, activo) {
  document.querySelectorAll(`[data-fav-id="${produtoId}"]`).forEach(b => {
    b.classList.toggle("activo", activo);
    const icone = b.querySelector(".lmi");
    if (icone) icone.textContent = activo ? "favorite" : "favorite_border";
    b.setAttribute("aria-pressed", String(activo));
    b.setAttribute("aria-label", activo ? "Remover dos favoritos" : "Adicionar aos favoritos");
  });
}

// ── Drawer ──────────────────────────────────────────────────

function abrirWishlist() {
  const m = document.getElementById("modal-wishlist");
  if (!m) return;
  renderizarWishlistDrawer();
  m.classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharWishlist() {
  const m = document.getElementById("modal-wishlist");
  if (!m) return;
  m.classList.remove("aberto");
  document.body.style.overflow = "";
}

function fecharWishlistOverlay(e) {
  if (e.target === document.getElementById("modal-wishlist")) fecharWishlist();
}

function renderizarWishlistDrawer() {
  const lista = document.getElementById("lista-wishlist");
  const count = document.getElementById("drawer-count-wishlist");
  const footer = document.getElementById("wishlist-footer");
  if (!lista) return;
  const tFn = (typeof t === "function") ? t : null;

  const favoritos = listaFavoritos();
  if (count) count.textContent = favoritos.length;
  if (footer) footer.style.display = favoritos.length > 0 ? "block" : "none";

  if (favoritos.length === 0) {
    const tituloVazio = tFn ? tFn("wishlist.vazio_titulo") : "Sem favoritos ainda";
    const textoVazio  = tFn ? tFn("wishlist.vazio_texto")  : "Toque no ♥ em qualquer produto para guardar aqui. Os seus favoritos ficam guardados entre sessões.";
    const verCat      = tFn ? tFn("carrinho.ver_catalogo") : "Ver catálogo";
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <span class="lmi lmi-xl" aria-hidden="true">favorite_border</span>
        <h3 class="vazio-titulo">${tituloVazio}</h3>
        <p class="vazio-texto">${textoVazio}</p>
        <a href="index.html" class="btn-vazio-acao" onclick="fecharWishlist()">
          <span class="lmi lmi-sm" aria-hidden="true">grid_view</span>
          ${verCat}
        </a>
      </div>`;
    return;
  }

  // Usa a mesma função de precoComDesconto que já está em produtos.js
  const formatador = typeof formatarMZN === "function" ? formatarMZN : (v => v + " MT");
  const preco = typeof precoComDesconto === "function"
    ? precoComDesconto
    : p => p.preco;

  const txtNoCart   = tFn ? tFn("wishlist.no_carrinho") : "Já no carrinho";
  const txtAddCart  = tFn ? tFn("wishlist.add_carrinho") : "Adicionar ao carrinho";
  const txtRemFav   = tFn ? tFn("wishlist.remover") : "Remover dos favoritos";

  lista.innerHTML = favoritos.map(p => {
    const precoFinal = preco(p);
    const temDesconto = p.desconto && p.desconto > 0;
    const noCarrinho = typeof carrinho !== "undefined" && carrinho.some(i => i.id === p.id);
    return `
    <div class="item-wishlist">
      <a href="produto.html?id=${p.id}" class="item-wishlist-link" onclick="fecharWishlist()">
        <img src="${p.imagens[0]}" alt="${p.nome}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%23e8e6f0%22 width=%2260%22 height=%2260%22/></svg>'" />
        <div class="item-wishlist-info">
          <span class="item-wishlist-marca">${p.marca}</span>
          <span class="item-wishlist-nome">${p.nome}</span>
          <div class="item-wishlist-preco">
            ${temDesconto ? `<span class="item-wishlist-old">${formatador(p.preco)}</span>` : ''}
            <span class="item-wishlist-final">${formatador(precoFinal)}</span>
          </div>
        </div>
      </a>
      <div class="item-wishlist-acoes">
        <button class="btn-wishlist-add ${noCarrinho ? 'no-carrinho' : ''}"
                onclick="adicionarFavoritoAoCarrinho(${p.id})"
                aria-label="${noCarrinho ? txtNoCart : txtAddCart}">
          <span class="lmi lmi-sm" aria-hidden="true">${noCarrinho ? 'check' : 'add_shopping_cart'}</span>
        </button>
        <button class="btn-wishlist-remover"
                onclick="alternarFavorito(${p.id})"
                aria-label="${txtRemFav}">
          <span class="lmi lmi-sm" aria-hidden="true">close</span>
        </button>
      </div>
    </div>
  `;
  }).join("");
}

function adicionarFavoritoAoCarrinho(produtoId) {
  if (typeof adicionarAoCarrinho === "function") {
    adicionarAoCarrinho(produtoId);
    // Re-renderizar o drawer para o botão "+" virar "✓"
    renderizarWishlistDrawer();
  }
}

// ── Init ────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  atualizarBadgeWishlist();

  // ESC fecha drawer
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const drawer = document.getElementById("modal-wishlist");
      if (drawer?.classList.contains("aberto")) fecharWishlist();
    }
  });
});

// Re-render quando o idioma muda (Fase 3C)
document.addEventListener("lumart:lang-changed", () => {
  const drawer = document.getElementById("modal-wishlist");
  if (drawer?.classList.contains("aberto")) renderizarWishlistDrawer();
});
