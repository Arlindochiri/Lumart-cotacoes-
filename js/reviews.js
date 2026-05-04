// ============================================================
//  LUMART — Reviews simples (persistência localStorage)
//  Cada review tem: produtoId, nome, rating (1-5), comentario, data
// ============================================================

const CHAVE_REVIEWS = "lumart_reviews";

// Reviews "seed" para demonstração quando ainda não há nenhuma
const REVIEWS_SEED = [
  { produtoId: 1, nome: "Ana M.",     rating: 5, comentario: "Cores fantásticas e duração excelente. Recomendo!", data: "2025-09-12" },
  { produtoId: 1, nome: "Carlos P.",  rating: 4, comentario: "Bom estojo, embalagem podia ser melhor.", data: "2025-10-04" },
  { produtoId: 2, nome: "Helena B.",  rating: 5, comentario: "Pincéis suaves e precisos.", data: "2025-08-21" },
  { produtoId: 6, nome: "Marco S.",   rating: 5, comentario: "Cavalete robusto, montagem rápida.", data: "2025-11-02" },
];

function carregarReviews() {
  try {
    const dados = localStorage.getItem(CHAVE_REVIEWS);
    if (dados) return JSON.parse(dados);
    salvarReviews(REVIEWS_SEED);
    return [...REVIEWS_SEED];
  } catch (e) {
    console.warn("[reviews] erro ao carregar:", e);
    return [...REVIEWS_SEED];
  }
}

function salvarReviews(arr) {
  try {
    localStorage.setItem(CHAVE_REVIEWS, JSON.stringify(arr));
  } catch (e) {
    console.warn("[reviews] erro ao salvar:", e);
  }
}

function reviewsDoProduto(produtoId) {
  return carregarReviews().filter((r) => r.produtoId === Number(produtoId));
}

function mediaRating(produtoId) {
  const lista = reviewsDoProduto(produtoId);
  if (lista.length === 0) return 0;
  return lista.reduce((s, r) => s + r.rating, 0) / lista.length;
}

function adicionarReview({ produtoId, nome, rating, comentario }) {
  const todos = carregarReviews();
  todos.push({
    produtoId: Number(produtoId),
    nome: String(nome || "").trim() || "Anónimo",
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    comentario: String(comentario || "").trim(),
    data: new Date().toISOString().slice(0, 10),
  });
  salvarReviews(todos);
}

// Renderiza estrelas (sólidas + contornadas) — retorna HTML
function renderStars(rating, size = "1em") {
  const cheias = Math.round(rating);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star" style="font-size:${size}">${i <= cheias ? "★" : "☆"}</span>`;
  }
  return `<span class="stars" aria-label="${rating.toFixed(1)} de 5">${html}</span>`;
}
