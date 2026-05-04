// ============================================================
//  LUMART — Sistema de Envio Inteligente
//  Suporta: Moçambique (taxa por província) e África do Sul
//  (taxa fixa nacional, com sobretaxa em regiões remotas).
// ============================================================

const PAISES = ["Moçambique", "África do Sul"];

// Tabela de fretes Moçambique — valor em MZN por província
const FRETE_MOCAMBIQUE = {
  "Maputo Cidade":     150,
  "Maputo Província":  200,
  "Gaza":              350,
  "Inhambane":         400,
  "Sofala":            500,
  "Manica":            550,
  "Tete":              600,
  "Zambézia":          650,
  "Nampula":           700,
  "Cabo Delgado":      800,
  "Niassa":            850,
};

// Tabela de fretes África do Sul — valor em MZN por região
const FRETE_AFRICA_SUL = {
  "Gauteng":            900,
  "Western Cape":      1100,
  "KwaZulu-Natal":      950,
  "Eastern Cape":      1050,
  "Free State":         950,
  "Limpopo":            900,
  "Mpumalanga":         900,
  "North West":         950,
  "Northern Cape":     1200,
};

// Frete padrão se região não for encontrada
const FRETE_PADRAO = 1000;

// Estado actual do frete (memoizado para uso em pdf.js / carrinho.js)
let _freteAtual = 0;

function obterValorFrete() {
  return _freteAtual;
}

// Calcula o frete com base no país e província/região seleccionados
function calcularFretePorEndereco(pais, regiao) {
  if (!pais) return 0;
  if (pais === "Moçambique") {
    return FRETE_MOCAMBIQUE[regiao] ?? FRETE_PADRAO;
  }
  if (pais === "África do Sul") {
    return FRETE_AFRICA_SUL[regiao] ?? FRETE_PADRAO;
  }
  return FRETE_PADRAO;
}

// Atualiza opções do select de província conforme país escolhido
function atualizarProvincias() {
  const pais = document.getElementById("input-pais")?.value;
  const select = document.getElementById("input-provincia");
  if (!select) return;

  let opcoes = [];
  if (pais === "Moçambique") {
    opcoes = Object.keys(FRETE_MOCAMBIQUE);
  } else if (pais === "África do Sul") {
    opcoes = Object.keys(FRETE_AFRICA_SUL);
  }

  select.innerHTML =
    `<option value="">Seleccione...</option>` +
    opcoes.map((o) => `<option value="${o}">${o}</option>`).join("");

  recalcularFrete();
}

// Recalcula o frete e dispara update dos totais
function recalcularFrete() {
  const pais = document.getElementById("input-pais")?.value;
  const regiao = document.getElementById("input-provincia")?.value;
  _freteAtual = pais && regiao ? calcularFretePorEndereco(pais, regiao) : 0;

  if (typeof atualizarTotaisCotacao === "function") atualizarTotaisCotacao();
}

// Inicializa os listeners do formulário de envio
function inicializarFormularioEnvio() {
  const paisEl = document.getElementById("input-pais");
  const provEl = document.getElementById("input-provincia");

  if (paisEl && !paisEl.dataset.bound) {
    paisEl.addEventListener("change", atualizarProvincias);
    paisEl.dataset.bound = "1";
  }
  if (provEl && !provEl.dataset.bound) {
    provEl.addEventListener("change", recalcularFrete);
    provEl.dataset.bound = "1";
  }

  // Popular país inicial se ainda vazio
  if (paisEl && !paisEl.value) {
    paisEl.innerHTML =
      `<option value="">Seleccione...</option>` +
      PAISES.map((p) => `<option value="${p}">${p}</option>`).join("");
  }

  atualizarProvincias();
}
