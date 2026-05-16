// ============================================================
//  LUMART — Geração de PDF e WhatsApp
// ============================================================

function gerarNumeroCotacao() {
  return "#" + (Math.floor(Date.now()/1000) % 10000).toString().padStart(4,"0");
}
function dataFormatada() {
  return new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
}

// Converte "2026-05-11" → "11/05/2026" (para cabeçalho do bloco ZAR no PDF)
function formatarDataPDF(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function validarFormulario() {
  const campos = [
    { id:"input-nome",      label:"Nome completo" },
    { id:"input-telefone",  label:"Telefone" },
    { id:"input-endereco",  label:"Endereço de entrega" },
  ];
  for (const c of campos) {
    const el = document.getElementById(c.id);
    if (!el || !el.value.trim()) {
      el?.classList.add("erro");
      el?.focus();
      mostrarToast(`Preencha: ${c.label}`);
      return false;
    }
    el.classList.remove("erro");
  }
  if (carrinho.length === 0) { mostrarToast("Adicione pelo menos um produto."); return false; }
  return true;
}

function obterDadosCliente() {
  return {
    nome:         document.getElementById("input-nome")?.value.trim()     || "",
    telefone:     document.getElementById("input-telefone")?.value.trim() || "",
    endereco:     document.getElementById("input-endereco")?.value.trim() || "",
    observacoes:  document.getElementById("input-obs")?.value.trim()      || "",
  };
}

// ── PDF ───────────────────────────────────────────────────────
function criarPDF(cliente, numCotacao, salvar = true) {
  if (!window.jspdf) { mostrarToast("Biblioteca PDF não carregada. Verifique a conexão."); return null; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const W = 210, M = 18;
  let y = 0;

  // Cabeçalho escuro
  doc.setFillColor(13, 12, 16);
  doc.rect(0, 0, W, 44, "F");

  // Acento dourado
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 4, 44, "F");

  // Logo
  doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.setTextColor(255,255,255);
  doc.text("LUMART", M + 4, 18);
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(156,153,168);
  doc.text("Art Supplies  ·  Traços que contam Histórias", M + 4, 26);

  // Número cotação
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(212,175,55);
  doc.text(`COTAÇÃO ${numCotacao}`, W - M, 17, { align:"right" });
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(156,153,168);
  doc.text(`Data: ${dataFormatada()}`, W - M, 24, { align:"right" });

  y = 54;

  // Dados do cliente
  doc.setFillColor(245,243,238);
  doc.roundedRect(M, y - 6, W - M*2, 40, 3, 3, "F");
  doc.setFillColor(212,175,55);
  doc.roundedRect(M, y - 6, 3, 40, 1.5, 1.5, "F");

  doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(107,103,120);
  doc.text("CLIENTE", M + 8, y + 2);

  const dadosCli = [
    ["Nome",      cliente.nome],
    ["Telefone",  cliente.telefone],
    ["Endereço",  cliente.endereco],
  ];
  dadosCli.forEach(([l, v], i) => {
    const ly = y + 10 + i * 8;
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(68,64,79);
    doc.text(l + ":", M + 8, ly);
    doc.setFont("helvetica","normal"); doc.setTextColor(13,12,16);
    doc.text(v, M + 30, ly);
  });

  if (cliente.observacoes) {
    y += 48;
    doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(107,103,120);
    doc.text("Obs: " + cliente.observacoes, M + 8, y);
  } else { y += 44; }

  y += 10;

  // Tabela — cabeçalho
  doc.setFillColor(13,12,16);
  doc.rect(M, y, W - M*2, 9, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(212,175,55);
  doc.text("PRODUTO",    M + 4,      y + 6);
  doc.text("QTD",        M + 100,    y + 6, { align:"center" });
  doc.text("UNITÁRIO",   M + 128,    y + 6, { align:"center" });
  doc.text("SUBTOTAL",   W - M - 3,  y + 6, { align:"right" });
  y += 9;

  // Linhas
  carrinho.forEach((item, i) => {
    const bg = i % 2 === 0 ? [255,255,255] : [248,246,252];
    doc.setFillColor(...bg);
    doc.rect(M, y, W - M*2, 9, "F");
    const nome = item.nome.length > 46 ? item.nome.substring(0,43) + "…" : item.nome;
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(44,41,53);
    doc.text(nome, M + 4, y + 6);
    doc.text(String(item.qtd), M + 100, y + 6, { align:"center" });
    doc.text(formatarMZN(precoComDesconto(item)), M + 128, y + 6, { align:"center" });
    doc.setFont("helvetica","bold");
    doc.text(formatarMZN(precoComDesconto(item) * item.qtd), W - M - 3, y + 6, { align:"right" });
    y += 9;
  });

  // Linha
  doc.setDrawColor(212,175,55); doc.setLineWidth(.3);
  doc.line(M, y + 3, W - M, y + 3);
  y += 10;

  // Total
  doc.setFillColor(13,12,16);
  doc.roundedRect(W - M - 74, y, 74, 15, 2, 2, "F");
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(107,103,120);
  doc.text("TOTAL ESTIMADO", W - M - 4, y + 5.5, { align:"right" });
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(212,175,55);
  doc.text(formatarMZN(calcularTotal()), W - M - 4, y + 12, { align:"right" });
  y += 24;

  // Termos
  doc.setFillColor(248,246,252);
  doc.roundedRect(M, y, W - M*2, 30, 2, 2, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(68,64,79);
  doc.text("TERMOS E CONDIÇÕES", M + 5, y + 7);
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(107,103,120);
  [
    "· Produtos em stock: 100% no momento do pedido.",
    "· Produtos sob encomenda: 75% no pedido + 25% na entrega.",
    "· Prazo de entrega: 13 a 30 dias úteis após confirmação do pagamento.",
    "· Cotação válida por 7 dias a partir da data de emissão.",
  ].forEach((l,i) => doc.text(l, M + 5, y + 14 + i*5));
  y += 38;

  // Rodapé
  doc.setFillColor(13,12,16);
  doc.rect(0, 278, W, 19, "F");
  doc.setFillColor(212,175,55); doc.rect(0, 278, W, 2, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(255,255,255);
  doc.text("LUMART", M, 290);
  doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(107,103,120);
  doc.text(`WhatsApp: +${WHATSAPP_NUMERO}  ·  lumartcomercial.com`, W/2, 290, { align:"center" });
  doc.text("Traços que contam Histórias", W - M, 290, { align:"right" });

  if (salvar) {
    const nome = `Lumart_Cotacao_${numCotacao.replace("#","")}_${cliente.nome.replace(/\s+/g,"_")}.pdf`;
    doc.save(nome);
  }
  return doc;
}

function acaoCriarPDF() {
  if (!validarFormulario()) return;
  const cliente = obterDadosCliente();
  criarPDF(cliente, gerarNumeroCotacao(), true);
  mostrarToast("PDF gerado com sucesso!");
}

function acaoEnviarWhatsApp() {
  if (!validarFormulario()) return;
  const cliente = obterDadosCliente();
  const num = gerarNumeroCotacao();
  criarPDF(cliente, num, true);

  const linhas = carrinho.map(i => `  • ${i.nome} × ${i.qtd} — ${formatarMZN(precoComDesconto(i) * i.qtd)}`).join("\n");
  const msg =
    `Olá! Sou *${cliente.nome}* e gostaria de confirmar a cotação ${num}.\n\n` +
    `*Produtos:*\n${linhas}\n\n` +
    `*Total: ${formatarMZN(calcularTotal())}*\n\n` +
    `📍 Entrega: ${cliente.endereco}\n` +
    (cliente.observacoes ? `📝 ${cliente.observacoes}\n\n` : "\n") +
    `_PDF em anexo._`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}


// ════════════════════════════════════════════════════════════
//  PDF DO CHECKOUT (Etapa 3)
//  Versão expandida que inclui:
//    - Endereço completo (país, província, cidade, bairro, ref)
//    - Frete + tipo de envio
//    - Subtotal, Total
//    - Sinal a pagar agora + Restante na entrega
//    - Prazo de entrega estimado
// ════════════════════════════════════════════════════════════

function criarPDFCheckout(dados, numCotacao, salvar = true) {
  if (!window.jspdf) {
    mostrarToast("Biblioteca PDF não carregada. Verifique a conexão.");
    return null;
  }

  // Helper de tradução local — usa i18n se disponível
  const tFn = (typeof t === "function") ? t : null;
  const tx = (chave, fallback, params) => tFn ? tFn(chave, params) : fallback;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18;
  let y = 0;

  // ── Cabeçalho ──────────────────────────────────────────────
  doc.setFillColor(13, 12, 16);
  doc.rect(0, 0, W, 44, "F");
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 4, 44, "F");

  doc.setFont("helvetica", "bold");  doc.setFontSize(22); doc.setTextColor(255, 255, 255);
  doc.text("LUMART", M + 4, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(156, 153, 168);
  doc.text(`Art Supplies  ·  ${tx("pdf.slogan", "Traços que contam Histórias")}`, M + 4, 26);

  doc.setFont("helvetica", "bold");  doc.setFontSize(10); doc.setTextColor(212, 175, 55);
  doc.text(`${tx("pdf.titulo", "COTAÇÃO")} ${numCotacao}`, W - M, 17, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(156, 153, 168);
  doc.text(`${tx("pdf.data", "Data")}: ${dataFormatada()}`, W - M, 24, { align: "right" });

  y = 54;

  // ── Bloco Cliente + Endereço (lado a lado) ────────────────
  const blocoLargura = (W - M*2 - 4) / 2;

  // Bloco esquerdo: Cliente
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(M, y - 6, blocoLargura, 44, 3, 3, "F");
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(M, y - 6, 3, 44, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(107, 103, 120);
  doc.text(tx("pdf.cliente", "CLIENTE"), M + 8, y + 2);

  const dadosCliente = [
    [tx("checkout.nome", "Nome"),         dados.nome],
    [tx("checkout.telefone", "Telefone"), dados.telefone],
  ];
  dadosCliente.forEach(([l, v], i) => {
    const ly = y + 10 + i * 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(68, 64, 79);
    doc.text(l + ":", M + 8, ly);
    doc.setFont("helvetica", "normal"); doc.setTextColor(13, 12, 16);
    const max = blocoLargura - 28;
    const txt = doc.splitTextToSize(v, max);
    doc.text(txt, M + 30, ly);
  });

  // Bloco direito: Endereço
  const xDir = M + blocoLargura + 4;
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(xDir, y - 6, blocoLargura, 44, 3, 3, "F");
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(xDir, y - 6, 3, 44, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(107, 103, 120);
  doc.text(tx("pdf.entrega", "ENTREGA"), xDir + 8, y + 2);

  const linhasEndereco = [
    `${dados.bairro}, ${dados.cidade}`,
    `${dados.provincia}, ${dados.paisNome}`,
  ];
  if (dados.referencia) linhasEndereco.push(`${tx("pdf.referencia", "Ref")}: ${dados.referencia}`);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(13, 12, 16);
  linhasEndereco.forEach((l, i) => {
    doc.text(doc.splitTextToSize(l, blocoLargura - 14), xDir + 8, y + 10 + i * 6);
  });

  y += 46;

  // Observações (se houver)
  if (dados.observacoes) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(107, 103, 120);
    const obsLabel = tx("pdf.observacoes_label", "Obs");
    const obsTxt = doc.splitTextToSize(`${obsLabel}: ${dados.observacoes}`, W - M*2);
    doc.text(obsTxt, M, y);
    y += obsTxt.length * 4 + 4;
  }

  y += 4;

  // ── Tabela de Produtos ─────────────────────────────────────
  doc.setFillColor(13, 12, 16);
  doc.rect(M, y, W - M*2, 9, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(212, 175, 55);
  doc.text(tx("pdf.descricao", "PRODUTO"),  M + 4,     y + 6);
  doc.text(tx("pdf.qtd", "QTD"),            M + 100,   y + 6, { align: "center" });
  doc.text(tx("pdf.preco_un", "UNITÁRIO"),  M + 128,   y + 6, { align: "center" });
  doc.text(tx("pdf.subtotal_item", "SUBTOTAL"), W - M - 3, y + 6, { align: "right" });
  y += 9;

  let subtotal = 0;
  carrinho.forEach((item, i) => {
    const bg = i % 2 === 0 ? [255, 255, 255] : [248, 246, 252];
    doc.setFillColor(...bg);
    doc.rect(M, y, W - M*2, 9, "F");

    const nome = item.nome.length > 46 ? item.nome.substring(0, 43) + "…" : item.nome;
    const precoFinal = precoComDesconto(item);
    const itemTotal = precoFinal * item.qtd;
    subtotal += itemTotal;

    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(44, 41, 53);
    doc.text(nome,                              M + 4,     y + 6);
    doc.text(String(item.qtd),                  M + 100,   y + 6, { align: "center" });
    doc.text(formatarMZN(precoFinal),           M + 128,   y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(formatarMZN(itemTotal),            W - M - 3, y + 6, { align: "right" });
    y += 9;
  });

  // ── Caixa de totais (lado direito) ─────────────────────────
  doc.setDrawColor(212, 175, 55); doc.setLineWidth(.3);
  doc.line(M, y + 3, W - M, y + 3);
  y += 8;

  const xTot = W - M - 78;
  const lblX = xTot + 4;
  const valX = W - M - 4;

  // Subtotal
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(107, 103, 120);
  doc.text(tx("pdf.subtotal", "Subtotal"),            lblX, y);
  doc.setTextColor(13, 12, 16);
  doc.text(formatarMZN(subtotal), valX, y, { align: "right" });
  y += 6;

  // Frete
  doc.setTextColor(107, 103, 120);
  const freteLabel = tx("pdf.frete_pdf", "Frete");
  const labelFrete = dados.envio ? `${freteLabel} (${dados.envio.tipo})` : freteLabel;
  doc.text(labelFrete,             lblX, y);
  doc.setTextColor(13, 12, 16);
  doc.text(formatarMZN(dados.frete), valX, y, { align: "right" });
  y += 7;

  // Linha divisória
  doc.setDrawColor(220, 218, 230);
  doc.line(lblX, y - 2, valX, y - 2);

  // Total destacado
  const total = subtotal + dados.frete;
  doc.setFillColor(13, 12, 16);
  doc.roundedRect(xTot, y - 1, 78, 14, 2, 2, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(156, 153, 168);
  doc.text(tx("pdf.total", "TOTAL"), lblX, y + 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(212, 175, 55);
  doc.text(formatarMZN(total), valX, y + 10, { align: "right" });

  y += 22;

  // ── Pagamento (sinal + restante) ───────────────────────────
  const sinalP   = calcularSinal(carrinho);
  const sinal    = sinalP.sinal + dados.frete;
  const restante = sinalP.restante;

  doc.setFillColor(212, 175, 55, 0.08);
  doc.setFillColor(252, 248, 232);
  doc.roundedRect(M, y, W - M*2, 22, 2, 2, "F");

  if (restante > 0) {
    // Lado esquerdo: Agora
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(168, 136, 32);
    doc.text(tx("pdf.sinal_label", "A PAGAR AGORA (SINAL)"), M + 6, y + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(13, 12, 16);
    doc.text(formatarMZN(sinal), M + 6, y + 16);

    // Linha vertical
    doc.setDrawColor(212, 175, 55, 0.4);
    doc.setLineWidth(.3);
    doc.line(W/2, y + 4, W/2, y + 18);

    // Lado direito: Entrega
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(168, 136, 32);
    doc.text(tx("pdf.restante_label", "A PAGAR NA ENTREGA"), W/2 + 6, y + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(13, 12, 16);
    doc.text(formatarMZN(restante), W/2 + 6, y + 16);
  } else {
    // Só sinal — centrado, sem divisória
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(168, 136, 32);
    doc.text(tx("pdf.sinal_label", "A PAGAR AGORA (SINAL)"), W/2, y + 7, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(13, 12, 16);
    doc.text(formatarMZN(sinal), W/2, y + 16, { align: "center" });
  }

  y += 28;

  // ── Equivalente em ZAR (apenas para clientes de África do Sul) ─
  if (dados.pais === "ZA" && typeof TAXA_CAMBIO_ZAR !== "undefined") {
    const dataCambio = formatarDataPDF(TAXA_CAMBIO_ZAR.dataActualizacao);

    doc.setFillColor(248, 250, 255);
    doc.roundedRect(M, y, W - M*2, 38, 2, 2, "F");
    doc.setFillColor(28, 110, 184);
    doc.roundedRect(M, y, 3, 38, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(28, 110, 184);
    doc.text(tx("pdf.zar_titulo", "EQUIVALENTE EM RAND (ZAR)"), M + 8, y + 7);

    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(107, 103, 120);
    doc.text(
      tx("pdf.zar_taxa", `Taxa: 1 MZN = ${Number(TAXA_CAMBIO_ZAR.valor).toFixed(4)} R  ·  actualizada em ${dataCambio}`, { valor: Number(TAXA_CAMBIO_ZAR.valor).toFixed(4), data: dataCambio }),
      M + 8, y + 13
    );

    // Linhas em colunas: Subtotal | Frete | Total | Sinal (sinal só se diferente do total)
    const colsList = [
      [tx("pdf.subtotal", "Subtotal"), mznParaZar(subtotal)],
      [tx("pdf.frete_pdf", "Frete"),   mznParaZar(dados.frete)],
      [tx("pdf.total", "Total"),       mznParaZar(total)],
    ];
    if (restante > 0) {
      colsList.push([tx("checkout.sinal", "Sinal"), mznParaZar(sinal)]);
    }
    const numCols = colsList.length;
    const colW = (W - M*2 - 16) / numCols;
    const colX = (i) => M + 8 + i * colW;

    colsList.forEach(([label, valor], i) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(107, 103, 120);
      doc.text(label.toUpperCase(), colX(i), y + 22);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(13, 12, 16);
      doc.text(formatarZAR(valor), colX(i), y + 29);
    });

    doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(150, 145, 165);
    doc.text(tx("pdf.zar_aviso", "Valores em ZAR são referência. Pagamento processado em Metical (MZN)."), M + 8, y + 35);

    y += 44;
  }

  // ── Prazo de entrega ───────────────────────────────────────
  if (dados.prazo && dados.prazo.min > 0) {
    doc.setFillColor(245, 243, 238);
    doc.roundedRect(M, y, W - M*2, 16, 2, 2, "F");
    doc.setFillColor(13, 12, 16);
    doc.roundedRect(M, y, 3, 16, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(107, 103, 120);
    doc.text(tx("pdf.prazo_label", "ENTREGA ESTIMADA"), M + 8, y + 6);

    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(13, 12, 16);
    doc.text(tx("pdf.dias_uteis", `${dados.prazo.min}–${dados.prazo.max} dias úteis`, { min: dados.prazo.min, max: dados.prazo.max }), M + 8, y + 12);

    if (dados.envio) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(107, 103, 120);
      doc.text(`${dados.envio.tipo} · ${dados.envio.detalhe}`, W - M - 4, y + 12, { align: "right" });
    }
    y += 20;
  }

  // ── Termos ─────────────────────────────────────────────────
  doc.setFillColor(248, 246, 252);
  doc.roundedRect(M, y, W - M*2, 28, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(68, 64, 79);
  doc.text(tx("pdf.termos_titulo", "TERMOS E CONDIÇÕES"), M + 5, y + 7);

  const termos = termosPagamentoTexto(carrinho);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(107, 103, 120);

  let linhaY = y + 13;
  termos.forEach(termo => {
    doc.text(`· ${termo}`, M + 5, linhaY);
    linhaY += 4.5;
  });
  if (dados.frete > 0) {
    doc.text(`· ${tx("pdf.frete_pago_sinal", "Frete pago no momento do pedido (junto ao sinal)")}`, M + 5, linhaY);
    linhaY += 4.5;
  }
  doc.text(`· ${tx("pdf.validade", "Cotação válida por 7 dias a partir da data de emissão")}`, M + 5, linhaY);

  // ── Rodapé ─────────────────────────────────────────────────
  doc.setFillColor(13, 12, 16);
  doc.rect(0, 278, W, 19, "F");
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 278, W, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text("LUMART", M, 290);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(107, 103, 120);
  doc.text(`WhatsApp: +${WHATSAPP_NUMERO}  ·  lumartcomercial.com`, W/2, 290, { align: "center" });
  doc.text(tx("pdf.slogan", "Traços que contam Histórias"), W - M, 290, { align: "right" });

  if (salvar) {
    const palavra = (typeof getLang === "function" && getLang() === "en") ? "Quote" : "Cotacao";
    const nome = `Lumart_${palavra}_${numCotacao.replace("#", "")}_${dados.nome.replace(/\s+/g, "_")}.pdf`;
    doc.save(nome);
  }
  return doc;
}
