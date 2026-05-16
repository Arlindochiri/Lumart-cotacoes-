// ============================================================
//  LUMART — Conteúdo dos Modais (PT + EN)
//  ============================================================
//  Estrutura: MODAIS_CONTEUDO[lang][chave] = { titulo, icone, conteudo }
//  Editar livremente os textos. abrirModal() escolhe automaticamente
//  conforme getLang() do i18n.
// ============================================================

const MODAIS_CONTEUDO = {

  // ════════════════════════════════════════════════════════════
  //  PORTUGUÊS
  // ════════════════════════════════════════════════════════════
  pt: {

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
          <span class="marca-tag">Winsor &amp; Newton</span>
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
          📍 Estrada N102, Malehice · Chibuto, Gaza · Moçambique (CP 1208)<br/>
          🌐 lumartcomercial.com<br/>
          📧 lumartcomercial@gmail.com<br/>
          📱 WhatsApp: +258 87 823 7402
        </p>
      `,
    },

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
            <strong>Confirme o pagamento e receba em casa</strong>
            <p>Pague 100% dos produtos em stock (ou 75% como sinal para produtos sob encomenda) acrescido do frete. Para produtos sob encomenda, paga os restantes 25% na entrega.</p>
          </li>
        </ol>

        <div class="modal-callout">
          <strong>Tem dúvidas?</strong>
          <p>Fale connosco directamente pelo WhatsApp. Respondemos em até 48 horas.</p>
        </div>
      `,
    },

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
          <li><strong>Moçambique</strong>: 13 a 30 dias úteis</li>
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

    termos: {
      titulo: "Termos e Condições",
      icone: "§",
      conteudo: `
        <p class="modal-intro">
          Ao fazer uma cotação ou encomenda na Lumart Comercial, aceita os seguintes termos:
        </p>

        <h4>1. Sobre os pedidos</h4>
        <p>
          Os pedidos só são confirmados após o pagamento de <strong>100% do valor</strong> dos produtos
          em stock (ou <strong>75% como sinal</strong> para produtos sob encomenda) acrescido do
          valor total do frete. As cotações têm validade de <strong>7 dias</strong> a contar da data
          de emissão.
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
              para si — após o seu pagamento, iniciamos a importação. O prazo é maior (13–30 dias) mas o preço é mais
              competitivo.
            </p>
          </details>

          <details class="faq-item">
            <summary>Porque é que tenho de pagar adiantado?</summary>
            <p>
              Para produtos <strong>em stock</strong>, o pagamento de 100% no momento do pedido garante o
              produto e permite-nos preparar a entrega imediatamente. Para produtos <strong>sob encomenda</strong>,
              o sinal de 75% cobre os custos iniciais de importação. Como não temos uma loja física com showroom,
              este modelo permite-nos oferecer preços muito mais baixos que a concorrência tradicional.
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

  },


  // ════════════════════════════════════════════════════════════
  //  ENGLISH
  // ════════════════════════════════════════════════════════════
  en: {

    sobre: {
      titulo: "About Lumart",
      icone: "✦",
      conteudo: `
        <p class="modal-intro">
          <strong>Lumart Comercial</strong> is a Mozambican shop specialised in professional artistic supplies.
          We import directly from Asia and America the world's best brands for artists, students and studios in
          Mozambique and South Africa.
        </p>

        <h4>Our mission</h4>
        <p>
          To make premium-quality artistic tools accessible at fair prices, eliminating intermediaries and bringing
          them directly from the factory to your studio. Every product is curated for those who take the craft seriously.
        </p>

        <h4>Brands we represent</h4>
        <div class="modal-marcas">
          <span class="marca-tag">Winsor &amp; Newton</span>
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

        <h4>How we work</h4>
        <p>
          We operate a hybrid model: we keep stock of the most popular products for immediate shipping and import
          the more specialised or premium items on order. This approach lets us offer a broad catalogue with competitive
          prices, without inflating prices to cover huge warehouses.
        </p>

        <h4>Where to find us</h4>
        <p>
          📍 Estrada N102, Malehice · Chibuto, Gaza · Mozambique (PC 1208)<br/>
          🌐 lumartcomercial.com<br/>
          📧 lumartcomercial@gmail.com<br/>
          📱 WhatsApp: +258 87 823 7402
        </p>
      `,
    },

    comoFunciona: {
      titulo: "How it works",
      icone: "❶",
      conteudo: `
        <p class="modal-intro">
          Buying at Lumart is simple and secure. See the 4 steps of the process:
        </p>

        <ol class="modal-passos">
          <li>
            <strong>Pick products from the catalogue</strong>
            <p>Add the supplies you need to the cart. You can mix in-stock and pre-order products.</p>
          </li>
          <li>
            <strong>Fill in the quote form</strong>
            <p>Enter your name, phone and delivery address. Shipping is calculated automatically based on your destination.</p>
          </li>
          <li>
            <strong>Receive the quote by WhatsApp</strong>
            <p>After submitting, you receive a professional PDF and WhatsApp opens with the message pre-filled for our team.</p>
          </li>
          <li>
            <strong>Confirm payment and receive at home</strong>
            <p>Pay 100% for in-stock products (or 75% as a deposit for pre-order products) plus shipping. For pre-order products, you pay the remaining 25% on delivery.</p>
          </li>
        </ol>

        <div class="modal-callout">
          <strong>Got questions?</strong>
          <p>Talk to us directly on WhatsApp. We reply within 48 hours.</p>
        </div>
      `,
    },

    entrega: {
      titulo: "Delivery Policy",
      icone: "📦",
      conteudo: `
        <p class="modal-intro">
          We deliver throughout Mozambique and South Africa. Lead times vary depending on the type of product
          and the destination region.
        </p>

        <h4>In-stock products</h4>
        <ul class="modal-lista">
          <li><strong>Southern Mozambique</strong> (Maputo, Gaza, Inhambane): up to 3 working days · ground delivery via taxi drivers</li>
          <li><strong>Central and Northern zones</strong> (Sofala, Manica, Tete, Zambézia, Nampula, Cabo Delgado, Niassa): up to 7 working days · airmail via Mozambique post</li>
          <li><strong>South Africa</strong>: 7 to 14 working days · airmail via international post</li>
        </ul>

        <h4>Pre-order products</h4>
        <ul class="modal-lista">
          <li><strong>Mozambique</strong>: 13 to 30 working days</li>
          <li><strong>South Africa</strong>: 15 to 30 working days</li>
        </ul>
        <p>
          These products are imported directly from Asia or America after payment confirmation.
          We work without intermediate stock to offer better prices.
        </p>

        <h4>Shipping rates (in MZN)</h4>
        <h5>Mozambique:</h5>
        <ul class="modal-lista">
          <li>Maputo City / Maputo Province — 300 MT</li>
          <li>Gaza — 150 MT</li>
          <li>Inhambane — 450 MT</li>
          <li>Sofala — 850 MT · Manica — 950 MT · Tete — 1,100 MT</li>
          <li>Zambézia — 1,000 MT · Nampula — 1,200 MT</li>
          <li>Cabo Delgado / Niassa — 1,300 MT</li>
        </ul>
        <h5>South Africa:</h5>
        <ul class="modal-lista">
          <li>Gauteng — 1,200 MT</li>
          <li>KwaZulu-Natal / Mpumalanga — 1,400 MT</li>
          <li>Western Cape / Eastern Cape / Free State / Limpopo — 1,500 MT</li>
          <li>North West / Northern Cape — 1,600 MT</li>
        </ul>

        <h4>Mixed carts</h4>
        <p>
          When you buy in-stock and pre-order products in the same order, delivery is consolidated and
          the final lead time follows the slower product (pre-order).
        </p>
      `,
    },

    devolucao: {
      titulo: "Returns Policy",
      icone: "🔄",
      conteudo: `
        <p class="modal-intro">
          We take customer satisfaction seriously. See our exchange and return conditions:
        </p>

        <h4>When we accept returns</h4>
        <ul class="modal-lista">
          <li>Product delivered with a manufacturing defect</li>
          <li>Product different from what was ordered</li>
          <li>Product damaged during transport</li>
          <li>Expired product (in the case of paints and mediums)</li>
        </ul>

        <h4>How to request</h4>
        <ol class="modal-passos modal-passos-simples">
          <li>Contact us on WhatsApp within <strong>7 days</strong> of receipt</li>
          <li>Send clear photos of the issue</li>
          <li>Our team reviews and responds within 48h</li>
          <li>Once approved, we organise the pickup or exchange</li>
        </ol>

        <h4>Refunds</h4>
        <p>
          After validation, the refund is processed within <strong>5 working days</strong>, via the same method
          used for payment (M-Pesa, e-Mola, bank transfer, etc.).
        </p>

        <h4>We do not accept returns for:</h4>
        <ul class="modal-lista">
          <li>Opened or used products (except where a defect is proven)</li>
          <li>Pre-order products (custom imports)</li>
          <li>Orders older than 7 days from delivery</li>
        </ul>
      `,
    },

    termos: {
      titulo: "Terms and Conditions",
      icone: "§",
      conteudo: `
        <p class="modal-intro">
          By placing a quote or order at Lumart Comercial, you accept the following terms:
        </p>

        <h4>1. About orders</h4>
        <p>
          Orders are only confirmed after payment of <strong>100%</strong> for in-stock products
          (or <strong>75% as a deposit</strong> for pre-order products) plus the full shipping value.
          Quotes are valid for <strong>7 days</strong> from the date of issue.
        </p>

        <h4>2. Prices and payment methods</h4>
        <p>
          All prices are in <strong>Metical (MZN)</strong> and may change without notice.
          We accept payments via M-Pesa, e-Mola, m-Kesh, bank transfer (BCI, Millennium BIM),
          Binance and PayPal.
        </p>

        <h4>3. Deliveries</h4>
        <p>
          Delivery times are estimates based on normal transport conditions. Delays caused
          by force majeure (strikes, weather, customs delays) are not our responsibility,
          although we always do our best to minimise them.
        </p>

        <h4>4. Remaining payment</h4>
        <p>
          The remaining payment must be made at the time of delivery. In the event of refusal
          to accept the order after confirmation, the deposit is not refundable (it covers
          transport and import costs).
        </p>

        <h4>5. Data privacy</h4>
        <p>
          Personal data (name, phone, address) is used solely to process and deliver your order.
          We do not share it with third parties except with transport partners.
        </p>

        <h4>6. Images and descriptions</h4>
        <p>
          We do our best to present accurate product images. Small colour variations may occur
          due to screen calibration. Descriptions are based on manufacturer information.
        </p>

        <h4>7. Changes to the terms</h4>
        <p>
          These terms may be updated periodically. The version in force is always the one
          published on this site at the time of the order.
        </p>

        <p class="modal-rodape">
          <em>Last updated: <span class="ano-actual"></span> · For legal queries: lumartcomercial@gmail.com</em>
        </p>
      `,
    },

    faq: {
      titulo: "Frequently Asked Questions",
      icone: "?",
      conteudo: `
        <div class="faq-lista">

          <details class="faq-item">
            <summary>What's the difference between "In stock" and "Pre-order"?</summary>
            <p>
              <strong>In stock</strong> products are available for immediate shipping (1–14 days).
              <strong>Pre-order</strong> products are imported directly from Asia or America specifically
              for you — after your payment, we start the import. The lead time is longer (13–30 days) but
              the price is more competitive.
            </p>
          </details>

          <details class="faq-item">
            <summary>Why do I have to pay upfront?</summary>
            <p>
              For <strong>in-stock</strong> products, paying 100% at the time of order secures the product
              and allows us to prepare delivery immediately. For <strong>pre-order</strong> products,
              the 75% deposit covers the initial import costs. Since we don't have a physical showroom,
              this model lets us offer prices well below traditional competitors.
            </p>
          </details>

          <details class="faq-item">
            <summary>How do I pay Lumart?</summary>
            <p>
              We accept several methods: <strong>M-Pesa, e-Mola, m-Kesh</strong> (most common), bank transfer
              (BCI, Millennium BIM), and also <strong>Binance and PayPal</strong> for customers who prefer
              crypto or international payment. Details are shared after quote confirmation.
            </p>
          </details>

          <details class="faq-item">
            <summary>Can I see the product before buying?</summary>
            <p>
              We don't have a physical showroom, but every product has detailed photos (4 angles), full
              descriptions and customer reviews. For some products we also have demonstration videos.
              For further questions, contact us on WhatsApp.
            </p>
          </details>

          <details class="faq-item">
            <summary>Is shipping included in the price?</summary>
            <p>
              No. Shipping is calculated automatically at checkout, based on your address.
              For Maputo City it's 300 MT; other provinces range between 150 and 1,300 MT in Mozambique
              and 1,200 to 1,600 MT in South Africa.
            </p>
          </details>

          <details class="faq-item">
            <summary>Do you deliver outside Maputo and South Africa?</summary>
            <p>
              Within Mozambique we deliver to all 11 provinces. In South Africa, we deliver to all 9 provinces.
              For other countries, contact us directly — we can evaluate case by case.
            </p>
          </details>

          <details class="faq-item">
            <summary>The product arrived damaged. What now?</summary>
            <p>
              Contact us on WhatsApp within 7 days with photos of the issue. We assess and arrange exchange
              or refund according to our Returns Policy.
            </p>
          </details>

          <details class="faq-item">
            <summary>Can I cancel an order after paying?</summary>
            <p>
              For in-stock products, yes — as long as it hasn't been dispatched yet. For pre-order products,
              cancellation depends on the import stage. The deposit may not be refundable if the import
              process has already advanced.
            </p>
          </details>

        </div>
      `,
    },

  },

};

// ────────────────────────────────────────────────────────────
//  Renderizar e abrir um modal
// ────────────────────────────────────────────────────────────
function abrirModal(chave) {
  // Escolher idioma actual (com fallback para PT)
  const lang = (typeof getLang === "function") ? getLang() : "pt";
  const conteudoLang = MODAIS_CONTEUDO[lang] || MODAIS_CONTEUDO.pt;
  const dados = conteudoLang[chave] || MODAIS_CONTEUDO.pt[chave];
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
          <button class="modal-info-close" onclick="fecharModal()" data-i18n-aria-label="comum.fechar" aria-label="Fechar">
            <span class="lmi lmi-sm" aria-hidden="true">close</span>
          </button>
        </header>
        <div class="modal-info-body" id="modal-info-body"></div>
      </div>`;
    modal.addEventListener("click", e => {
      if (e.target === modal) fecharModal();
    });
    document.body.appendChild(modal);
  }

  // Guardar a chave actualmente aberta para re-render em mudança de idioma
  modal.dataset.chave = chave;

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

// Re-render quando o idioma muda (Fase 3D)
document.addEventListener("lumart:lang-changed", () => {
  const modal = document.getElementById("modal-info");
  if (modal?.classList.contains("aberto") && modal.dataset.chave) {
    // Re-abrir com a mesma chave no novo idioma
    abrirModal(modal.dataset.chave);
  }
});
