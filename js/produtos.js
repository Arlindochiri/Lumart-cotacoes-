// ============================================================
//  LUMART — Catálogo de Produtos
//  Cada produto pode ter: galeria de imagens, vídeo, desconto,
//  descrição e produtos relacionados.
// ============================================================

const PRODUTOS = [
  {
    id: 1,
    nome: "Estojo Aquarela Profissional 24 Cores",
    marca: "Winsor & Newton",
    categoria: "Aquarelas",
    preco: 289.90,
    desconto: 15,
    imagem: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Estojo profissional com 24 pastilhas de aquarela de alta pigmentação. Cores vibrantes, excelente diluição e durabilidade. Ideal para artistas profissionais e estudantes avançados.",
    destaque: true,
  },
  {
    id: 2,
    nome: "Kit Pincéis Sintéticos Marta 5 Peças",
    marca: "Keramik",
    categoria: "Pincéis",
    preco: 85.50,
    desconto: 0,
    imagem: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Conjunto com 5 pincéis sintéticos imitando pelo de marta. Cabos longos ergonómicos, ferro inoxidável. Ideal para aquarela e acrílico em camadas finas.",
    destaque: false,
  },
  {
    id: 3,
    nome: "Tela Painel Algodão 50×70cm",
    marca: "Souza",
    categoria: "Telas",
    preco: 42.90,
    desconto: 0,
    imagem: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Tela 100% algodão com tratamento triplo, painel rígido. Pronta para óleo, acrílico e técnicas mistas.",
    destaque: false,
  },
  {
    id: 4,
    nome: "Tinta Óleo Clássica 37ml – Branco de Titânio",
    marca: "Corfix",
    categoria: "Tintas",
    preco: 22.00,
    desconto: 10,
    imagem: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Tinta a óleo clássica em bisnaga 37ml. Cobertura excelente, secagem média, acabamento acetinado.",
    destaque: false,
  },
  {
    id: 5,
    nome: "Sketchbook Artbook One 100g 100 Folhas",
    marca: "Canson",
    categoria: "Cadernos",
    preco: 58.00,
    desconto: 0,
    imagem: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Sketchbook 100g com 100 folhas, capa rígida costurada. Versátil para grafite, lápis de cor e tinta seca.",
    destaque: false,
  },
  {
    id: 6,
    nome: "Cavalete Estúdio Trident Modelo 120",
    marca: "Trident",
    categoria: "Cavaletes",
    preco: 450.00,
    desconto: 20,
    imagem: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Cavalete profissional para estúdio em madeira maciça. Comporta telas até 120cm. Ajuste de altura e inclinação.",
    destaque: true,
  },
  {
    id: 7,
    nome: "Conjunto Pastéis Secos Soft 48 Cores",
    marca: "Faber-Castell",
    categoria: "Pastéis",
    preco: 175.00,
    desconto: 0,
    imagem: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Pastéis secos soft com 48 cores variadas. Pigmentos vibrantes, fácil esfumagem, ideais para retratos e paisagens.",
    destaque: false,
  },
  {
    id: 8,
    nome: "Papel Aquarela Algodão 300g A3 – 10 Folhas",
    marca: "Fabriano",
    categoria: "Papéis",
    preco: 94.00,
    desconto: 5,
    imagem: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Papel aquarela 100% algodão, 300g, formato A3. Grão fino, alta absorção, resistente a múltiplas camadas.",
    destaque: false,
  },
  {
    id: 9,
    nome: "Mediums & Verniz Gloss 250ml",
    marca: "Liquitex",
    categoria: "Acessórios",
    preco: 67.50,
    desconto: 0,
    imagem: "https://images.unsplash.com/photo-1615529162924-f8605388461d?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1615529162924-f8605388461d?w=1200&q=80",
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=1200&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Verniz acrílico gloss 250ml. Acabamento brilhante, proteção UV, ideal para finalizar trabalhos em acrílico.",
    destaque: false,
  },
  {
    id: 10,
    nome: "Lápis de Cor Aquarelável 36 Cores",
    marca: "Bruynzeel",
    categoria: "Lápis",
    preco: 139.90,
    desconto: 12,
    imagem: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
      "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=1200&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=80",
    ],
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    descricao: "Lápis de cor aquareláveis com 36 cores. Mina suave, alta solubilidade em água, resistência à luz.",
    destaque: false,
  },
];

// Categorias únicas para filtros
const CATEGORIAS = ["Todos", ...new Set(PRODUTOS.map((p) => p.categoria))];

// Número WhatsApp da loja (com código do país, sem espaços ou símbolos)
const WHATSAPP_NUMERO = "258878237402";

// ─── Helpers ─────────────────────────────────────────────────

// Formatar valor em Metical (MZN)
function formatarMZN(valor) {
  return "MZN " + Number(valor).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Calcula o preço final aplicando o desconto, se houver
function precoComDesconto(produto) {
  const d = produto.desconto || 0;
  return d > 0 ? produto.preco * (1 - d / 100) : produto.preco;
}

// Procurar produto por id
function encontrarProduto(id) {
  return PRODUTOS.find((p) => p.id === Number(id));
}

// Produtos relacionados (mesma categoria, excluindo o próprio)
function produtosRelacionados(produto, limite = 4) {
  return PRODUTOS
    .filter((p) => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, limite);
}
