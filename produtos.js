// ============================================================
//  LUMART — Catálogo de Produtos
//  Adicione, edite ou remova produtos aqui.
// ============================================================

const PRODUTOS = [
  {
    id: 1,
    nome: "Estojo Aquarela Profissional 24 Cores",
    marca: "Winsor & Newton",
    categoria: "Aquarelas",
    preco: 289.90,
    imagem: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80",
    destaque: true,
  },
  {
    id: 2,
    nome: "Kit Pincéis Sintéticos Marta 5 Peças",
    marca: "Keramik",
    categoria: "Pincéis",
    preco: 85.50,
    imagem: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
    destaque: false,
  },
  {
    id: 3,
    nome: "Tela Painel Algodão 50×70cm",
    marca: "Souza",
    categoria: "Telas",
    preco: 42.90,
    imagem: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    destaque: false,
  },
  {
    id: 4,
    nome: "Tinta Óleo Clássica 37ml – Branco de Titânio",
    marca: "Corfix",
    categoria: "Tintas",
    preco: 22.00,
    imagem: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=400&q=80",
    destaque: false,
  },
  {
    id: 5,
    nome: "Sketchbook Artbook One 100g 100 Folhas",
    marca: "Canson",
    categoria: "Cadernos",
    preco: 58.00,
    imagem: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
    destaque: false,
  },
  {
    id: 6,
    nome: "Cavalete Estúdio Trident Modelo 120",
    marca: "Trident",
    categoria: "Cavaletes",
    preco: 450.00,
    imagem: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80",
    destaque: true,
  },
  {
    id: 7,
    nome: "Conjunto Pastéis Secos Soft 48 Cores",
    marca: "Faber-Castell",
    categoria: "Pastéis",
    preco: 175.00,
    imagem: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=400&q=80",
    destaque: false,
  },
  {
    id: 8,
    nome: "Papel Aquarela Algodão 300g A3 – 10 Folhas",
    marca: "Fabriano",
    categoria: "Papéis",
    preco: 94.00,
    imagem: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80",
    destaque: false,
  },
  {
    id: 9,
    nome: "Mediums & Verniz Gloss 250ml",
    marca: "Liquitex",
    categoria: "Acessórios",
    preco: 67.50,
    imagem: "https://images.unsplash.com/photo-1615529162924-f8605388461d?w=400&q=80",
    destaque: false,
  },
  {
    id: 10,
    nome: "Lápis de Cor Aquarelável 36 Cores",
    marca: "Bruynzeel",
    categoria: "Lápis",
    preco: 139.90,
    imagem: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80",
    destaque: false,
  },
];

// Categorias únicas para filtros
const CATEGORIAS = ["Todos", ...new Set(PRODUTOS.map((p) => p.categoria))];

// Número WhatsApp da loja (com código do país, sem espaços ou símbolos)
const WHATSAPP_NUMERO = "258878237402"; // ← Altere para o número real

// Formatar valor em Metical (MZN)
function formatarMZN(valor) {
  return "MZN " + valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
