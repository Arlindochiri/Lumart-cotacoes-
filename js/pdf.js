// ============================================================
//  LUMART — Geração de PDF e Integração WhatsApp
//  Usa jsPDF via CDN para criar cotações profissionais.
// ============================================================

// Número de cotação aleatório (baseado em timestamp)
function gerarNumeroCotacao() {
  return "#" + (Math.floor(Date.now() / 1000) % 10000).toString().padStart(4, "0");
}

// Data formatada em pt-MZ
function dataFormatada() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Validar formulário antes de gerar PDF
function validarFormulario() {
  const campos = [
    { id: "input-nome", label: "Nome completo" },
    { id: "input-telefone", label: "Telefone" },
    { id: "input-endereco", label: "Endereço de entrega" },
  ];

  for (const campo of campos) {
    const el = document.getElementById(campo.id);
    if (!el || !el.value.trim()) {
      el?.classList.add("erro");
      el?.focus();
      mostrarToast(`Preencha o campo: ${campo.label}`);
      return false;
    }
    el.classList.remove("erro");
  }

  if (carrinho.length === 0) {
    mostrarToast("Adicione pelo menos um produto à cotação.");
    return false;
  }

  return true;
}

// Obter dados do formulário
function obterDadosCliente() {
  return {
    nome: document.getElementById("input-nome")?.value.trim() || "",
    telefone: document.getElementById("input-telefone")?.value.trim() || "",
    endereco: document.getElementById("input-endereco")?.value.trim() || "",
    observacoes: document.getElementById("input-obs")?.value.trim() || "",
  };
}

// ─── Criar PDF profissional ───────────────────────────────────
function criarPDF(cliente, numeroCotacao, salvar = true) {
  if (typeof jspdf === "undefined" && typeof window.jspdf === "undefined") {
    mostrarToast("Biblioteca PDF não carregada. Verifique sua conexão.");
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210; // largura A4
  const margem = 18;
  const col2 = W / 2;
  let y = 0;

  // ── Cabeçalho ──────────────────────────────────────────────
  // Fundo azul escuro
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, W, 42, "F");

  // Logo "LUMART"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("LUMART", margem, 20);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 220);
  doc.text("Art Supplies — Traços que contam Histórias", margem, 28);

  // Número e data (à direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 220, 80);
  doc.text(`COTAÇÃO ${numeroCotacao}`, W - margem, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 240);
  doc.text(`Data: ${dataFormatada()}`, W - margem, 26, { align: "right" });

  y = 52;

  // ── Dados do Cliente ───────────────────────────────────────
  doc.setFillColor(245, 245, 252);
  doc.roundedRect(margem, y - 6, W - margem * 2, 38, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text("DADOS DO CLIENTE", margem + 4, y + 2);

  doc.setDrawColor(100, 90, 200);
  doc.setLineWidth(0.4);
  doc.line(margem + 4, y + 4, margem + 52, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 70);

  const dadosLinhas = [
    [`Nome:`, cliente.nome],
    [`Telefone:`, cliente.telefone],
    [`Endereço:`, cliente.endereco],
  ];

  dadosLinhas.forEach(([label, valor], i) => {
    const ly = y + 12 + i * 7;
    doc.setFont("helvetica", "bold");
    doc.text(label, margem + 4, ly);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margem + 26, ly);
  });

  if (cliente.observacoes) {
    y += 48;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 130);
    doc.text(`Obs: ${cliente.observacoes}`, margem + 4, y);
  } else {
    y += 42;
  }

  y += 8;

  // ── Tabela de Produtos ─────────────────────────────────────
  // Cabeçalho da tabela
  doc.setFillColor(30, 27, 75);
  doc.rect(margem, y, W - margem * 2, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("PRODUTO", margem + 4, y + 6);
  doc.text("QTD", margem + 98, y + 6, { align: "center" });
  doc.text("UNITÁRIO", margem + 124, y + 6, { align: "center" });
  doc.text("SUBTOTAL", W - margem - 4, y + 6, { align: "right" });

  y += 9;

  // Linhas dos produtos
  carrinho.forEach((item, i) => {
    const bg = i % 2 === 0 ? [255, 255, 255] : [247, 246, 255];
    doc.setFillColor(...bg);
    doc.rect(margem, y, W - margem * 2, 9, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 60);

    // Nome (truncar se muito longo)
    const nomeMax = item.nome.length > 44 ? item.nome.substring(0, 41) + "…" : item.nome;
    doc.text(nomeMax, margem + 4, y + 6);
    doc.text(String(item.qtd), margem + 98, y + 6, { align: "center" });
    doc.text(formatarMZN(item.preco), margem + 124, y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(formatarMZN(item.preco * item.qtd), W - margem - 4, y + 6, { align: "right" });

    y += 9;
  });

  // Linha divisória
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(margem, y + 2, W - margem, y + 2);

  y += 8;

  // ── Total ──────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75);
  doc.roundedRect(W - margem - 72, y, 72, 14, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 230);
  doc.text("TOTAL ESTIMADO", W - margem - 4, y + 5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 220, 80);
  doc.text(formatarMZN(calcularTotal()), W - margem - 4, y + 11.5, { align: "right" });

  y += 22;

  // ── Termos e Condições ─────────────────────────────────────
  doc.setFillColor(248, 248, 255);
  doc.roundedRect(margem, y, W - margem * 2, 28, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 27, 75);
  doc.text("TERMOS E CONDIÇÕES", margem + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);

  const termos = [
    "• Pagamento: 60% no momento do pedido e 40% na entrega.",
    "• Prazo de entrega: 13 a 30 dias úteis após confirmação do pedido.",
    "• Esta cotação é válida por 7 dias a partir da data de emissão.",
    "• Os preços podem sofrer alterações sem aviso prévio.",
  ];

  termos.forEach((linha, i) => {
    doc.text(linha, margem + 4, y + 14 + i * 5);
  });

  y += 36;

  // ── Rodapé ─────────────────────────────────────────────────
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 280, W, 17, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("LUMART Art Supplies", margem, 290);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 220);
  doc.text(`WhatsApp: +${WHATSAPP_NUMERO}  |  lumart.co.mz`, W / 2, 290, { align: "center" });
  doc.text("Elevating artistic commerce", W - margem, 290, { align: "right" });

  if (salvar) {
    const nomeArquivo = `Lumart_Cotacao_${numeroCotacao.replace("#", "")}_${cliente.nome.replace(/\s+/g, "_")}.pdf`;
    doc.save(nomeArquivo);
  }

  return doc;
}

// ─── Botão: Criar Cotação (PDF) ───────────────────────────────
function acaoCriarPDF() {
  if (!validarFormulario()) return;
  const cliente = obterDadosCliente();
  const numCotacao = gerarNumeroCotacao();
  criarPDF(cliente, numCotacao, true);
  mostrarToast("PDF gerado com sucesso!");
}

// ─── Botão: Enviar no WhatsApp ────────────────────────────────
function acaoEnviarWhatsApp() {
  if (!validarFormulario()) return;
  const cliente = obterDadosCliente();
  const numCotacao = gerarNumeroCotacao();

  // Gerar e baixar o PDF primeiro
  criarPDF(cliente, numCotacao, true);

  // Montar mensagem
  const linhasProdutos = carrinho
    .map((i) => `  • ${i.nome} × ${i.qtd} — ${formatarMZN(i.preco * i.qtd)}`)
    .join("\n");

  const mensagem =
    `Olá! Meu nome é *${cliente.nome}* e gostaria de confirmar a minha cotação ${numCotacao}.\n\n` +
    `*Produtos:*\n${linhasProdutos}\n\n` +
    `*Total estimado: ${formatarMZN(calcularTotal())}*\n\n` +
    `📍 Entrega: ${cliente.endereco}\n` +
    (cliente.observacoes ? `📝 Obs: ${cliente.observacoes}\n\n` : "\n") +
    `_Segue em anexo o PDF da cotação._`;

  const urlWA = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWA, "_blank");
}
