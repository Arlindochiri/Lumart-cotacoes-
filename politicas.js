// ============================================================
//  LUMART — Conteúdo dos Modais
//  ============================================================
//  Editar livremente o texto dos modais informativos.
// ============================================================

const MODAIS_CONTEUDO = {

  // ── SOBRE A EMPRESA ────────────────────────────────────────
  sobre: {
    titulo: "Sobre a Lumart",
    icone: "✦",
    conteudo: `
      <p class="modal-intro">
        A <strong>Lumart Comercial</strong> é uma loja moçambicana especializada em materiais artísticos profissionais.
        Importamos directamente da Ásia e América as melhores marcas mundiais para artistas, estudantes e ateliers em
        Moçambique e África do Sul.
      </p>

      <h4>A nossa missão</h4>
      <p>
        Dar acesso a ferramentas artísticas de qualidade premium a preços justos, eliminando intermediários e trazendo
        directamente da fábrica para o seu estúdio. Cada produto é seleccionado a pensar em quem leva o ofício a sério.
      </p>

      <h4>Marcas que representamos</h4>
      <div class="modal-marcas">
        <span class="marca-tag">Winsor & Newton</span>
        <span class="marca-tag">Faber-Castell</span>
        <span class="marca-tag">Canson</span>
        <span class="marca-tag">Fabriano</span>
        <span class="marca-tag">Liquitex</span>
        <span class="marca-tag">Bruynzeel</span>
        <span class="marca-tag">Marie's</span>
        <span class="marca-tag">Giorgione</span>
        <span class="marca-tag">Khinsun</span>
        <span class="marca-tag">General's</span>
        <span class="marca-tag">Kalour</span>
        <span class="marca-tag">Staedtler</span>
        <span class="marca-tag">Corfix</span>
        <span class="marca-tag">Trident</span>
      </div>

      <h4>Como trabalhamos</h4>
      <p>
        Operamos num modelo híbrido: mantemos stock dos produtos mais populares para envio imediato e importamos sob
        encomenda os artigos mais especializados ou premium. Esta abordagem permite-nos oferecer um catálogo amplo
        com preços competitivos, sem que tenhamos de inflacionar preços para cobrir armazéns enormes.
      </p>

      <h4>Onde nos pode encontrar</h4>
      <p>
        🌐 lumartcomercial.com<br/>
        📧 lumartcomercial@gmail.com<br/>
        📱 WhatsApp: +258 87 823 7402
      </p>
    `,
  },

  // ── COMO FUNCIONA ──────────────────────────────────────────
  comoFunciona: {
    titulo: "Como funciona",
    icone: "❶",
    conteudo: `
      <p class="modal-intro">
        Comprar na Lumart é simples e seguro. Veja os 4 passos do processo:
      </p>

      <ol class="modal-passos">
        <li>
          <strong>Escolha os produtos no catálogo</strong>
          <p>Adicione ao carrinho os materiais que precisar. Pode misturar produtos em stock e produtos sob encomenda.</p>
        </li>
        <li>
          <strong>Preencha o formulário de cotação</strong>
          <p>Indique o seu nome, telefone e endereço de entrega. O frete é calculado automaticamente conforme o destino.</p>
        </li>
        <li>
          <strong>Receba a cotação por WhatsApp</strong>
          <p>Após enviar, recebe um PDF profissional e abre o WhatsApp com a mensagem pré-preenchida para a nossa equipa.</p>
        </li>
        <li>
          <strong>Confirme com o sinal e receba em casa</strong>
          <p>Pague o sinal (60% para produtos em stock, 75% para produtos sob encomenda + frete) e o restante na entrega.</p>
        </li>
      </ol>

      <div class="modal-callout">
        <strong>Tem dúvidas?</strong>
        <p>Fale connosco directamente pelo WhatsApp. Respondemos em até 48 horas.</p>
      </div>
    `,
  },

  // ── POLÍTICA DE ENTREGA ────────────────────────────────────
  entrega: {
    titulo: "Política de Entrega",
    icone: "📦",
    conteudo: `
      <p class="modal-intro">
        Entregamos em todo Moçambique e África do Sul. Os prazos variam conforme o tipo de produto
        e a região de destino.
      </p>

      <h4>Produtos em Stock</h4>
      <ul class="modal-lista">
        <li><strong>Zona Sul de Moçambique</strong> (Maputo, Gaza, Inhambane): até 3 dias úteis · entrega terrestre via taxistas</li>
        <li><strong>Zona Centro e Norte</strong> (Sofala, Manica, Tete, Zambézia, Nampula, Cabo Delgado, Niassa): até 7 dias úteis · entrega aérea via correios de Moçambique</li>
        <li><strong>África do Sul</strong>: 7 a 14 dias úteis · entrega aérea via correios internacionais</li>
      </ul>

      <h4>Produtos Sob Encomenda</h4>
      <ul class="modal-lista">
        <li><strong>Moçambique</strong>: 10 a 30 dias úteis</li>
        <li><strong>África do Sul</strong>: 15 a 30 dias úteis</li>
      </ul>
      <p>
        Estes produtos são importados directamente da Ásia ou América após confirmação do pagamento.
        Trabalhamos sem stocks intermediários para oferecer melhores preços.
      </p>

      <h4>Tarifas de envio (em MZN)</h4>
      <h5>Moçambique:</h5>
      <ul class="modal-lista">
        <li>Maputo Cidade / Maputo Província — 300 MT</li>
        <li>Gaza — 150 MT</li>
        <li>Inhambane — 450 MT</li>
        <li>Sofala — 850 MT · Manica — 950 MT · Tete — 1.100 MT</li>
        <li>Zambézia — 1.000 MT · Nampula — 1.200 MT</li>
        <li>Cabo Delgado / Niassa — 1.300 MT</li>
      </ul>
      <h5>África do Sul:</h5>
      <ul class="modal-lista">
        <li>Gauteng — 1.200 MT</li>
        <li>KwaZulu-Natal / Mpumalanga — 1.400 MT</li>
        <li>Western Cape / Eastern Cape / Free State / Limpopo — 1.500 MT</li>
        <li>North West / Northern Cape — 1.600 MT</li>
      </ul>

      <h4>Carrinhos mistos</h4>
      <p>
        Quando compra produtos em stock e produtos sob encomenda no mesmo pedido, a entrega é feita
        em conjunto e o prazo final será o do produto mais lento (sob encomenda).
      </p>
    `,
  },

  // ── POLÍTICA DE DEVOLUÇÃO ──────────────────────────────────
  devolucao: {
    titulo: "Política de Devolução",
    icone: "🔄",
    conteudo: `
      <p class="modal-intro">
        Levamos a sério a satisfação dos nossos clientes. Veja as nossas condições de troca e devolução:
      </p>

      <h4>Quando aceitamos devoluções</h4>
      <ul class="modal-lista">
        <li>Produto entregue com defeito de fabrico</li>
        <li>Produto diferente do encomendado</li>
        <li>Produto danificado durante o transporte</li>
        <li>Produto fora da validade (no caso de tintas e mediums)</li>
      </ul>

      <h4>Como solicitar</h4>
      <ol class="modal-passos modal-passos-simples">
        <li>Contacte-nos pelo WhatsApp num prazo máximo de <strong>7 dias</strong> após a recepção</li>
        <li>Envie fotos claras do problema</li>
        <li>A nossa equipa avalia e responde em até 48h</li>
        <li>Após aprovação, organizamos a recolha ou troca</li>
      </ol>

      <h4>Reembolsos</h4>
      <p>
        Após validação, o reembolso é processado em até <strong>5 dias úteis</strong>, pelo mesmo método
        usado no pagamento (M-Pesa, e-Mola, transferência bancária, etc.).
      </p>

      <h4>Não aceitamos devoluções de:</h4>
      <ul class="modal-lista">
        <li>Produtos abertos ou usados (excepto defeito comprovado)</li>
        <li>Produtos sob encomenda (importações personalizadas)</li>
        <li>Pedidos com mais de 7 dias de entrega</li>
      </ul>
    `,
  },

  // ── TERMOS E CONDIÇÕES ─────────────────────────────────────
  termos: {
    titulo: "Termos e Condições",
    icone: "§",
    conteudo: `
      <p class="modal-intro">
        Ao fazer uma cotação ou encomenda na Lumart Comercial, aceita os seguintes termos:
      </p>

      <h4>1. Sobre os pedidos</h4>
      <p>
        Os pedidos só são confirmados após o pagamento do sinal (60% para produtos em stock,
        75% para produtos sob encomenda) acrescido do valor total do frete. As cotações têm
        validade de <strong>7 dias</strong> a contar da data de emissão.
      </p>

      <h4>2. Preços e formas de pagamento</h4>
      <p>
        Todos os preços estão em <strong>Metical (MZN)</strong> e podem ser alterados sem aviso prévio.
        Aceitamos pagamentos via M-Pesa, e-Mola, m-Kesh, transferência bancária (BCI, Millennium BIM),
        Binance e PayPal.
      </p>

      <h4>3. Entregas</h4>
      <p>
        Os prazos de entrega são estimativas baseadas em condições normais de transporte. Atrasos
        causados por força maior (greves, condições climatéricas, atrasos alfandegários) não são da
        nossa responsabilidade, embora façamos sempre o possível para os minimizar.
      </p>

      <h4>4. Restante do pagamento</h4>
      <p>
        O pagamento do valor restante deve ser feito no momento da entrega. Em caso de recusa em
        receber a encomenda após confirmação, o sinal não é reembolsável (cobre os custos de transporte
        e importação).
      </p>

      <h4>5. Privacidade dos dados</h4>
      <p>
        Os dados pessoais (nome, telefone, endereço) são usados exclusivamente para processar e
        entregar a sua encomenda. Não partilhamos com terceiros excepto com os parceiros de transporte.
      </p>

      <h4>6. Imagens e descrições</h4>
      <p>
        Fazemos o possível para apresentar imagens fiéis aos produtos. Pequenas variações de cor podem
        ocorrer devido a calibração de ecrãs. As descrições são baseadas em informação dos fabricantes.
      </p>

      <h4>7. Alterações aos termos</h4>
      <p>
        Estes termos podem ser actualizados periodicamente. A versão em vigor é sempre a publicada
        neste site no momento da encomenda.
      </p>

      <p class="modal-rodape">
        <em>Última actualização: <span class="ano-actual"></span> · Para questões legais: lumartcomercial@gmail.com</em>
      </p>
    `,
  },

  // ── FAQ ────────────────────────────────────────────────────
  faq: {
    titulo: "Perguntas Frequentes",
    icone: "?",
    conteudo: `
      <div class="faq-lista">

        <details class="faq-item">
          <summary>Qual a diferença entre "Em stock" e "Sob encomenda"?</summary>
          <p>
            <strong>Em stock</strong> são produtos que temos disponíveis para envio imediato (entrega em 1–14 dias).
            <strong>Sob encomenda</strong> são produtos que importamos directamente da Ásia ou América especificamente
            para si — após o seu pagamento, iniciamos a importação. O prazo é maior (10–30 dias) mas o preço é mais
            competitivo.
          </p>
        </details>

        <details class="faq-item">
          <summary>Porque é que tenho de pagar uma parte adiantada?</summary>
          <p>
            O sinal (60% para stock, 75% para sob encomenda) cobre os custos iniciais — transporte, importação,
            embalagem. Como não temos uma loja física com showroom, este modelo permite-nos oferecer preços muito
            mais baixos que a concorrência tradicional.
          </p>
        </details>

        <details class="faq-item">
          <summary>Como pago a Lumart?</summary>
          <p>
            Aceitamos vários métodos: <strong>M-Pesa, e-Mola, m-Kesh</strong> (mais comuns), transferência bancária
            (BCI, Millennium BIM), e ainda <strong>Binance e PayPal</strong> para clientes que preferem cripto ou
            pagamento internacional. Os dados são partilhados após confirmação da cotação.
          </p>
        </details>

        <details class="faq-item">
          <summary>Posso ver o produto antes de comprar?</summary>
          <p>
            Não temos showroom físico, mas todos os produtos têm fotos detalhadas (4 ângulos), descrições completas
            e avaliações de outros clientes. Para alguns produtos disponibilizamos vídeos demonstrativos.
            Para questões adicionais, fale connosco no WhatsApp.
          </p>
        </details>

        <details class="faq-item">
          <summary>O frete está incluído no preço?</summary>
          <p>
            Não. O frete é calculado automaticamente no momento do checkout, com base no seu endereço.
            Para Maputo Cidade são 300 MT; outras províncias variam entre 150 e 1.300 MT em Moçambique
            e 1.200 a 1.600 MT em África do Sul.
          </p>
        </details>

        <details class="faq-item">
          <summary>Entregam fora de Maputo e da África do Sul?</summary>
          <p>
            Em Moçambique entregamos em todas as 11 províncias. Na África do Sul, entregamos nas 9 províncias.
            Para outros países, contacte-nos directamente — podemos avaliar caso a caso.
          </p>
        </details>

        <details class="faq-item">
          <summary>O produto chegou estragado. O que fazer?</summary>
          <p>
            Contacte-nos pelo WhatsApp em até 7 dias com fotos do problema. Avaliamos e organizamos a troca ou
            reembolso conforme a nossa Política de Devolução.
          </p>
        </details>

        <details class="faq-item">
          <summary>Posso cancelar uma encomenda depois de pagar?</summary>
          <p>
            Para produtos em stock, sim — desde que ainda não tenha sido despachada. Para produtos sob encomenda,
            o cancelamento depende da fase em que estiver a importação. O sinal pode não ser reembolsável caso o
            processo de importação já tenha avançado.
          </p>
        </details>

      </div>
    `,
  },

};

// ────────────────────────────────────────────────────────────
//  Renderizar e abrir um modal
// ────────────────────────────────────────────────────────────
function abrirModal(chave) {
  const dados = MODAIS_CONTEUDO[chave];
  if (!dados) return;

  let modal = document.getElementById("modal-info");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-info";
    modal.className = "modal-info-overlay";
    modal.innerHTML = `
      <div class="modal-info-box" onclick="event.stopPropagation()">
        <header class="modal-info-header">
          <span class="modal-info-icon" id="modal-info-icon"></span>
          <h2 class="modal-info-titulo" id="modal-info-titulo"></h2>
          <button class="modal-info-close" onclick="fecharModal()" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>
        <div class="modal-info-body" id="modal-info-body"></div>
      </div>`;
    modal.addEventListener("click", e => {
      if (e.target === modal) fecharModal();
    });
    document.body.appendChild(modal);
  }

  document.getElementById("modal-info-icon").textContent   = dados.icone;
  document.getElementById("modal-info-titulo").textContent = dados.titulo;
  document.getElementById("modal-info-body").innerHTML     = dados.conteudo;

  // Preencher ano dinâmico em qualquer .ano-actual no modal
  document.querySelectorAll("#modal-info-body .ano-actual").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // Scroll body para topo
  document.getElementById("modal-info-body").scrollTop = 0;

  modal.classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharModal() {
  document.getElementById("modal-info")?.classList.remove("aberto");
  document.body.style.overflow = "";
}

// Fechar com ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") fecharModal();
});
