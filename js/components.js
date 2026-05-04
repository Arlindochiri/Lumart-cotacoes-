// ============================================================
//  LUMART — Carregador de componentes (header/footer)
//  Permite reutilizar markup HTML em várias páginas via fetch
// ============================================================

(function () {
  /**
   * Carrega o conteúdo de um ficheiro HTML para um seletor.
   * @param {string} url — caminho do componente (relativo à página atual)
   * @param {string} selector — seletor onde inserir o markup
   * @param {Function} [callback] — chamado após inserção
   */
  async function carregarComponente(url, selector, callback) {
    const alvo = document.querySelector(selector);
    if (!alvo) return;
    try {
      const resp = await fetch(url, { cache: "no-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      alvo.innerHTML = await resp.text();
      if (typeof callback === "function") callback();
    } catch (e) {
      console.warn(`[components] Falha ao carregar ${url}:`, e);
    }
  }

  // Detectar profundidade da página (raiz vs /pages/)
  function basePath() {
    const path = window.location.pathname;
    return path.includes("/pages/") ? ".." : ".";
  }

  // Auto-carregar componentes marcados com data-component
  document.addEventListener("DOMContentLoaded", () => {
    const base = basePath();
    document.querySelectorAll("[data-component]").forEach((el) => {
      const nome = el.dataset.component;
      const url = `${base}/components/${nome}.html`;
      carregarComponente(url, `[data-component="${nome}"]`, () => {
        // Após inserir, atualiza os links para serem relativos à página atual
        ajustarLinksRelativos(el, base);
        // Atualizar badge do carrinho se já existe lógica
        if (typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
      });
    });
  });

  // Ajusta hrefs com prefixo {{base}} para o caminho relativo correcto
  function ajustarLinksRelativos(container, base) {
    container.querySelectorAll("[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && href.includes("{{base}}")) {
        a.setAttribute("href", href.replace(/{{base}}/g, base));
      }
    });
    container.querySelectorAll("[src]").forEach((el) => {
      const src = el.getAttribute("src");
      if (src && src.includes("{{base}}")) {
        el.setAttribute("src", src.replace(/{{base}}/g, base));
      }
    });
  }

  window.LumartComponents = { carregarComponente };
})();
