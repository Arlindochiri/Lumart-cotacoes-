// ============================================================
//  LUMART — Lógica do Checkout
//  ============================================================
//  Responsabilidades:
//    - Renderizar o resumo do pedido
//    - Popular dropdowns de país e província
//    - Calcular frete dinamicamente conforme endereço
//    - Calcular sinal/restante adaptado ao tipo de produtos
//    - Calcular prazo de entrega estimado
//    - Validar formulário e gerar PDF/WhatsApp
// ============================================================

// Estado actual do checkout
let estadoCheckout = {
  pais:        "",
  provincia:   "",
  frete:       0,
  prazo:       null,
  envio:       null,
};

// ────────────────────────────────────────────────────────────
//  Inicialização
// ────────────────────────────────────────────────────────────
function initCheckout() {
  // Se carrinho vazio, redirecionar
  if (!carrinho || carrinho.length === 0) {
    mostrarToast(typeof t === "function" ? t("toast.adicione_antes") : "Adicione produtos antes de continuar.");
    setTimeout(() => window.location.href = "index.html", 1500);
    return;
  }

  popularDropdowns();
  renderizarResumo();
  ligarEventos();
  atualizarUI();

  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
  }, 100);
}

// ────────────────────────────────────────────────────────────
//  Dropdowns de país e província
// ────────────────────────────────────────────────────────────
function popularDropdowns() {
  const paisSelect = document.getElementById("input-pais");
  if (!paisSelect) return;
  const tFn = (typeof t === "function") ? t : null;
  const placeholder = tFn ? tFn("checkout.pais_placeholder") : "— Selecionar país —";

  paisSelect.innerHTML = `
    <option value="">${placeholder}</option>
    ${Object.entries(PAISES).map(([cod, p]) => {
      // Traduzir só o nome do país (mz/za); manter bandeira
      const nomeTraduzido = tFn ? tFn(`pais.${cod.toLowerCase()}`) : p.nome;
      return `<option value="${cod}">${p.bandeira} ${nomeTraduzido}</option>`;
    }).join("")}
  `;
}

function popularProvincias(pais) {
  const provSelect = document.getElementById("input-provincia");
  if (!provSelect) return;
  const tFn = (typeof t === "function") ? t : null;
  const placeholderVazio = tFn ? tFn("checkout.provincia_placeholder") : "— Selecione primeiro o país —";
  const placeholderEscolher = tFn ? tFn("checkout.provincia_escolher") : "— Selecionar província —";

  if (!pais || !PAISES[pais]) {
    provSelect.innerHTML = `<option value="">${placeholderVazio}</option>`;
    provSelect.disabled = true;
    return;
  }

  provSelect.innerHTML = `
    <option value="">${placeholderEscolher}</option>
    ${PAISES[pais].provincias.map(p => `<option value="${p}">${p}</option>`).join("")}
  `;
  provSelect.disabled = false;
}

// ────────────────────────────────────────────────────────────
//  Eventos do formulário
// ────────────────────────────────────────────────────────────
function ligarEventos() {
  const paisEl  = document.getElementById("input-pais");
  const provEl  = document.getElementById("input-provincia");

  if (paisEl) {
    paisEl.addEventListener("change", e => {
      estadoCheckout.pais = e.target.value;
      estadoCheckout.provincia = "";
      popularProvincias(estadoCheckout.pais);
      recalcular();
    });
  }

  if (provEl) {
    provEl.addEventListener("change", e => {
      estadoCheckout.provincia = e.target.value;
      recalcular();
    });
  }

  // Limpar erro ao começar a escrever
  ["input-nome", "input-telefone", "input-cidade", "input-bairro"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", e => {
      e.target.classList.remove("erro");
    });
  });
}

// ────────────────────────────────────────────────────────────
//  Recalcular (frete, prazo, total, sinal)
// ────────────────────────────────────────────────────────────
function recalcular() {
  estadoCheckout.frete = calcularFrete(estadoCheckout.pais, estadoCheckout.provincia);
  estadoCheckout.prazo = calcularPrazoEntrega(carrinho, estadoCheckout.provincia);
  estadoCheckout.envio = tipoEnvio(estadoCheckout.provincia);

  atualizarFrete();
  atualizarTotais();
  atualizarPrazo();
}

// ────────────────────────────────────────────────────────────
//  Renderização do Resumo
// ────────────────────────────────────────────────────────────
function renderizarResumo() {
  const lista = document.getElementById("resumo-lista");
  if (!lista) return;
  const tFn = (typeof t === "function") ? t : null;
  const txtEmStock = tFn ? tFn("card.em_stock") : "Em stock";
  const txtSobEnc  = tFn ? tFn("card.sob_encomenda") : "Sob encomenda";

  lista.innerHTML = carrinho.map(item => {
    const precoFinal = precoComDesconto(item);
    return `
      <div class="checkout-item">
        <img src="${item.imagens[0]}" alt="${item.nome}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect fill=%22%23f5f3ee%22 width=%2260%22 height=%2260%22/></svg>'" />
        <div class="checkout-item-info">
          <span class="checkout-item-nome">${item.nome}</span>
          <span class="checkout-item-meta">
            ${item.qtd} × ${formatarMZN(precoFinal)}
            ${item.disponibilidade === "sob_encomenda" ? `<span class="badge-mini badge-sob">${txtSobEnc}</span>` : `<span class="badge-mini badge-disp">${txtEmStock}</span>`}
          </span>
        </div>
        <span class="checkout-item-total">${formatarMZN(precoFinal * item.qtd)}</span>
      </div>
    `;
  }).join("");

  atualizarTotais();
}

// ────────────────────────────────────────────────────────────
//  Atualizações dinâmicas
// ────────────────────────────────────────────────────────────
function atualizarFrete() {
  const linhaFrete = document.getElementById("linha-frete");
  const valorFrete = document.getElementById("valor-frete");
  const descrFrete = document.getElementById("frete-descricao");

  if (!linhaFrete) return;

  if (estadoCheckout.frete > 0 && estadoCheckout.envio) {
    linhaFrete.classList.add("activo");
    valorFrete.textContent = formatarMZN(estadoCheckout.frete);
    descrFrete.innerHTML = `${estadoCheckout.envio.tipo} · ${estadoCheckout.envio.detalhe}`;
  } else {
    linhaFrete.classList.remove("activo");
    valorFrete.textContent = "—";
    descrFrete.innerHTML = (typeof t === "function") ? t("checkout.frete_calcular") : "Selecione o endereço de entrega para calcular";
  }
}

function atualizarTotais() {
  const subtotal  = carrinho.reduce((acc, i) => acc + precoComDesconto(i) * i.qtd, 0);
  const frete     = estadoCheckout.frete;
  const total     = subtotal + frete;

  // Sinal e restante (frete somado ao sinal — cliente paga adiantado)
  const sinalProdutos = calcularSinal(carrinho);
  const sinal     = sinalProdutos.sinal + frete;
  const restante  = sinalProdutos.restante;

  // Detectar se cliente é de África do Sul → mostrar ZAR equivalente
  const mostrarZAR = estadoCheckout.pais === "ZA";

  // Atualizar elementos MZN (sempre)
  setText("valor-subtotal", formatarMZN(subtotal));
  setText("valor-total",    formatarMZN(total));
  setText("valor-sinal",    formatarMZN(sinal));
  setText("valor-restante", formatarMZN(restante));

  // Linhas ZAR (visíveis só se cliente é ZA)
  atualizarLinhasZAR({ subtotal, frete, total, sinal, restante, mostrar: mostrarZAR });

  // Termos dinâmicos
  const termosEl = document.getElementById("termos-pagamento");
  if (termosEl) {
    const termos = termosPagamentoTexto(carrinho);
    termosEl.innerHTML = termos.map(t => `<li>${t}</li>`).join("") +
      (frete > 0 ? '<li>Frete pago no momento do pedido (junto ao sinal)</li>' : '');
  }

  // Aviso de mínimo de cotação + bloqueio de botões
  atualizarAvisoMinimo();
}

// ── Conversão MZN → ZAR (cliente África do Sul) ─────────────
function atualizarLinhasZAR({ subtotal, frete, total, sinal, restante, mostrar }) {
  const wrap = document.getElementById("bloco-cambio-zar");
  if (!wrap) return;

  if (!mostrar) {
    wrap.classList.remove("activo");
    // Esconder também os spans de equivalência ZAR
    document.querySelectorAll(".resumo-zar").forEach(el => {
      el.textContent = "";
      el.classList.remove("activo");
    });
    return;
  }

  wrap.classList.add("activo");
  const dataFmt = formatarDataCambio(TAXA_CAMBIO_ZAR.dataActualizacao);
  const tFn = (typeof t === "function") ? t : null;
  const txtTitulo = tFn ? tFn("checkout.cambio_titulo") : "Equivalente em Rand (ZAR)";
  const txtTaxa = tFn ? tFn("checkout.cambio_taxa", { taxa: Number(TAXA_CAMBIO_ZAR.valor).toFixed(4) }) : `Taxa actual: 1 MZN = ${Number(TAXA_CAMBIO_ZAR.valor).toFixed(4)} R`;
  const txtData = tFn ? tFn("checkout.cambio_actualizada", { data: dataFmt }) : `actualizada em ${dataFmt}`;
  const txtAviso = tFn ? tFn("checkout.cambio_aviso") : "Valores em ZAR são apenas referência. O pagamento é processado em Metical (MZN).";
  const lblSub = tFn ? tFn("checkout.subtotal") : "Subtotal";
  const lblFrete = tFn ? tFn("checkout.frete") : "Frete";
  const lblTotal = tFn ? tFn("checkout.total") : "Total";
  const lblSinal = tFn ? tFn("checkout.sinal") : "Sinal a pagar";
  const lblRest = tFn ? tFn("checkout.restante") : "Restante";

  wrap.innerHTML = `
    <div class="cambio-icon" aria-hidden="true">
      <span class="lmi lmi-sm">currency_exchange</span>
    </div>
    <div class="cambio-texto">
      <strong>${txtTitulo}</strong>
      <p>
        <strong>${txtTaxa}</strong>
        <span class="cambio-data">· ${txtData}</span>
      </p>
      <ul class="cambio-linhas">
        <li><span>${lblSub}:</span> <strong>${formatarZAR(mznParaZar(subtotal))}</strong></li>
        ${frete > 0 ? `<li><span>${lblFrete}:</span> <strong>${formatarZAR(mznParaZar(frete))}</strong></li>` : ''}
        <li class="destaque"><span>${lblTotal}:</span> <strong>${formatarZAR(mznParaZar(total))}</strong></li>
        <li><span>${lblSinal}:</span> <strong>${formatarZAR(mznParaZar(sinal))}</strong></li>
        ${restante > 0 ? `<li><span>${lblRest}:</span> <strong>${formatarZAR(mznParaZar(restante))}</strong></li>` : ''}
      </ul>
      <small class="cambio-aviso">${txtAviso}</small>
    </div>
  `;
}

// Formata "2026-05-11" → "11/05/2026"
function formatarDataCambio(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

// ── Aviso de Mínimo de Cotação no checkout ──────────────────
function atualizarAvisoMinimo() {
  const aviso = document.getElementById("aviso-minimo-checkout");
  const btnWA = document.querySelector(".btn-whatsapp.btn-cta");
  const btnPDF = document.querySelector(".btn-pdf.btn-cta");
  if (!aviso) return;

  const val = validarMinimoCotacao(carrinho);

  if (val.maiorMinimo === 0 || val.valido) {
    aviso.classList.remove("activo");
    aviso.innerHTML = "";
    if (btnWA)  btnWA.classList.remove("bloqueado");
    if (btnPDF) btnPDF.classList.remove("bloqueado");
    return;
  }

  // Bloqueado — mostrar aviso e desactivar botões
  aviso.classList.add("activo");
  const tFn2 = (typeof t === "function") ? t : null;
  const tituloAviso = tFn2 ? tFn2("carrinho.aviso_minimo_titulo") : "Cotação mínima não atingida";
  const textoAviso = tFn2
    ? tFn2("carrinho.aviso_minimo_texto", {
        produto: val.produtoLimitante.nome,
        minimo: formatarMZN(val.maiorMinimo),
        faltam: formatarMZN(val.faltam),
      })
    : `O produto <strong>${val.produtoLimitante.nome}</strong> requer cotação mínima de <strong>${formatarMZN(val.maiorMinimo)}</strong>. Faltam <strong>${formatarMZN(val.faltam)}</strong>.`;
  const voltarLabel = tFn2 ? tFn2("carrinho.ver_catalogo") : "Voltar ao catálogo";
  aviso.innerHTML = `
    <div class="aviso-minimo-icon" aria-hidden="true">
      <span class="lmi lmi-sm">lock</span>
    </div>
    <div class="aviso-minimo-texto">
      <strong>${tituloAviso}</strong>
      <p>${textoAviso}</p>
      <a href="index.html" class="aviso-minimo-link">
        <span class="lmi lmi-sm" aria-hidden="true">grid_view</span>
        ${voltarLabel}
      </a>
    </div>
  `;
  if (btnWA)  btnWA.classList.add("bloqueado");
  if (btnPDF) btnPDF.classList.add("bloqueado");
}

function atualizarPrazo() {
  const wrap   = document.getElementById("bloco-prazo");
  const texto  = document.getElementById("prazo-texto");
  const detalhe = document.getElementById("prazo-detalhe");

  if (!wrap || !estadoCheckout.prazo) return;

  if (estadoCheckout.prazo.min === 0) {
    wrap.classList.remove("activo");
    return;
  }

  wrap.classList.add("activo");
  const tFn = (typeof t === "function") ? t : null;
  texto.textContent = tFn
    ? tFn("checkout.prazo_dias_uteis", { min: estadoCheckout.prazo.min, max: estadoCheckout.prazo.max })
    : `${estadoCheckout.prazo.min}–${estadoCheckout.prazo.max} dias úteis`;

  let det = "";
  if (estadoCheckout.envio) det = estadoCheckout.envio.tipo + " · ";
  if (estadoCheckout.prazo.limitadoPor === "sob_encomenda" &&
      carrinho.some(i => i.disponibilidade === "disponivel")) {
    det += tFn ? tFn("checkout.prazo_limitado_encomenda") : "limitado pelo produto sob encomenda";
  } else if (estadoCheckout.prazo.limitadoPor === "sob_encomenda") {
    det += tFn ? tFn("checkout.prazo_importados") : "produtos importados directamente";
  } else {
    det += tFn ? tFn("checkout.prazo_em_stock") : "produtos em stock";
  }
  detalhe.textContent = det;
}

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

// ────────────────────────────────────────────────────────────
//  Validação e obtenção de dados
// ────────────────────────────────────────────────────────────
function validarCheckout() {
  const tFn = (typeof t === "function") ? t : null;
  const campos = [
    { id: "input-nome",      label: tFn ? tFn("checkout.nome")       : "Nome completo" },
    { id: "input-telefone",  label: tFn ? tFn("checkout.telefone")   : "Telefone" },
    { id: "input-pais",      label: tFn ? tFn("checkout.pais")       : "País" },
    { id: "input-provincia", label: tFn ? tFn("checkout.provincia")  : "Província" },
    { id: "input-cidade",    label: tFn ? tFn("checkout.cidade")     : "Cidade" },
    { id: "input-bairro",    label: tFn ? tFn("checkout.bairro")     : "Bairro" },
  ];

  for (const c of campos) {
    const el = document.getElementById(c.id);
    if (!el || !el.value.trim()) {
      el?.classList.add("erro");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      mostrarToast(typeof t === "function" ? t("toast.preencha_campo", { campo: c.label }) : `Preencha: ${c.label}`);
      return false;
    }
    el.classList.remove("erro");
  }

  if (carrinho.length === 0) {
    mostrarToast(typeof t === "function" ? t("toast.carrinho_vazio") : "O carrinho está vazio.");
    return false;
  }

  return true;
}

function obterDadosCheckout() {
  const pais = document.getElementById("input-pais")?.value || "";
  return {
    nome:        document.getElementById("input-nome")?.value.trim()      || "",
    telefone:    document.getElementById("input-telefone")?.value.trim()  || "",
    pais:        pais,
    paisNome:    PAISES[pais]?.nome || "",
    provincia:   document.getElementById("input-provincia")?.value        || "",
    cidade:      document.getElementById("input-cidade")?.value.trim()    || "",
    bairro:      document.getElementById("input-bairro")?.value.trim()    || "",
    referencia:  document.getElementById("input-referencia")?.value.trim()|| "",
    observacoes: document.getElementById("input-obs")?.value.trim()       || "",
    frete:       estadoCheckout.frete,
    envio:       estadoCheckout.envio,
    prazo:       estadoCheckout.prazo,
  };
}

// ────────────────────────────────────────────────────────────
//  Acções dos botões
// ────────────────────────────────────────────────────────────
function acaoCheckoutPDF() {
  // Validar mínimo de cotação
  const val = validarMinimoCotacao(carrinho);
  if (!val.valido) {
    mostrarToast(typeof t === "function" ? t("toast.minimo_faltam", { valor: formatarMZN(val.faltam) }) : `Cotação mínima não atingida — faltam ${formatarMZN(val.faltam)}`);
    document.getElementById("aviso-minimo-checkout")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!validarCheckout()) return;
  const dados = obterDadosCheckout();
  const num = gerarNumeroCotacao();
  criarPDFCheckout(dados, num, true);
  mostrarToast(typeof t === "function" ? t("toast.pdf_gerado") : "PDF gerado com sucesso!");
}

function acaoCheckoutWhatsApp() {
  // Validar mínimo de cotação
  const val = validarMinimoCotacao(carrinho);
  if (!val.valido) {
    mostrarToast(typeof t === "function" ? t("toast.minimo_faltam", { valor: formatarMZN(val.faltam) }) : `Cotação mínima não atingida — faltam ${formatarMZN(val.faltam)}`);
    document.getElementById("aviso-minimo-checkout")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!validarCheckout()) return;
  const dados = obterDadosCheckout();
  const num = gerarNumeroCotacao();

  // Gerar e baixar o PDF
  criarPDFCheckout(dados, num, true);

  // Construir mensagem
  const tFn = (typeof t === "function") ? t : null;
  const tx = (chave, fallback, params) => tFn ? tFn(chave, params) : fallback;

  const linhas = carrinho.map(i =>
    `  • ${i.nome} × ${i.qtd} — ${formatarMZN(precoComDesconto(i) * i.qtd)}`
  ).join("\n");

  const subtotal = carrinho.reduce((a, i) => a + precoComDesconto(i) * i.qtd, 0);
  const frete    = dados.frete;
  const total    = subtotal + frete;
  const sinalP   = calcularSinal(carrinho);
  const sinal    = sinalP.sinal + frete;
  const restante = sinalP.restante;

  let endereco = `${dados.bairro}, ${dados.cidade}, ${dados.provincia}, ${dados.paisNome}`;
  if (dados.referencia) endereco += `\n   ${tx("wpp.referencia", "Referência:")} ${dados.referencia}`;

  const prazoTexto = dados.prazo && dados.prazo.min > 0
    ? tx("wpp.prazo_dias", `${dados.prazo.min}–${dados.prazo.max} dias úteis`, { min: dados.prazo.min, max: dados.prazo.max })
    : tx("wpp.prazo_confirmar", "a confirmar");

  // Se cliente é de África do Sul, incluir equivalente em ZAR
  const ehZA = dados.pais === "ZA";
  const linhasZAR = ehZA
    ? `\n\n*${tx("wpp.zar_titulo", "EQUIVALENTE EM RAND (ZAR):")}*\n` +
      `  • ${tx("wpp.zar_subtotal", "Subtotal:")} ${formatarZAR(mznParaZar(subtotal))}\n` +
      (frete > 0 ? `  • ${tx("wpp.zar_frete", "Frete:")} ${formatarZAR(mznParaZar(frete))}\n` : "") +
      `  • ${tx("wpp.zar_total", "Total:")} ${formatarZAR(mznParaZar(total))}\n` +
      `  • ${tx("wpp.zar_sinal", "Sinal:")} ${formatarZAR(mznParaZar(sinal))}\n` +
      (restante > 0 ? `  • ${tx("wpp.zar_restante", "Restante:")} ${formatarZAR(mznParaZar(restante))}\n` : "") +
      `  _${tx("wpp.zar_taxa", `Taxa: 1 MZN = ${Number(TAXA_CAMBIO_ZAR.valor).toFixed(4)} R · ${formatarDataCambio(TAXA_CAMBIO_ZAR.dataActualizacao)}`, { valor: Number(TAXA_CAMBIO_ZAR.valor).toFixed(4), data: formatarDataCambio(TAXA_CAMBIO_ZAR.dataActualizacao) })}_\n` +
      `  _${tx("wpp.zar_aviso", "Pagamento processado em Metical (MZN).")}_`
    : "";

  const msg =
    `${tx("wpp.intro", `Olá! Sou *${dados.nome}* e gostaria de confirmar a cotação ${num}.`, { nome: dados.nome, num })}\n\n` +
    `*${tx("wpp.produtos_titulo", "PRODUTOS:")}*\n${linhas}\n\n` +
    `*${tx("wpp.subtotal_label", "Subtotal:")}* ${formatarMZN(subtotal)}\n` +
    `*${tx("wpp.frete_label", "Frete:")}* ${formatarMZN(frete)} (${dados.envio?.tipo || "—"})\n` +
    `*${tx("wpp.total_label", "TOTAL:")} ${formatarMZN(total)}*\n\n` +
    `*${tx("wpp.pagamento_titulo", "PAGAMENTO:")}*\n` +
    `  • ${tx("wpp.sinal_agora", "Sinal (agora):")} ${formatarMZN(sinal)}\n` +
    `  • ${tx("wpp.na_entrega", "Na entrega:")} ${formatarMZN(restante)}` +
    linhasZAR +
    `\n\n*${tx("wpp.endereco_titulo", "ENDEREÇO DE ENTREGA:")}*\n📍 ${endereco}\n\n` +
    `📞 ${tx("wpp.telefone_label", "Telefone:")} ${dados.telefone}\n` +
    `⏱️ ${tx("wpp.entrega_estimada", "Entrega estimada:")} ${prazoTexto}\n` +
    (dados.observacoes ? `\n📝 ${tx("wpp.obs_label", "Obs:")} ${dados.observacoes}\n` : "") +
    `\n_${tx("wpp.pdf_anexo", "Segue em anexo o PDF da cotação.")}_`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ────────────────────────────────────────────────────────────
//  Inicializar quando DOM carregar
// ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initCheckout);

// Re-render quando o idioma muda (Fase 3C)
document.addEventListener("lumart:lang-changed", () => {
  // Re-renderizar dropdowns para traduzir nomes de países
  const paisActual = document.getElementById("input-pais")?.value || "";
  popularDropdowns();
  if (paisActual) {
    // Restaurar selecção
    const paisEl = document.getElementById("input-pais");
    if (paisEl) paisEl.value = paisActual;
    popularProvincias(paisActual);
    // Restaurar província também se possível
    const provActual = estadoCheckout?.provincia;
    if (provActual) {
      const provEl = document.getElementById("input-provincia");
      if (provEl) provEl.value = provActual;
    }
  }
  // Re-renderizar tudo o resto que tem texto
  renderizarResumo();
  atualizarFrete();
  atualizarPrazo();
  if (typeof atualizarAvisoMinimo === "function") atualizarAvisoMinimo();
});
