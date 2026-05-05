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
    mostrarToast("Adicione produtos antes de continuar.");
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

  paisSelect.innerHTML = `
    <option value="">— Selecionar país —</option>
    ${Object.entries(PAISES).map(([cod, p]) => `
      <option value="${cod}">${p.bandeira} ${p.nome}</option>
    `).join("")}
  `;
}

function popularProvincias(pais) {
  const provSelect = document.getElementById("input-provincia");
  if (!provSelect) return;

  if (!pais || !PAISES[pais]) {
    provSelect.innerHTML = `<option value="">— Selecione primeiro o país —</option>`;
    provSelect.disabled = true;
    return;
  }

  provSelect.innerHTML = `
    <option value="">— Selecionar província —</option>
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
            ${item.disponibilidade === "sob_encomenda" ? '<span class="badge-mini badge-sob">Sob encomenda</span>' : '<span class="badge-mini badge-disp">Em stock</span>'}
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
    descrFrete.innerHTML = "Selecione o endereço de entrega para calcular";
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

  // Atualizar elementos
  setText("valor-subtotal", formatarMZN(subtotal));
  setText("valor-total",    formatarMZN(total));
  setText("valor-sinal",    formatarMZN(sinal));
  setText("valor-restante", formatarMZN(restante));

  // Termos dinâmicos
  const termosEl = document.getElementById("termos-pagamento");
  if (termosEl) {
    const termos = termosPagamentoTexto(carrinho);
    termosEl.innerHTML = termos.map(t => `<li>${t}</li>`).join("") +
      (frete > 0 ? '<li>Frete pago no momento do pedido (junto ao sinal)</li>' : '');
  }
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
  texto.textContent = `${estadoCheckout.prazo.min}–${estadoCheckout.prazo.max} dias úteis`;

  let det = "";
  if (estadoCheckout.envio) det = estadoCheckout.envio.tipo + " · ";
  if (estadoCheckout.prazo.limitadoPor === "sob_encomenda" &&
      carrinho.some(i => i.disponibilidade === "disponivel")) {
    det += "limitado pelo produto sob encomenda";
  } else if (estadoCheckout.prazo.limitadoPor === "sob_encomenda") {
    det += "produtos importados directamente";
  } else {
    det += "produtos em stock";
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
  const campos = [
    { id: "input-nome",      label: "Nome completo" },
    { id: "input-telefone",  label: "Telefone" },
    { id: "input-pais",      label: "País" },
    { id: "input-provincia", label: "Província" },
    { id: "input-cidade",    label: "Cidade" },
    { id: "input-bairro",    label: "Bairro" },
  ];

  for (const c of campos) {
    const el = document.getElementById(c.id);
    if (!el || !el.value.trim()) {
      el?.classList.add("erro");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      mostrarToast(`Preencha: ${c.label}`);
      return false;
    }
    el.classList.remove("erro");
  }

  if (carrinho.length === 0) {
    mostrarToast("O carrinho está vazio.");
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
  if (!validarCheckout()) return;
  const dados = obterDadosCheckout();
  const num = gerarNumeroCotacao();
  criarPDFCheckout(dados, num, true);
  mostrarToast("PDF gerado com sucesso!");
}

function acaoCheckoutWhatsApp() {
  if (!validarCheckout()) return;
  const dados = obterDadosCheckout();
  const num = gerarNumeroCotacao();

  // Gerar e baixar o PDF
  criarPDFCheckout(dados, num, true);

  // Construir mensagem
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
  if (dados.referencia) endereco += `\n   Referência: ${dados.referencia}`;

  const prazoTexto = dados.prazo && dados.prazo.min > 0
    ? `${dados.prazo.min}–${dados.prazo.max} dias úteis`
    : "a confirmar";

  const msg =
    `Olá! Sou *${dados.nome}* e gostaria de confirmar a cotação ${num}.\n\n` +
    `*PRODUTOS:*\n${linhas}\n\n` +
    `*Subtotal:* ${formatarMZN(subtotal)}\n` +
    `*Frete:* ${formatarMZN(frete)} (${dados.envio?.tipo || "—"})\n` +
    `*TOTAL: ${formatarMZN(total)}*\n\n` +
    `*PAGAMENTO:*\n` +
    `  • Sinal (agora): ${formatarMZN(sinal)}\n` +
    `  • Na entrega: ${formatarMZN(restante)}\n\n` +
    `*ENDEREÇO DE ENTREGA:*\n📍 ${endereco}\n\n` +
    `📞 Telefone: ${dados.telefone}\n` +
    `⏱️ Entrega estimada: ${prazoTexto}\n` +
    (dados.observacoes ? `\n📝 Obs: ${dados.observacoes}\n` : "") +
    `\n_Segue em anexo o PDF da cotação._`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ────────────────────────────────────────────────────────────
//  Inicializar quando DOM carregar
// ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initCheckout);
