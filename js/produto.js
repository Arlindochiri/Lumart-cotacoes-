// ============================================================
//  LUMART — Lógica da página de produto individual
//  Lê ?id= da URL, renderiza galeria, vídeo, reviews e relacionados.
// ============================================================

(function () {
  function obterIdProduto() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
  }

  function renderizarProduto() {
    const id = obterIdProduto();
    const produto = encontrarProduto(id);
    const container = document.getElementById("produto-detalhe");
    if (!container) return;

    if (!produto) {
      container.innerHTML = `
        <div class="alert-vazio">
          <h2>Produto não encontrado</h2>
          <p>O produto que procuras não está disponível.</p>
          <a href="../index.html" class="btn btn-primary-lm">Voltar ao catálogo</a>
        </div>`;
      return;
    }

    const precoFinal = precoComDesconto(produto);
    const tem = (produto.desconto || 0) > 0;
    const galeria = produto.galeria && produto.galeria.length ? produto.galeria : [produto.imagem];
    const media = mediaRating(produto.id);
    const totalReviews = reviewsDoProduto(produto.id).length;

    container.innerHTML = `
      <nav class="breadcrumb-lm" aria-label="breadcrumb">
        <a href="../index.html">Catálogo</a>
        <span class="sep">›</span>
        <span>${produto.categoria}</span>
        <span class="sep">›</span>
        <strong>${produto.nome}</strong>
      </nav>

      <div class="produto-grid">

        <!-- Galeria -->
        <section class="produto-galeria">
          <div class="galeria-principal" id="galeria-principal">
            <img id="img-principal" class="zoomable" src="${galeria[0]}" alt="${produto.nome}" />
          </div>
          <div class="galeria-thumbs" id="galeria-thumbs">
            ${galeria.slice(0, 4).map((src, i) => `
              <button class="thumb ${i === 0 ? 'ativo' : ''}" data-idx="${i}" aria-label="Ver imagem ${i + 1}">
                <img src="${src}" alt="${produto.nome} — ${i + 1}" loading="lazy" />
              </button>
            `).join("")}
          </div>
        </section>

        <!-- Info / Compra -->
        <section class="produto-info">
          <p class="produto-marca">${produto.marca}</p>
          <h1 class="produto-nome">${produto.nome}</h1>

          <div class="produto-rating">
            ${renderStars(media || 5, "1.1em")}
            <span class="rating-num">${media ? media.toFixed(1) : "—"}</span>
            <span class="rating-count">(${totalReviews} avaliação${totalReviews === 1 ? "" : "s"})</span>
          </div>

          <div class="produto-precos">
            ${tem ? `<span class="produto-preco-antigo">${formatarMZN(produto.preco)}</span>` : ""}
            <span class="produto-preco">${formatarMZN(precoFinal)}</span>
            ${tem ? `<span class="produto-badge-desconto">-${produto.desconto}%</span>` : ""}
          </div>

          <p class="produto-descricao">${produto.descricao || ""}</p>

          <div class="produto-qtd-wrap">
            <label for="produto-qtd">Quantidade</label>
            <div class="qtd-controles">
              <button class="btn-qtd" type="button" onclick="alterarQtdProduto(-1)" aria-label="Diminuir">−</button>
              <input type="number" id="produto-qtd" min="1" value="1" />
              <button class="btn-qtd" type="button" onclick="alterarQtdProduto(1)" aria-label="Aumentar">+</button>
            </div>
          </div>

          <div class="produto-acoes">
            <button class="btn btn-primary-lm" onclick="adicionarAoCarrinhoProduto(${produto.id})">
              🛒 Adicionar ao Carrinho
            </button>
            <button class="btn btn-whatsapp-lm" onclick="comprarWhatsApp(${produto.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-1 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4z"/><path d="M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.5 5.9L0 24l6.3-1.5c1.7.9 3.7 1.5 5.7 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>
              Comprar via WhatsApp
            </button>
          </div>
        </section>
      </div>

      <!-- Vídeo do produto -->
      ${produto.video ? `
      <section class="produto-secao">
        <h2 class="secao-titulo">Veja em Vídeo</h2>
        <div class="produto-video-wrap">
          <iframe src="${produto.video}" title="${produto.nome}" frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen loading="lazy"></iframe>
        </div>
      </section>` : ""}

      <!-- Reviews -->
      <section class="produto-secao" id="secao-reviews">
        <h2 class="secao-titulo">Avaliações</h2>
        <div id="reviews-lista" class="reviews-lista"></div>
        <form id="form-review" class="form-review" autocomplete="off">
          <h3>Deixar avaliação</h3>
          <div class="campo">
            <label for="rev-nome">Nome</label>
            <input type="text" id="rev-nome" placeholder="O teu nome" required />
          </div>
          <div class="campo">
            <label>Nota</label>
            <div class="rating-input" id="rating-input">
              ${[1,2,3,4,5].map(n => `<button type="button" class="star-btn" data-val="${n}" aria-label="${n} estrelas">★</button>`).join("")}
            </div>
            <input type="hidden" id="rev-rating" value="5" />
          </div>
          <div class="campo">
            <label for="rev-comentario">Comentário</label>
            <textarea id="rev-comentario" rows="3" placeholder="Conta a tua experiência..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary-lm">Enviar avaliação</button>
        </form>
      </section>

      <!-- Relacionados -->
      <section class="produto-secao">
        <h2 class="secao-titulo">Produtos relacionados</h2>
        <div class="relacionados-grid" id="relacionados-grid"></div>
      </section>
    `;

    bindGaleria();
    bindRatingInput();
    bindFormReview(produto.id);
    renderReviews(produto.id);
    renderRelacionados(produto);

    // Atualizar título da aba
    document.title = `${produto.nome} — Lumart`;
  }

  // ── Galeria com troca de imagem e zoom ───────────────────────
  function bindGaleria() {
    const principal = document.getElementById("img-principal");
    const thumbs = document.querySelectorAll("#galeria-thumbs .thumb");

    thumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        const img = btn.querySelector("img");
        principal.src = img.src;
        thumbs.forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
      });
    });

    // Zoom on hover (simples — translate baseado em mousemove)
    const container = document.getElementById("galeria-principal");
    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      principal.style.transformOrigin = `${x}% ${y}%`;
      principal.style.transform = "scale(1.6)";
    });
    container.addEventListener("mouseleave", () => {
      principal.style.transform = "scale(1)";
    });
  }

  // ── Rating estrelas no formulário ────────────────────────────
  function bindRatingInput() {
    const botoes = document.querySelectorAll("#rating-input .star-btn");
    const hidden = document.getElementById("rev-rating");

    function pintar(valor) {
      botoes.forEach((b) => {
        b.classList.toggle("ativo", Number(b.dataset.val) <= valor);
      });
    }
    pintar(5);

    botoes.forEach((b) => {
      b.addEventListener("click", () => {
        const v = Number(b.dataset.val);
        hidden.value = v;
        pintar(v);
      });
    });
  }

  function bindFormReview(produtoId) {
    const form = document.getElementById("form-review");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("rev-nome").value.trim();
      const rating = Number(document.getElementById("rev-rating").value);
      const comentario = document.getElementById("rev-comentario").value.trim();
      if (!nome) { mostrarToast("Indica o teu nome."); return; }
      adicionarReview({ produtoId, nome, rating, comentario });
      form.reset();
      document.getElementById("rev-rating").value = "5";
      bindRatingInput();
      renderReviews(produtoId);
      mostrarToast("Avaliação publicada. Obrigado!");
    });
  }

  function renderReviews(produtoId) {
    const lista = document.getElementById("reviews-lista");
    if (!lista) return;
    const reviews = reviewsDoProduto(produtoId).reverse();
    if (reviews.length === 0) {
      lista.innerHTML = `<p class="text-muted">Ainda sem avaliações. Sê o primeiro!</p>`;
      return;
    }
    lista.innerHTML = reviews.map((r) => `
      <article class="review-item">
        <div class="review-cab">
          <strong>${r.nome}</strong>
          ${renderStars(r.rating, ".95em")}
          <span class="review-data">${r.data}</span>
        </div>
        ${r.comentario ? `<p class="review-comentario">${r.comentario}</p>` : ""}
      </article>
    `).join("");
  }

  function renderRelacionados(produto) {
    const grid = document.getElementById("relacionados-grid");
    if (!grid) return;
    const lista = produtosRelacionados(produto, 4);
    if (lista.length === 0) {
      grid.innerHTML = `<p class="text-muted">Sem produtos relacionados.</p>`;
      return;
    }
    grid.innerHTML = lista.map((p) => {
      const desc = (p.desconto || 0) > 0;
      const final = precoComDesconto(p);
      return `
        <article class="card-produto">
          <a class="card-link" href="produto.html?id=${p.id}">
            <div class="card-imagem-wrap">
              <img class="card-imagem" src="${p.imagem}" alt="${p.nome}" loading="lazy" />
              ${desc ? `<span class="card-badge-desconto">-${p.desconto}%</span>` : ""}
            </div>
          </a>
          <div class="card-corpo">
            <p class="card-marca">${p.marca}</p>
            <h3 class="card-nome"><a href="produto.html?id=${p.id}">${p.nome}</a></h3>
            <div class="card-precos">
              ${desc ? `<span class="card-preco-antigo">${formatarMZN(p.preco)}</span>` : ""}
              <span class="card-preco">${formatarMZN(final)}</span>
            </div>
            <button class="btn-adicionar" onclick="event.stopPropagation();adicionarAoCarrinho(${p.id})">+ Adicionar</button>
          </div>
        </article>
      `;
    }).join("");
  }

  // ── Ações públicas (acessíveis via inline onclick) ───────────
  window.alterarQtdProduto = function (delta) {
    const input = document.getElementById("produto-qtd");
    if (!input) return;
    const novo = Math.max(1, (Number(input.value) || 1) + delta);
    input.value = novo;
  };

  window.adicionarAoCarrinhoProduto = function (id) {
    const qtd = Math.max(1, Number(document.getElementById("produto-qtd")?.value) || 1);
    adicionarAoCarrinho(id, qtd);
  };

  window.comprarWhatsApp = function (id) {
    const produto = encontrarProduto(id);
    if (!produto) return;
    const qtd = Math.max(1, Number(document.getElementById("produto-qtd")?.value) || 1);
    const precoUnit = precoComDesconto(produto);
    const total = precoUnit * qtd;
    const msg =
      `Olá Lumart! Tenho interesse em comprar:\n\n` +
      `*${produto.nome}*\n` +
      `Marca: ${produto.marca}\n` +
      `Quantidade: ${qtd}\n` +
      `Preço unitário: ${formatarMZN(precoUnit)}\n` +
      `Total: ${formatarMZN(total)}\n\n` +
      `Aguardo confirmação. Obrigado!`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  document.addEventListener("DOMContentLoaded", renderizarProduto);
})();
