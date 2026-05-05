// ============================================================
//  LUMART COMERCIAL — Catálogo + Configurações Globais
//  ============================================================
//  Este ficheiro contém:
//    1. Lista de produtos (PRODUTOS)
//    2. Configurações de envio (FRETE)
//    3. Configurações de prazos (PRAZOS)
//    4. Configurações de pagamento (PAGAMENTO_REGRAS)
//    5. Funções utilitárias (formatarMZN, calcularPrazoEntrega, etc.)
// ============================================================


// ════════════════════════════════════════════════════════════
//  1. CATÁLOGO DE PRODUTOS
// ════════════════════════════════════════════════════════════
//
//  Campos:
//    id              — número único do produto
//    nome            — nome de exibição
//    marca           — fabricante
//    categoria       — categoria (Aquarelas, Pincéis, etc.)
//    preco           — preço em MZN
//    desconto        — percentagem de desconto (0 = sem desconto)
//    imagens         — array com 4 URLs de imagens
//    video           — ID do vídeo no YouTube (string vazia se não tiver)
//    descricao       — descrição detalhada do produto
//    disponibilidade — "disponivel" (em stock) | "sob_encomenda" (importado)
//    destaque        — true se for produto em destaque
//    reviews         — array de avaliações fictícias
// ════════════════════════════════════════════════════════════

const PRODUTOS = [

  // ── 1. ESTOJO AQUARELA W&N (sob encomenda) ────────────────
  {
    id: 1,
    nome: "Estojo Aquarela Profissional 24 Cores",
    marca: "Winsor & Newton",
    categoria: "Aquarelas",
    preco: 289.90,
    desconto: 0,
    disponibilidade: "sob_encomenda",
    destaque: true,
    imagens: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=85",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=85",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=85",
      "https://images.unsplash.com/photo-1579541591970-e5cf28d3e5a3?w=800&q=85",
    ],
    video: "dQw4w9WgXcQ", // placeholder — substituir pelo ID real
    descricao: "Estojo profissional Winsor & Newton com 24 cores de aquarela em pastilhas. Pigmentos de alta concentração e excelente reactividade com água. Inclui pincel reservatório e paleta integrada na tampa. Ideal para aguarelistas profissionais e estudantes avançados que procuram cores vibrantes e duradouras.",
    reviews: [
      { nome: "Hélio Macuácua",  estrelas: 5, data: "2024-09-12", comentario: "Cores incríveis, muito vibrantes mesmo. Vale cada metical." },
      { nome: "Carla Tembe",     estrelas: 5, data: "2024-08-23", comentario: "Excelente qualidade. As cores misturam muito bem e a saturação é fantástica." },
      { nome: "Bruno Nhantumbo", estrelas: 4, data: "2024-07-05", comentario: "Estojo lindo, único reparo é o tempo de envio. Mas os produtos compensam." },
    ],
  },

  // ── 2. KIT PINCÉIS (sob encomenda) ────────────────────────
  {
    id: 2,
    nome: "Kit Pincéis Sintéticos Marta 5 Peças",
    marca: "Keramik",
    categoria: "Pincéis",
    preco: 85.50,
    desconto: 10,
    disponibilidade: "sob_encomenda",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
      "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&q=85",
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=85",
      "https://images.unsplash.com/photo-1598367139364-5b3a6e9a6e8f?w=800&q=85",
    ],
    video: "",
    descricao: "Kit profissional com 5 pincéis sintéticos de marta, ideais para aquarela e tintas a água. Tamanhos variados (2, 4, 6, 8 e 10), com cabos ergonómicos em madeira lacada. Ferrolho de alumínio anti-corrosivo. Mantém a forma após inúmeras lavagens.",
    reviews: [
      { nome: "Sandra Mate",     estrelas: 5, data: "2024-10-02", comentario: "Pincéis de qualidade impressionante para o preço. Recomendo muito." },
      { nome: "André Cossa",     estrelas: 4, data: "2024-08-19", comentario: "Bons pincéis, cabo confortável. Estou a usar há 3 meses sem problemas." },
    ],
  },

  // ── 3. TELA PAINEL (DISPONÍVEL) ───────────────────────────
  {
    id: 3,
    nome: "Tela Painel Algodão 50×70cm",
    marca: "Souza",
    categoria: "Telas",
    preco: 42.90,
    desconto: 0,
    disponibilidade: "disponivel",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85",
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=85",
    ],
    video: "",
    descricao: "Tela painel em algodão 100% natural, montada sobre chassis de madeira reforçado. Tamanho 50×70cm, com tripla camada de gesso acrílico para superfície uniforme. Adequada para óleo, acrílico e técnicas mistas. Pronta para uso imediato.",
    reviews: [
      { nome: "Joana Sitoe",     estrelas: 5, data: "2024-10-15", comentario: "Excelente qualidade, chega bem embalada e a textura é óptima para óleo." },
      { nome: "Miguel Chissano", estrelas: 4, data: "2024-09-28", comentario: "Boa relação qualidade-preço. Uso para os meus trabalhos académicos." },
      { nome: "Patricia Massingue", estrelas: 5, data: "2024-09-10", comentario: "Comprei várias e todas chegaram em perfeito estado. Muito boa para o preço." },
    ],
  },

  // ── 4. TINTA ÓLEO (DISPONÍVEL) ────────────────────────────
  {
    id: 4,
    nome: "Tinta Óleo Clássica 37ml — Branco Titânio",
    marca: "Corfix",
    categoria: "Tintas",
    preco: 22.00,
    desconto: 0,
    disponibilidade: "disponivel",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85",
      "https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=800&q=85",
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
    ],
    video: "",
    descricao: "Tinta a óleo de qualidade estudante Corfix, cor Branco de Titânio. Tubo de 37ml com pigmento opaco de alta cobertura. Excelente para misturas e clareamento. Secagem normal entre 3-5 dias dependendo da espessura aplicada.",
    reviews: [
      { nome: "Rui Mondlane",    estrelas: 4, data: "2024-10-08", comentario: "Boa cobertura, secagem dentro do prazo esperado." },
      { nome: "Lucia Chambal",   estrelas: 5, data: "2024-09-15", comentario: "Branco bem opaco, óptimo para os meus highlights." },
    ],
  },

  // ── 5. SKETCHBOOK CANSON (DISPONÍVEL) ─────────────────────
  {
    id: 5,
    nome: "Sketchbook Artbook One 100g 100 Folhas",
    marca: "Canson",
    categoria: "Cadernos",
    preco: 58.00,
    desconto: 5,
    disponibilidade: "disponivel",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=85",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=85",
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=85",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=85",
    ],
    video: "",
    descricao: "Sketchbook Canson Artbook One com 100 folhas de papel branco 100g/m². Capa preta resistente, costura cosida que abre 180°. Ideal para esboços a lápis, caneta, fineliner e marcadores leves. Tamanho A5, perfeito para levar na mochila.",
    reviews: [
      { nome: "Telma Magaia",    estrelas: 5, data: "2024-10-20", comentario: "Papel óptimo, marcadores não passam para o outro lado. Adoro." },
      { nome: "Ivan Ngoenha",    estrelas: 4, data: "2024-10-01", comentario: "Bom caderno, abre bem e o tamanho é prático." },
      { nome: "Rita Boane",      estrelas: 5, data: "2024-09-12", comentario: "Comprei 3, levo sempre comigo. Qualidade Canson de sempre." },
    ],
  },

  // ── 6. CAVALETE TRIDENT (sob encomenda) ───────────────────
  {
    id: 6,
    nome: "Cavalete Estúdio Trident Modelo 120",
    marca: "Trident",
    categoria: "Cavaletes",
    preco: 450.00,
    desconto: 15,
    disponibilidade: "sob_encomenda",
    destaque: true,
    imagens: [
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=85",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=85",
    ],
    video: "dQw4w9WgXcQ", // placeholder
    descricao: "Cavalete de estúdio Trident Modelo 120, em madeira maciça de eucalipto tratado. Suporta telas até 120cm de altura. Inclinação ajustável de 0° a 90°, base com rodízios. Acabamento envernizado resistente. Ideal para artistas profissionais e ateliers.",
    reviews: [
      { nome: "Eduardo Mavie",   estrelas: 5, data: "2024-08-30", comentario: "Cavalete robusto, vale o investimento. Esperei 3 semanas mas chegou perfeito." },
      { nome: "Sofia Mucavele",  estrelas: 5, data: "2024-07-22", comentario: "Excelente qualidade de construção. Recomendo a todos os artistas profissionais." },
    ],
  },

  // ── 7. PASTÉIS FABER-CASTELL (sob encomenda) ──────────────
  {
    id: 7,
    nome: "Conjunto Pastéis Secos Soft 48 Cores",
    marca: "Faber-Castell",
    categoria: "Pastéis",
    preco: 175.00,
    desconto: 0,
    disponibilidade: "sob_encomenda",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800&q=85",
      "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
      "https://images.unsplash.com/photo-1579541591970-e5cf28d3e5a3?w=800&q=85",
    ],
    video: "",
    descricao: "Conjunto de 48 pastéis secos soft Faber-Castell, com pigmentos de alta qualidade. Cores vibrantes e fáceis de misturar. Ideal para retrato, paisagem e ilustração. Embalagem original com protecção individual para cada pastel.",
    reviews: [
      { nome: "Cristina Nhampossa", estrelas: 5, data: "2024-09-05", comentario: "Pastéis cremosos, misturam que é uma maravilha. Estou apaixonada." },
      { nome: "João Manhiça",       estrelas: 4, data: "2024-08-14", comentario: "Boa selecção de cores, qualidade Faber-Castell garantida." },
    ],
  },

  // ── 8. PAPEL AQUARELA FABRIANO (DISPONÍVEL) ───────────────
  {
    id: 8,
    nome: "Papel Aquarela Algodão 300g A3 — 10 Folhas",
    marca: "Fabriano",
    categoria: "Papéis",
    preco: 94.00,
    desconto: 0,
    disponibilidade: "disponivel",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=85",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=85",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=85",
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=85",
    ],
    video: "",
    descricao: "Papel aquarela Fabriano 100% algodão, 300g/m², tamanho A3. Pacote com 10 folhas de textura cold-press (grão fino). Suporta múltiplas camadas de água sem deformar. Padrão internacional de excelência para aquarelistas profissionais.",
    reviews: [
      { nome: "Mariana Cuna",    estrelas: 5, data: "2024-10-25", comentario: "O melhor papel que já usei. Aceita água como ninguém." },
      { nome: "Pedro Macamo",    estrelas: 5, data: "2024-09-18", comentario: "Fabriano é Fabriano. Não deforma, não pinota, perfeito." },
      { nome: "Helena Sigauque", estrelas: 4, data: "2024-08-30", comentario: "Excelente qualidade, único defeito é o preço — mas vale." },
    ],
  },

  // ── 9. MEDIUM LIQUITEX (sob encomenda) ────────────────────
  {
    id: 9,
    nome: "Medium & Verniz Gloss 250ml",
    marca: "Liquitex",
    categoria: "Acessórios",
    preco: 67.50,
    desconto: 0,
    disponibilidade: "sob_encomenda",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1615529162924-f8605388461d?w=800&q=85",
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=85",
      "https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=800&q=85",
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=85",
    ],
    video: "",
    descricao: "Medium e verniz gloss Liquitex 250ml. Multifuncional: pode ser usado como medium para diluir tintas acrílicas mantendo a viscosidade, ou como verniz final para dar acabamento brilhante. Não amarelece com o tempo, secagem rápida.",
    reviews: [
      { nome: "Albertina Mucache", estrelas: 5, data: "2024-08-12", comentario: "Produto versátil, uso tanto como medium quanto como verniz final." },
      { nome: "Filipe Tivane",     estrelas: 4, data: "2024-07-18", comentario: "Boa qualidade, brilho duradouro. Recomendo." },
    ],
  },

  // ── 10. LÁPIS BRUYNZEEL (DISPONÍVEL) ──────────────────────
  {
    id: 10,
    nome: "Lápis Aquareláveis 36 Cores",
    marca: "Bruynzeel",
    categoria: "Lápis",
    preco: 139.90,
    desconto: 8,
    disponibilidade: "disponivel",
    destaque: false,
    imagens: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=85",
      "https://images.unsplash.com/photo-1579541591970-e5cf28d3e5a3?w=800&q=85",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800&q=85",
    ],
    video: "",
    descricao: "Conjunto de 36 lápis aquareláveis Bruynzeel Design. Mina macia de alta pigmentação que dissolve uniformemente em água. Ideal para ilustração botânica, retrato e técnicas mistas. Embalagem em estojo metálico resistente.",
    reviews: [
      { nome: "Vânia Massango",  estrelas: 5, data: "2024-10-30", comentario: "Lápis fantásticos, dissolvem super bem com água. Adorei." },
      { nome: "Carlos Nhamirre", estrelas: 5, data: "2024-10-05", comentario: "Estojo lindo, cores vibrantes. Excelente compra." },
      { nome: "Beatriz Cumbe",   estrelas: 4, data: "2024-09-20", comentario: "Boa qualidade para o preço. Recomendo a iniciantes e intermédios." },
    ],
  },

];


// ════════════════════════════════════════════════════════════
//  2. CATEGORIAS (gerado automaticamente)
// ════════════════════════════════════════════════════════════
const CATEGORIAS = ["Todos", ...new Set(PRODUTOS.map(p => p.categoria))];


// ════════════════════════════════════════════════════════════
//  3. CONFIGURAÇÕES DA LOJA
// ════════════════════════════════════════════════════════════
const WHATSAPP_NUMERO = "258878237402"; // ← Alterar para o número real (sem espaços/símbolos)


// ════════════════════════════════════════════════════════════
//  4. TABELA DE FRETE (em MZN)
// ════════════════════════════════════════════════════════════
//  Estrutura por país → província/região
//  Para editar valores, basta mudar o número correspondente.
// ════════════════════════════════════════════════════════════

const FRETE = {

  MZ: {
    // Zona Sul — entrega terrestre via taxistas
    "Maputo Cidade":     300,
    "Maputo Província":  300,
    "Gaza":              150,
    "Inhambane":         450,

    // Zona Centro/Norte — entrega aérea via correios MZ
    "Sofala":            850,
    "Manica":            950,
    "Tete":              1100,
    "Zambézia":          1000,
    "Nampula":           1200,
    "Cabo Delgado":      1300,
    "Niassa":            1300,
  },

  ZA: {
    // África do Sul — correios internacionais aéreos
    "Gauteng":           1200,
    "Western Cape":      1500,
    "KwaZulu-Natal":     1400,
    "Eastern Cape":      1500,
    "Free State":        1500,
    "Mpumalanga":        1400,
    "Limpopo":           1500,
    "North West":        1600,
    "Northern Cape":     1600,
  },

};


// ════════════════════════════════════════════════════════════
//  5. ZONAS DE ENTREGA (mapeamento província → zona)
// ════════════════════════════════════════════════════════════
//  Usado para calcular prazo de entrega.
// ════════════════════════════════════════════════════════════

const ZONAS_ENTREGA = {

  // Moçambique — Zona Sul
  "Maputo Cidade":     "MZ-sul",
  "Maputo Província":  "MZ-sul",
  "Gaza":              "MZ-sul",
  "Inhambane":         "MZ-sul",

  // Moçambique — Zona Centro
  "Sofala":            "MZ-centro",
  "Manica":            "MZ-centro",
  "Tete":              "MZ-centro",
  "Zambézia":          "MZ-centro",

  // Moçambique — Zona Norte
  "Nampula":           "MZ-norte",
  "Cabo Delgado":      "MZ-norte",
  "Niassa":            "MZ-norte",

  // África do Sul (toda como uma só zona)
  "Gauteng":           "ZA",
  "Western Cape":      "ZA",
  "KwaZulu-Natal":     "ZA",
  "Eastern Cape":      "ZA",
  "Free State":        "ZA",
  "Mpumalanga":        "ZA",
  "Limpopo":           "ZA",
  "North West":        "ZA",
  "Northern Cape":     "ZA",

};


// ════════════════════════════════════════════════════════════
//  6. PRAZOS DE ENTREGA (em dias úteis)
// ════════════════════════════════════════════════════════════
//  Estrutura: PRAZOS[disponibilidade][zona] = { min, max }
// ════════════════════════════════════════════════════════════

const PRAZOS = {

  disponivel: {
    "MZ-sul":     { min: 1,  max: 3  },
    "MZ-centro":  { min: 5,  max: 7  },
    "MZ-norte":   { min: 5,  max: 7  },
    "ZA":         { min: 7,  max: 14 },
  },

  sob_encomenda: {
    "MZ-sul":     { min: 10, max: 30 },
    "MZ-centro":  { min: 10, max: 30 },
    "MZ-norte":   { min: 10, max: 30 },
    "ZA":         { min: 15, max: 30 },
  },

};


// ════════════════════════════════════════════════════════════
//  7. REGRAS DE PAGAMENTO
// ════════════════════════════════════════════════════════════
//  Percentagem do sinal (a pagar no momento do pedido).
//  O restante é pago na entrega.
// ════════════════════════════════════════════════════════════

const PAGAMENTO_REGRAS = {
  disponivel:    { sinal: 0.60, restante: 0.40 }, // 60% / 40%
  sob_encomenda: { sinal: 0.75, restante: 0.25 }, // 75% / 25%
};


// ════════════════════════════════════════════════════════════
//  8. PAÍSES DISPONÍVEIS
// ════════════════════════════════════════════════════════════

const PAISES = {
  MZ: {
    nome: "Moçambique",
    bandeira: "🇲🇿",
    moeda: "MZN",
    provincias: [
      "Maputo Cidade", "Maputo Província", "Gaza", "Inhambane",
      "Sofala", "Manica", "Tete", "Zambézia",
      "Nampula", "Cabo Delgado", "Niassa",
    ],
  },
  ZA: {
    nome: "África do Sul",
    bandeira: "🇿🇦",
    moeda: "MZN", // continuamos a cobrar em MZN
    provincias: [
      "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
      "Free State", "Mpumalanga", "Limpopo", "North West", "Northern Cape",
    ],
  },
};


// ════════════════════════════════════════════════════════════
//  9. FUNÇÕES UTILITÁRIAS
// ════════════════════════════════════════════════════════════

/**
 * Formata um valor numérico em MZN.
 * Ex: 1234.5 → "MZN 1.234,50"
 */
function formatarMZN(valor) {
  return "MZN\u00a0" + Number(valor).toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Calcula o preço final de um produto, aplicando desconto se houver.
 */
function precoComDesconto(produto) {
  if (!produto.desconto || produto.desconto <= 0) return produto.preco;
  return produto.preco * (1 - produto.desconto / 100);
}

/**
 * Devolve a zona de entrega ("MZ-sul", "MZ-centro", "MZ-norte", "ZA")
 * para uma dada província. Devolve null se não for reconhecida.
 */
function obterZona(provincia) {
  return ZONAS_ENTREGA[provincia] || null;
}

/**
 * Calcula o frete com base no país e província.
 * Devolve 0 se não for possível calcular (campos vazios).
 */
function calcularFrete(pais, provincia) {
  if (!pais || !provincia) return 0;
  return FRETE[pais]?.[provincia] || 0;
}

/**
 * Calcula o prazo de entrega total para um carrinho misto e uma região.
 * Para carrinhos com produtos disponíveis E sob encomenda, devolve o
 * MAIOR prazo (a encomenda só sai quando o produto mais lento chegar).
 *
 * @param {Array} carrinho — array de itens do carrinho
 * @param {string} provincia — nome da província
 * @returns {Object} { min, max, limitadoPor: "disponivel"|"sob_encomenda"|null }
 */
function calcularPrazoEntrega(carrinho, provincia) {
  const zona = obterZona(provincia);
  if (!zona || carrinho.length === 0) return { min: 0, max: 0, limitadoPor: null };

  // Identificar quais tipos de disponibilidade existem no carrinho
  const tiposNoCarrinho = new Set(carrinho.map(item => item.disponibilidade));

  // Se só tem um tipo, é simples
  if (tiposNoCarrinho.size === 1) {
    const tipo = [...tiposNoCarrinho][0];
    const prazo = PRAZOS[tipo][zona];
    return { min: prazo.min, max: prazo.max, limitadoPor: tipo };
  }

  // Carrinho misto — o prazo é o maior dos dois
  const prazoDisp = PRAZOS.disponivel[zona];
  const prazoSob  = PRAZOS.sob_encomenda[zona];
  const limitadoPor = prazoSob.max > prazoDisp.max ? "sob_encomenda" : "disponivel";

  return {
    min:        Math.max(prazoDisp.min, prazoSob.min),
    max:        Math.max(prazoDisp.max, prazoSob.max),
    limitadoPor,
  };
}

/**
 * Calcula o sinal a pagar agora (peso ponderado entre produtos
 * disponíveis 60% e produtos sob encomenda 75%).
 *
 * @param {Array} carrinho
 * @returns {Object} { sinal, restante, total, detalhes }
 */
function calcularSinal(carrinho) {
  let sinalDisponivel    = 0;
  let sinalSobEncomenda  = 0;
  let totalDisponivel    = 0;
  let totalSobEncomenda  = 0;

  carrinho.forEach(item => {
    const valor = precoComDesconto(item) * item.qtd;
    if (item.disponibilidade === "disponivel") {
      totalDisponivel += valor;
      sinalDisponivel += valor * PAGAMENTO_REGRAS.disponivel.sinal;
    } else {
      totalSobEncomenda += valor;
      sinalSobEncomenda += valor * PAGAMENTO_REGRAS.sob_encomenda.sinal;
    }
  });

  const sinal     = sinalDisponivel + sinalSobEncomenda;
  const total     = totalDisponivel + totalSobEncomenda;
  const restante  = total - sinal;

  return {
    sinal,
    restante,
    total,
    detalhes: {
      totalDisponivel,
      totalSobEncomenda,
      sinalDisponivel,
      sinalSobEncomenda,
    },
  };
}

/**
 * Devolve o texto descritivo dos termos de pagamento para um carrinho.
 * Usado no PDF e na mensagem do WhatsApp.
 */
function termosPagamentoTexto(carrinho) {
  const temDisponivel = carrinho.some(i => i.disponibilidade === "disponivel");
  const temSobEnc     = carrinho.some(i => i.disponibilidade === "sob_encomenda");

  if (temDisponivel && temSobEnc) {
    return [
      "Produtos em stock: 60% no pedido + 40% na entrega",
      "Produtos sob encomenda: 75% no pedido + 25% na entrega",
    ];
  }
  if (temSobEnc) {
    return ["75% no momento do pedido + 25% na entrega"];
  }
  return ["60% no momento do pedido + 40% na entrega"];
}

/**
 * Calcula a média de estrelas das reviews de um produto.
 */
function mediaReviews(produto) {
  if (!produto.reviews || produto.reviews.length === 0) return 0;
  const soma = produto.reviews.reduce((a, r) => a + r.estrelas, 0);
  return soma / produto.reviews.length;
}

/**
 * Devolve produtos relacionados (mesma categoria, exceto o próprio).
 * Limita a 4 produtos por defeito.
 */
function produtosRelacionados(produto, limite = 4) {
  return PRODUTOS
    .filter(p => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, limite);
}

/**
 * Devolve o tipo de envio para uma dada província.
 * Útil para mostrar ao cliente como será feita a entrega.
 */
function tipoEnvio(provincia) {
  const zona = obterZona(provincia);
  if (!zona) return null;
  switch (zona) {
    case "MZ-sul":
      return { tipo: "Terrestre", detalhe: "Via taxistas regionais" };
    case "MZ-centro":
    case "MZ-norte":
      return { tipo: "Aéreo nacional", detalhe: "Via correios de Moçambique" };
    case "ZA":
      return { tipo: "Aéreo internacional", detalhe: "Via correios internacionais" };
    default:
      return null;
  }
}
