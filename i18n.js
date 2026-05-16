// ════════════════════════════════════════════════════════════
//  LUMART COMERCIAL — Sistema Multi-idioma (Fase 3)
// ════════════════════════════════════════════════════════════
//  PT (default) + EN. Cliente troca via toggle no header.
//  Persistência em localStorage. Auto-sugere EN se browser
//  estiver em EN no primeiro acesso.
//
//  Estrutura: chaves PLANAS hierárquicas (com pontos).
//    "header.cart": "Carrinho"
//    "header.cart": "Cart"
//
//  Uso:
//    t("header.cart")                    → "Carrinho" ou "Cart"
//    t("product.minimum", { v: "2000" }) → substitui {v}
//
//  Marcar elementos HTML com data-i18n:
//    <span data-i18n="header.cart">Carrinho</span>
//    <input data-i18n-placeholder="search.placeholder">
//    <button data-i18n-aria-label="..."> 
//
//  Trocar idioma:
//    setLang("en") · alternarLang() · getLang()
//
//  Eventos:
//    document.dispatchEvent('lumart:lang-changed')
//      → outros scripts re-renderizam UI dinâmica
// ════════════════════════════════════════════════════════════

const I18N_STORAGE_KEY = "lumart_lang";
const I18N_SUGERIDO_KEY = "lumart_lang_sugerido";
const I18N_DEFAULT = "pt";
const I18N_SUPPORTED = ["pt", "en"];

// Estado actual (single source of truth)
let LANG_ACTUAL = I18N_DEFAULT;

// ─────────────────────────────────────────────────────────────
//  Dicionário de traduções — chaves planas hierárquicas
// ─────────────────────────────────────────────────────────────
const TRADUCOES = {
  pt: {
    // ── Comum ──────────────────────────────────────────
    "comum.sim": "Sim",
    "comum.nao": "Não",
    "comum.fechar": "Fechar",
    "comum.cancelar": "Cancelar",
    "comum.confirmar": "Confirmar",
    "comum.guardar": "Guardar",
    "comum.eliminar": "Eliminar",
    "comum.continuar": "Continuar",
    "comum.voltar": "Voltar",
    "comum.ver_mais": "Ver mais",
    "comum.ver_menos": "Ver menos",
    "comum.carregando": "A carregar…",
    "comum.copiar": "Copiar",
    "comum.copiado": "Link copiado para a área de transferência",
    "comum.partilhar": "Partilhar",
    "comum.limpar": "Limpar",
    "comum.aplicar": "Aplicar",
    "comum.remover": "Remover",
    "comum.adicionar": "Adicionar",
    "comum.ver": "Ver",
    "comum.opcional": "(opcional)",

    // ── Anúncio bar (topo) ─────────────────────────────
    "anuncio.entrega": "Entrega em <b>13–30 dias</b> úteis em MZ e ZA",
    "anuncio.cotacao_whatsapp": "Cotações via <b>WhatsApp</b>",
    "anuncio.qualidade": "<b>Qualidade Profissional</b> · Importação Directa",

    // ── Header / Navegação ─────────────────────────────
    "header.catalogo": "Catálogo",
    "header.cotacao": "Cotação",
    "header.fazer_cotacao": "Fazer Cotação",
    "header.abrir_carrinho": "Abrir carrinho",
    "header.abrir_favoritos": "Abrir favoritos",
    "header.procurar": "Procurar produtos",
    "header.mudar_idioma": "Mudar idioma",

    // ── Hero ───────────────────────────────────────────
    "hero.eyebrow": "Art Supplies · Moçambique",
    "hero.titulo_l1": "Equipe o seu",
    "hero.titulo_l2": "estúdio.",
    "hero.titulo_l3": "Eleve a sua arte.",
    "hero.descricao": "Materiais artísticos de qualidade profissional. Gere a sua cotação em segundos e envie directamente para a nossa equipa via WhatsApp.",
    "hero.cta_principal": "Ver Produtos",
    "hero.cta_secundario": "Como funciona?",
    "hero.stat_marcas": "Marcas",
    "hero.stat_resposta": "Resposta",
    "hero.stat_profissional": "Profissional",
    "hero.tag_cotacao_label": "Cotação rápida",
    "hero.tag_cotacao_valor": "Em 60 segundos",

    // ── Catálogo ───────────────────────────────────────
    "catalogo.titulo": "Catálogo de Produtos",
    "catalogo.titulo_header_1": "O nosso",
    "catalogo.titulo_header_2": "catálogo",
    "catalogo.contagem": "{n} produto",
    "catalogo.contagem_plural": "{n} produtos",
    "catalogo.vazio_titulo": "Nenhum produto nesta categoria",
    "catalogo.vazio_texto": "Não temos produtos em <strong>{cat}</strong> de momento.",
    "catalogo.ver_todos": "Ver todos os produtos",
    "filtros.todos": "Todos",

    // ── Card produto ───────────────────────────────────
    "card.adicionar": "Adicionar à Cotação",
    "card.adicionado": "✓ Adicionado",
    "card.em_stock": "Em stock",
    "card.sob_encomenda": "Sob encomenda",
    "card.destaque": "⭐ Destaque",
    "card.fav_adicionar": "Adicionar aos favoritos",
    "card.fav_remover": "Remover dos favoritos",
    "card.minimo_k": "Mín. {k}k",
    "card.cotacao_minima_titulo": "Cotação mínima: {valor}",

    // ── Página de produto ──────────────────────────────
    "produto.breadcrumb_inicio": "Início",
    "produto.avaliacao": "avaliação",
    "produto.avaliacoes": "avaliações",
    "produto.adicionar_cotacao": "Adicionar à Cotação",
    "produto.adicionado_cotacao": "✓ Adicionado à cotação",
    "produto.poupa": "Poupe {v}",
    "produto.comprar_whatsapp": "Comprar directamente via WhatsApp",
    "produto.partilhar": "Partilhar",
    "produto.feat_entrega": "Entrega em todo Moçambique e África do Sul",
    "produto.feat_prazo": "Cotação processada em até 48 horas",
    "produto.feat_pagamento": "Pagamento seguro · sinal + restante na entrega",
    "produto.disp_titulo": "Em stock — envio imediato",
    "produto.disp_texto": "Este produto está disponível para envio imediato após confirmação do pagamento.",
    "produto.disp_termos": "Pagamento: 60% no pedido + 40% na entrega",
    "produto.enc_titulo": "Sob encomenda — importação directa",
    "produto.enc_texto": "Este produto é importado sob encomenda da Ásia ou América. Após confirmação do pagamento de 75%, iniciamos a importação directa para o seu endereço.",
    "produto.enc_termos": "Pagamento: 75% no pedido + 25% na entrega · Prazo: 13–30 dias úteis",
    "produto.minimo_titulo": "Cotação mínima: {valor}",
    "produto.minimo_texto": "Este produto só pode ser cotado quando o subtotal do carrinho atingir <strong>{valor}</strong>.",
    "produto.galeria_ampliar": "Ampliar imagem",
    "produto.video_reproduzir": "Reproduzir vídeo",
    "produto.zoom_hint_mobile": "Use 2 dedos para fazer zoom",
    "produto.zoom_hint_desktop": "Use o scroll · clique duplo para zoom",
    "produto.reviews_titulo": "Avaliações dos clientes",
    "produto.relacionados_titulo": "Pode também gostar",
    "produto.ver_catalogo_todo": "Ver todo o catálogo →",
    "produto.recentes_titulo": "Vistos recentemente",
    "produto.recentes_limpar": "Limpar",
    "recentes.limpo_toast": "Histórico de vistos limpo",
    "produto.nao_encontrado_titulo": "Produto não encontrado",
    "produto.nao_encontrado_texto": "O produto que procura não existe ou foi removido.",
    "produto.indisponivel_titulo": "Produto temporariamente indisponível",
    "produto.indisponivel_texto": "Este produto está actualmente fora de catálogo.",
    "produto.voltar_catalogo": "← Voltar ao catálogo",

    // ── Carrinho ───────────────────────────────────────
    "carrinho.titulo": "A sua cotação",
    "carrinho.vazio_titulo": "A sua cotação está vazia",
    "carrinho.vazio_texto": "Adicione produtos do catálogo para começar a sua cotação personalizada.",
    "carrinho.ver_catalogo": "Ver catálogo",
    "carrinho.total_parcial": "Total parcial",
    "carrinho.continuar_cotacao": "Continuar para cotação",
    "carrinho.fechar_continuar": "Fechar e continuar",
    "carrinho.limpar": "Limpar carrinho",
    "carrinho.confirmar_limpar": "Remover todos os produtos da cotação?",
    "carrinho.adicionado_toast": "\"{nome}…\" adicionado",
    "carrinho.preco_un": "{v} / un.",
    "carrinho.itens_na_cotacao": "{n} {unidade}",
    "carrinho.itens_prontos": "prontos para cotação",
    "carrinho.ver_carrinho": "Ver Carrinho",
    "carrinho.unidade": "item",
    "carrinho.unidades": "itens",
    "carrinho.termos": "Preços em MZN · Em stock: 60%/40% · Sob encomenda: 75%/25%",
    "carrinho.aviso_minimo_titulo": "Cotação mínima não atingida",
    "carrinho.aviso_minimo_texto": "<strong>{produto}</strong> requer cotação mínima de <strong>{minimo}</strong>. Faltam <strong>{faltam}</strong>.",
    "carrinho.aviso_minimo_sugestao": "Adicione mais produtos para continuar.",

    // ── Wishlist ───────────────────────────────────────
    "wishlist.titulo": "Os meus favoritos",
    "wishlist.vazio_titulo": "Sem favoritos ainda",
    "wishlist.vazio_texto": "Toque no ♥ em qualquer produto para guardar aqui. Os seus favoritos ficam guardados entre sessões.",
    "wishlist.limpar": "Limpar favoritos",
    "wishlist.confirmar_limpar": "Tem a certeza que quer remover todos os favoritos?",
    "wishlist.adicionado_toast": "\"{nome}…\" adicionado aos favoritos",
    "wishlist.removidos_toast": "Favoritos removidos",
    "wishlist.footer_termos": "Adicione qualquer favorito à cotação para continuar.",
    "wishlist.add_carrinho": "Adicionar ao carrinho",
    "wishlist.no_carrinho": "Já no carrinho",
    "wishlist.remover": "Remover dos favoritos",

    // ── Busca ──────────────────────────────────────────
    "busca.placeholder": "O que procura?",
    "busca.inicial_titulo": "O que procura hoje?",
    "busca.inicial_texto": "Comece a escrever para encontrar entre os nossos produtos.",
    "busca.vazio_titulo": "Nada encontrado",
    "busca.vazio_texto": "Não encontrámos nada para <strong>\"{termo}\"</strong>.",
    "busca.ver_catalogo": "Ver todo o catálogo",
    "busca.sugestoes_label": "Sugestões:",

    // ── Checkout ───────────────────────────────────────
    "checkout.titulo": "Finalizar Cotação",
    "checkout.titulo_l1": "Finalizar",
    "checkout.titulo_l2": "cotação",
    "checkout.subtitulo": "Preencha os seus dados e o endereço de entrega para gerar a sua cotação personalizada.",
    "checkout.passo_carrinho": "Carrinho",
    "checkout.passo_endereco": "Endereço",
    "checkout.passo_confirmar": "Confirmar",
    "checkout.bloco_contacto": "Os seus dados",
    "checkout.bloco_dados": "Seus Dados",
    "checkout.bloco_entrega": "Endereço de Entrega",
    "checkout.bloco_observacoes": "Observações adicionais",
    "checkout.nome": "Nome Completo",
    "checkout.nome_placeholder": "Ex: Maria da Silva",
    "checkout.telefone": "WhatsApp / Telefone",
    "checkout.telefone_placeholder": "+258 84 000 0000",
    "checkout.pais": "País",
    "checkout.pais_placeholder": "— Selecionar país —",
    "checkout.provincia": "Província / Distrito",
    "checkout.provincia_placeholder": "— Selecione primeiro o país —",
    "checkout.provincia_escolher": "— Selecionar província —",
    "checkout.cidade": "Cidade",
    "checkout.bairro": "Bairro",
    "checkout.referencia": "Ponto de referência",
    "checkout.referencia_placeholder": "Ex: Perto da Escola Primária X",
    "checkout.observacoes_placeholder": "Notas, instruções especiais, etc.",
    "checkout.resumo_titulo": "Resumo do Pedido",
    "checkout.editar": "Editar",
    "checkout.subtotal": "Subtotal",
    "checkout.frete": "Frete",
    "checkout.frete_calcular": "Selecione o endereço de entrega para calcular",
    "checkout.total": "Total",
    "checkout.sinal": "A pagar agora (sinal)",
    "checkout.restante": "A pagar na entrega",
    "checkout.prazo_titulo": "Prazo estimado de entrega",
    "checkout.prazo_dias_uteis": "{min}–{max} dias úteis",
    "checkout.prazo_limitado_encomenda": "limitado pelo produto sob encomenda",
    "checkout.prazo_importados": "produtos importados directamente",
    "checkout.prazo_em_stock": "produtos em stock",
    "checkout.acoes_titulo": "Concluir cotação",
    "checkout.btn_pdf": "Baixar PDF",
    "checkout.btn_whatsapp": "Enviar via WhatsApp",
    "checkout.btn_whatsapp_full": "Enviar no WhatsApp",
    "checkout.prazo_eyebrow": "Entrega estimada",
    "checkout.termos_titulo": "Termos de pagamento",
    "checkout.termos_em_stock": "Produtos em stock: 60% no pedido + 40% na entrega",
    "checkout.termos_sob_enc": "Produtos sob encomenda: 75% no pedido + 25% na entrega",
    "checkout.termos_so_stock": "60% no momento do pedido + 40% na entrega",
    "checkout.termos_so_enc": "75% no momento do pedido + 25% na entrega",
    "checkout.info_envio": "Ao enviar, irá receber o PDF da cotação e abrir o WhatsApp com a mensagem pronta.",
    "checkout.aviso_minimo_bloqueado": "Cotação mínima não atingida.",
    "checkout.cambio_titulo": "Equivalente em Rand (ZAR)",
    "checkout.cambio_taxa": "Taxa actual: 1 MZN = {taxa} R",
    "checkout.cambio_actualizada": "actualizada em {data}",
    "checkout.cambio_aviso": "Valores em ZAR são apenas referência. O pagamento é processado em Metical (MZN).",

    // ── Países ─────────────────────────────────────────
    "pais.mz": "Moçambique",
    "pais.za": "África do Sul",

    // ── Toast / Mensagens ──────────────────────────────
    "toast.preencha_obrigatorios": "Preencha os campos obrigatórios",
    "toast.preencha_telefone": "Preencha o seu telefone",
    "toast.preencha_endereco": "Preencha o endereço completo",
    "toast.escolha_pais": "Escolha o país de entrega",
    "toast.escolha_provincia": "Escolha a província",
    "toast.preencha_campo": "Preencha: {campo}",
    "toast.adicione_antes": "Adicione produtos antes de continuar.",
    "toast.carrinho_vazio": "O carrinho está vazio.",
    "toast.minimo_faltam": "Cotação mínima não atingida — faltam {valor}",
    "toast.pdf_gerado": "PDF gerado com sucesso!",

    // ── Footer ─────────────────────────────────────────
    "footer.tagline": "Traços que contam Histórias.",
    "footer.descricao": "Materiais artísticos profissionais com importação directa da Ásia e América. Traços que contam Histórias.",
    "footer.loja_titulo": "Loja",
    "footer.loja_catalogo": "Catálogo",
    "footer.loja_catalogo_completo": "Catálogo Completo",
    "footer.loja_cotacao": "Fazer Cotação",
    "footer.loja_destaque": "Produtos em Destaque",
    "footer.loja_procurar": "Procurar Produtos",
    "footer.loja_como_funciona": "Como funciona",
    "footer.loja_entrega": "Entrega",
    "footer.empresa_titulo": "Empresa",
    "footer.empresa_sobre": "Sobre nós",
    "footer.empresa_sobre_lumart": "Sobre a Lumart",
    "footer.empresa_faq": "FAQ",
    "footer.empresa_faq_long": "Perguntas Frequentes",
    "footer.empresa_devolucao": "Devolução",
    "footer.empresa_termos": "Termos",
    "footer.empresa_privacidade": "Privacidade",
    "footer.empresa_contactar": "Contactar",
    "footer.ajuda_titulo": "Ajuda",
    "footer.ajuda_entrega": "Política de Entrega",
    "footer.ajuda_devolucao": "Política de Devolução",
    "footer.ajuda_termos": "Termos e Condições",
    "footer.contacto_titulo": "Contacto",
    "footer.redes_titulo": "Siga-nos",
    "footer.pagamentos_label": "Aceitamos:",
    "footer.copyright": "© {ano} Lumart Comercial · Todos os direitos reservados",
    "footer.copyright_resto": "Todos os direitos reservados.",
    "footer.feito_em": "Feito em Chibuto · Moçambique",

    // ── PWA Banner ─────────────────────────────────────
    "pwa.titulo": "Instalar a Lumart",
    "pwa.texto": "Acesso rápido às suas cotações, mesmo offline.",
    "pwa.btn_dispensar": "Agora não",
    "pwa.btn_instalar": "Instalar",
    "pwa.instalada_toast": "Lumart instalada com sucesso!",

    // ── Sugestão de idioma ─────────────────────────────
    "i18n.sugerir_en": "We noticed your browser is in English. Switch to English?",
    "i18n.btn_sim_en": "Yes, switch",
    "i18n.btn_nao_pt": "No, keep PT",

    // ── PDF / WhatsApp ─────────────────────────────────
    "pdf.titulo": "COTAÇÃO",
    "pdf.numero": "Cotação Nº",
    "pdf.data": "Data",
    "pdf.cliente": "CLIENTE",
    "pdf.entrega": "ENTREGA",
    "pdf.produtos": "PRODUTOS",
    "pdf.codigo": "Cód.",
    "pdf.descricao": "PRODUTO",
    "pdf.qtd": "QTD",
    "pdf.preco_un": "UNITÁRIO",
    "pdf.subtotal_item": "SUBTOTAL",
    "pdf.subtotal": "Subtotal",
    "pdf.frete_pdf": "Frete",
    "pdf.total": "TOTAL",
    "pdf.pagamento_titulo": "PAGAMENTO",
    "pdf.sinal_label": "A PAGAR AGORA (SINAL)",
    "pdf.restante_label": "A PAGAR NA ENTREGA",
    "pdf.prazo_label": "ENTREGA ESTIMADA",
    "pdf.endereco_label": "ENTREGA",
    "pdf.observacoes_label": "Obs",
    "pdf.referencia": "Ref",
    "pdf.validade": "Cotação válida por 7 dias a partir da data de emissão",
    "pdf.frete_pago_sinal": "Frete pago no momento do pedido (junto ao sinal)",
    "pdf.termos_titulo": "TERMOS E CONDIÇÕES",
    "pdf.zar_titulo": "EQUIVALENTE EM RAND (ZAR)",
    "pdf.zar_taxa": "Taxa: 1 MZN = {valor} R · actualizada em {data}",
    "pdf.zar_aviso": "Valores em ZAR são referência. Pagamento processado em Metical (MZN).",
    "pdf.dias_uteis": "{min}–{max} dias úteis",
    "pdf.slogan": "Traços que contam Histórias",

    // ── WhatsApp message ───────────────────────────────
    "wpp.intro": "Olá! Sou *{nome}* e gostaria de confirmar a cotação {num}.",
    "wpp.produtos_titulo": "PRODUTOS:",
    "wpp.subtotal_label": "Subtotal:",
    "wpp.frete_label": "Frete:",
    "wpp.total_label": "TOTAL:",
    "wpp.pagamento_titulo": "PAGAMENTO:",
    "wpp.sinal_agora": "Sinal (agora):",
    "wpp.na_entrega": "Na entrega:",
    "wpp.endereco_titulo": "ENDEREÇO DE ENTREGA:",
    "wpp.telefone_label": "Telefone:",
    "wpp.entrega_estimada": "Entrega estimada:",
    "wpp.obs_label": "Obs:",
    "wpp.pdf_anexo": "Segue em anexo o PDF da cotação.",
    "wpp.zar_titulo": "EQUIVALENTE EM RAND (ZAR):",
    "wpp.zar_subtotal": "Subtotal:",
    "wpp.zar_frete": "Frete:",
    "wpp.zar_total": "Total:",
    "wpp.zar_sinal": "Sinal:",
    "wpp.zar_restante": "Restante:",
    "wpp.zar_taxa": "Taxa: 1 MZN = {valor} R · {data}",
    "wpp.zar_aviso": "Pagamento processado em Metical (MZN).",
    "wpp.referencia": "Referência:",
    "wpp.prazo_dias": "{min}–{max} dias úteis",
    "wpp.prazo_confirmar": "a confirmar",
  },

  en: {
    // ── Common ─────────────────────────────────────────
    "comum.sim": "Yes",
    "comum.nao": "No",
    "comum.fechar": "Close",
    "comum.cancelar": "Cancel",
    "comum.confirmar": "Confirm",
    "comum.guardar": "Save",
    "comum.eliminar": "Delete",
    "comum.continuar": "Continue",
    "comum.voltar": "Back",
    "comum.ver_mais": "See more",
    "comum.ver_menos": "See less",
    "comum.carregando": "Loading…",
    "comum.copiar": "Copy",
    "comum.copiado": "Link copied to clipboard",
    "comum.partilhar": "Share",
    "comum.limpar": "Clear",
    "comum.aplicar": "Apply",
    "comum.remover": "Remove",
    "comum.adicionar": "Add",
    "comum.ver": "View",
    "comum.opcional": "(optional)",

    // ── Announcement bar ───────────────────────────────
    "anuncio.entrega": "Delivery in <b>13–30 working days</b> across MZ and ZA",
    "anuncio.cotacao_whatsapp": "Quotes via <b>WhatsApp</b>",
    "anuncio.qualidade": "<b>Professional Quality</b> · Direct Import",

    // ── Header / Navigation ────────────────────────────
    "header.catalogo": "Catalogue",
    "header.cotacao": "Quote",
    "header.fazer_cotacao": "Get a Quote",
    "header.abrir_carrinho": "Open cart",
    "header.abrir_favoritos": "Open favorites",
    "header.procurar": "Search products",
    "header.mudar_idioma": "Switch language",

    // ── Hero ───────────────────────────────────────────
    "hero.eyebrow": "Art Supplies · Mozambique",
    "hero.titulo_l1": "Equip your",
    "hero.titulo_l2": "studio.",
    "hero.titulo_l3": "Elevate your craft.",
    "hero.descricao": "Professional-grade art supplies. Generate your quote in seconds and send it directly to our team via WhatsApp.",
    "hero.cta_principal": "View Products",
    "hero.cta_secundario": "How it works?",
    "hero.stat_marcas": "Brands",
    "hero.stat_resposta": "Response",
    "hero.stat_profissional": "Professional",
    "hero.tag_cotacao_label": "Quick quote",
    "hero.tag_cotacao_valor": "In 60 seconds",

    // ── Catalogue ──────────────────────────────────────
    "catalogo.titulo": "Product Catalogue",
    "catalogo.titulo_header_1": "Our",
    "catalogo.titulo_header_2": "catalogue",
    "catalogo.contagem": "{n} product",
    "catalogo.contagem_plural": "{n} products",
    "catalogo.vazio_titulo": "No products in this category",
    "catalogo.vazio_texto": "We don't have products in <strong>{cat}</strong> right now.",
    "catalogo.ver_todos": "View all products",
    "filtros.todos": "All",

    // ── Product card ───────────────────────────────────
    "card.adicionar": "Add to Quote",
    "card.adicionado": "✓ Added",
    "card.em_stock": "In stock",
    "card.sob_encomenda": "Pre-order",
    "card.destaque": "⭐ Featured",
    "card.fav_adicionar": "Add to favorites",
    "card.fav_remover": "Remove from favorites",
    "card.minimo_k": "Min {k}k",
    "card.cotacao_minima_titulo": "Minimum quote: {valor}",

    // ── Product page ───────────────────────────────────
    "produto.breadcrumb_inicio": "Home",
    "produto.avaliacao": "review",
    "produto.avaliacoes": "reviews",
    "produto.adicionar_cotacao": "Add to Quote",
    "produto.adicionado_cotacao": "✓ Added to quote",
    "produto.poupa": "Save {v}",
    "produto.comprar_whatsapp": "Buy directly via WhatsApp",
    "produto.partilhar": "Share",
    "produto.feat_entrega": "Delivery throughout Mozambique and South Africa",
    "produto.feat_prazo": "Quote processed within 48 hours",
    "produto.feat_pagamento": "Secure payment · deposit + balance on delivery",
    "produto.disp_titulo": "In stock — immediate shipping",
    "produto.disp_texto": "This product is available for immediate shipping after payment confirmation.",
    "produto.disp_termos": "Payment: 60% at order + 40% on delivery",
    "produto.enc_titulo": "Pre-order — direct import",
    "produto.enc_texto": "This product is imported on order from Asia or America. After confirmation of the 75% payment, we start the direct import to your address.",
    "produto.enc_termos": "Payment: 75% at order + 25% on delivery · Lead time: 13–30 working days",
    "produto.minimo_titulo": "Minimum quote: {valor}",
    "produto.minimo_texto": "This product can only be quoted when the cart subtotal reaches <strong>{valor}</strong>.",
    "produto.galeria_ampliar": "Enlarge image",
    "produto.video_reproduzir": "Play video",
    "produto.zoom_hint_mobile": "Use 2 fingers to zoom",
    "produto.zoom_hint_desktop": "Use scroll · double click to zoom",
    "produto.reviews_titulo": "Customer reviews",
    "produto.relacionados_titulo": "You may also like",
    "produto.ver_catalogo_todo": "View full catalogue →",
    "produto.recentes_titulo": "Recently viewed",
    "produto.recentes_limpar": "Clear",
    "recentes.limpo_toast": "Recently viewed history cleared",
    "produto.nao_encontrado_titulo": "Product not found",
    "produto.nao_encontrado_texto": "The product you're looking for doesn't exist or has been removed.",
    "produto.indisponivel_titulo": "Product temporarily unavailable",
    "produto.indisponivel_texto": "This product is currently out of catalogue.",
    "produto.voltar_catalogo": "← Back to catalogue",

    // ── Cart ───────────────────────────────────────────
    "carrinho.titulo": "Your quote",
    "carrinho.vazio_titulo": "Your quote is empty",
    "carrinho.vazio_texto": "Add products from the catalogue to start your personalised quote.",
    "carrinho.ver_catalogo": "View catalogue",
    "carrinho.total_parcial": "Subtotal",
    "carrinho.continuar_cotacao": "Continue to quote",
    "carrinho.fechar_continuar": "Close and continue",
    "carrinho.limpar": "Clear cart",
    "carrinho.confirmar_limpar": "Remove all products from quote?",
    "carrinho.adicionado_toast": "\"{nome}…\" added",
    "carrinho.preco_un": "{v} / each",
    "carrinho.itens_na_cotacao": "{n} {unidade}",
    "carrinho.itens_prontos": "ready to quote",
    "carrinho.ver_carrinho": "View Cart",
    "carrinho.unidade": "item",
    "carrinho.unidades": "items",
    "carrinho.termos": "Prices in MZN · In stock: 60%/40% · Pre-order: 75%/25%",
    "carrinho.aviso_minimo_titulo": "Minimum quote not reached",
    "carrinho.aviso_minimo_texto": "<strong>{produto}</strong> requires a minimum quote of <strong>{minimo}</strong>. You need <strong>{faltam}</strong> more.",
    "carrinho.aviso_minimo_sugestao": "Add more products to continue.",

    // ── Wishlist ───────────────────────────────────────
    "wishlist.titulo": "My favorites",
    "wishlist.vazio_titulo": "No favorites yet",
    "wishlist.vazio_texto": "Tap ♥ on any product to save it here. Your favorites are kept between sessions.",
    "wishlist.limpar": "Clear favorites",
    "wishlist.confirmar_limpar": "Are you sure you want to remove all favorites?",
    "wishlist.adicionado_toast": "\"{nome}…\" added to favorites",
    "wishlist.removidos_toast": "Favorites removed",
    "wishlist.footer_termos": "Add any favorite to the quote to continue.",
    "wishlist.add_carrinho": "Add to cart",
    "wishlist.no_carrinho": "Already in cart",
    "wishlist.remover": "Remove from favorites",

    // ── Search ─────────────────────────────────────────
    "busca.placeholder": "What are you looking for?",
    "busca.inicial_titulo": "What are you looking for today?",
    "busca.inicial_texto": "Start typing to find among our products.",
    "busca.vazio_titulo": "Nothing found",
    "busca.vazio_texto": "We didn't find anything for <strong>\"{termo}\"</strong>.",
    "busca.ver_catalogo": "View full catalogue",
    "busca.sugestoes_label": "Suggestions:",

    // ── Checkout ───────────────────────────────────────
    "checkout.titulo": "Finalise Quote",
    "checkout.titulo_l1": "Finalise",
    "checkout.titulo_l2": "quote",
    "checkout.subtitulo": "Fill in your details and delivery address to generate your personalised quote.",
    "checkout.passo_carrinho": "Cart",
    "checkout.passo_endereco": "Address",
    "checkout.passo_confirmar": "Confirm",
    "checkout.bloco_contacto": "Your details",
    "checkout.bloco_dados": "Your Details",
    "checkout.bloco_entrega": "Delivery Address",
    "checkout.bloco_observacoes": "Additional notes",
    "checkout.nome": "Full Name",
    "checkout.nome_placeholder": "e.g. Mary Smith",
    "checkout.telefone": "WhatsApp / Phone",
    "checkout.telefone_placeholder": "+258 84 000 0000",
    "checkout.pais": "Country",
    "checkout.pais_placeholder": "— Select country —",
    "checkout.provincia": "Province / District",
    "checkout.provincia_placeholder": "— Select country first —",
    "checkout.provincia_escolher": "— Select province —",
    "checkout.cidade": "City",
    "checkout.bairro": "Neighbourhood",
    "checkout.referencia": "Landmark",
    "checkout.referencia_placeholder": "e.g. Near X Primary School",
    "checkout.observacoes_placeholder": "Notes, special instructions, etc.",
    "checkout.resumo_titulo": "Order Summary",
    "checkout.editar": "Edit",
    "checkout.subtotal": "Subtotal",
    "checkout.frete": "Shipping",
    "checkout.frete_calcular": "Select delivery address to calculate",
    "checkout.total": "Total",
    "checkout.sinal": "To pay now (deposit)",
    "checkout.restante": "To pay on delivery",
    "checkout.prazo_titulo": "Estimated delivery time",
    "checkout.prazo_dias_uteis": "{min}–{max} working days",
    "checkout.prazo_limitado_encomenda": "limited by the pre-order product",
    "checkout.prazo_importados": "directly imported products",
    "checkout.prazo_em_stock": "in-stock products",
    "checkout.acoes_titulo": "Complete quote",
    "checkout.btn_pdf": "Download PDF",
    "checkout.btn_whatsapp": "Send via WhatsApp",
    "checkout.btn_whatsapp_full": "Send on WhatsApp",
    "checkout.prazo_eyebrow": "Estimated delivery",
    "checkout.termos_titulo": "Payment terms",
    "checkout.termos_em_stock": "In-stock products: 60% at order + 40% on delivery",
    "checkout.termos_sob_enc": "Pre-order products: 75% at order + 25% on delivery",
    "checkout.termos_so_stock": "60% at order + 40% on delivery",
    "checkout.termos_so_enc": "75% at order + 25% on delivery",
    "checkout.info_envio": "When you submit, you'll receive the quote PDF and WhatsApp opens with a pre-filled message.",
    "checkout.aviso_minimo_bloqueado": "Minimum quote not reached.",
    "checkout.cambio_titulo": "Equivalent in Rand (ZAR)",
    "checkout.cambio_taxa": "Current rate: 1 MZN = {taxa} R",
    "checkout.cambio_actualizada": "updated on {data}",
    "checkout.cambio_aviso": "ZAR values are reference only. Payment is processed in Metical (MZN).",

    // ── Countries ──────────────────────────────────────
    "pais.mz": "Mozambique",
    "pais.za": "South Africa",

    // ── Toast / Messages ───────────────────────────────
    "toast.preencha_obrigatorios": "Fill in the required fields",
    "toast.preencha_telefone": "Fill in your phone",
    "toast.preencha_endereco": "Fill in the complete address",
    "toast.escolha_pais": "Choose the delivery country",
    "toast.escolha_provincia": "Choose the province",
    "toast.preencha_campo": "Fill in: {campo}",
    "toast.adicione_antes": "Add products before continuing.",
    "toast.carrinho_vazio": "The cart is empty.",
    "toast.minimo_faltam": "Minimum quote not reached — {valor} short",
    "toast.pdf_gerado": "PDF generated successfully!",

    // ── Footer ─────────────────────────────────────────
    "footer.tagline": "Strokes that tell Stories.",
    "footer.descricao": "Professional artistic supplies imported directly from Asia and America. Strokes that tell Stories.",
    "footer.loja_titulo": "Shop",
    "footer.loja_catalogo": "Catalogue",
    "footer.loja_catalogo_completo": "Full Catalogue",
    "footer.loja_cotacao": "Get a Quote",
    "footer.loja_destaque": "Featured Products",
    "footer.loja_procurar": "Search Products",
    "footer.loja_como_funciona": "How it works",
    "footer.loja_entrega": "Delivery",
    "footer.empresa_titulo": "Company",
    "footer.empresa_sobre": "About us",
    "footer.empresa_sobre_lumart": "About Lumart",
    "footer.empresa_faq": "FAQ",
    "footer.empresa_faq_long": "Frequently Asked Questions",
    "footer.empresa_devolucao": "Returns",
    "footer.empresa_termos": "Terms",
    "footer.empresa_privacidade": "Privacy",
    "footer.empresa_contactar": "Contact",
    "footer.ajuda_titulo": "Help",
    "footer.ajuda_entrega": "Delivery Policy",
    "footer.ajuda_devolucao": "Returns Policy",
    "footer.ajuda_termos": "Terms and Conditions",
    "footer.contacto_titulo": "Contact",
    "footer.redes_titulo": "Follow us",
    "footer.pagamentos_label": "We accept:",
    "footer.copyright": "© {ano} Lumart Comercial · All rights reserved",
    "footer.copyright_resto": "All rights reserved.",
    "footer.feito_em": "Made in Chibuto · Mozambique",

    // ── PWA Banner ─────────────────────────────────────
    "pwa.titulo": "Install Lumart",
    "pwa.texto": "Quick access to your quotes, even offline.",
    "pwa.btn_dispensar": "Not now",
    "pwa.btn_instalar": "Install",
    "pwa.instalada_toast": "Lumart installed successfully!",

    // ── Language suggestion ────────────────────────────
    "i18n.sugerir_en": "We noticed your browser is in English. Switch to English?",
    "i18n.btn_sim_en": "Yes, switch",
    "i18n.btn_nao_pt": "No, keep PT",

    // ── PDF / WhatsApp ─────────────────────────────────
    "pdf.titulo": "QUOTE",
    "pdf.numero": "Quote No.",
    "pdf.data": "Date",
    "pdf.cliente": "CUSTOMER",
    "pdf.entrega": "DELIVERY",
    "pdf.produtos": "PRODUCTS",
    "pdf.codigo": "Code",
    "pdf.descricao": "PRODUCT",
    "pdf.qtd": "QTY",
    "pdf.preco_un": "UNIT",
    "pdf.subtotal_item": "SUBTOTAL",
    "pdf.subtotal": "Subtotal",
    "pdf.frete_pdf": "Shipping",
    "pdf.total": "TOTAL",
    "pdf.pagamento_titulo": "PAYMENT",
    "pdf.sinal_label": "TO PAY NOW (DEPOSIT)",
    "pdf.restante_label": "TO PAY ON DELIVERY",
    "pdf.prazo_label": "ESTIMATED DELIVERY",
    "pdf.endereco_label": "DELIVERY",
    "pdf.observacoes_label": "Notes",
    "pdf.referencia": "Ref",
    "pdf.validade": "Quote valid for 7 days from issue date",
    "pdf.frete_pago_sinal": "Shipping paid at order time (together with the deposit)",
    "pdf.termos_titulo": "TERMS AND CONDITIONS",
    "pdf.zar_titulo": "EQUIVALENT IN RAND (ZAR)",
    "pdf.zar_taxa": "Rate: 1 MZN = {valor} R · updated on {data}",
    "pdf.zar_aviso": "ZAR values are reference. Payment processed in Metical (MZN).",
    "pdf.dias_uteis": "{min}–{max} working days",
    "pdf.slogan": "Strokes that tell Stories",

    // ── WhatsApp message ───────────────────────────────
    "wpp.intro": "Hi! I'm *{nome}* and I'd like to confirm quote {num}.",
    "wpp.produtos_titulo": "PRODUCTS:",
    "wpp.subtotal_label": "Subtotal:",
    "wpp.frete_label": "Shipping:",
    "wpp.total_label": "TOTAL:",
    "wpp.pagamento_titulo": "PAYMENT:",
    "wpp.sinal_agora": "Deposit (now):",
    "wpp.na_entrega": "On delivery:",
    "wpp.endereco_titulo": "DELIVERY ADDRESS:",
    "wpp.telefone_label": "Phone:",
    "wpp.entrega_estimada": "Estimated delivery:",
    "wpp.obs_label": "Notes:",
    "wpp.pdf_anexo": "Quote PDF attached.",
    "wpp.zar_titulo": "EQUIVALENT IN RAND (ZAR):",
    "wpp.zar_subtotal": "Subtotal:",
    "wpp.zar_frete": "Shipping:",
    "wpp.zar_total": "Total:",
    "wpp.zar_sinal": "Deposit:",
    "wpp.zar_restante": "Balance:",
    "wpp.zar_taxa": "Rate: 1 MZN = {valor} R · {data}",
    "wpp.zar_aviso": "Payment processed in Metical (MZN).",
    "wpp.referencia": "Landmark:",
    "wpp.prazo_dias": "{min}–{max} working days",
    "wpp.prazo_confirmar": "to confirm",
  },
};

// ─────────────────────────────────────────────────────────────
//  API pública
// ─────────────────────────────────────────────────────────────

/** Devolve a tradução de uma chave, substituindo {placeholders}. */
function t(chave, params = {}) {
  const dict = TRADUCOES[LANG_ACTUAL] || TRADUCOES[I18N_DEFAULT];
  let texto = dict[chave];

  // Fallback para PT se chave não existir em EN
  if (texto === undefined && LANG_ACTUAL !== I18N_DEFAULT) {
    texto = TRADUCOES[I18N_DEFAULT][chave];
  }

  // Se ainda não existir, devolve a própria chave (útil para detectar TODOs)
  if (texto === undefined) return chave;

  // Substituir {placeholders}
  return texto.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? params[key] : "{" + key + "}"
  );
}

/** Devolve o idioma actual. */
function getLang() { return LANG_ACTUAL; }

/** Define o idioma (re-renderiza páginas que usam i18n). */
function setLang(lang) {
  if (!I18N_SUPPORTED.includes(lang)) lang = I18N_DEFAULT;
  if (LANG_ACTUAL === lang) return;
  LANG_ACTUAL = lang;
  try { localStorage.setItem(I18N_STORAGE_KEY, lang); } catch (e) {}
  document.documentElement.lang = lang === "pt" ? "pt-MZ" : "en";
  aplicarI18nNoDOM();
  // Evento custom para outros scripts re-renderizarem
  document.dispatchEvent(new CustomEvent("lumart:lang-changed", { detail: { lang } }));
}

/** Alterna entre PT e EN. */
function alternarLang() {
  setLang(LANG_ACTUAL === "pt" ? "en" : "pt");
}

// ─────────────────────────────────────────────────────────────
//  Inicialização
// ─────────────────────────────────────────────────────────────
function detectarIdiomaInicial() {
  // 1. localStorage (escolha explícita do utilizador)
  try {
    const guardado = localStorage.getItem(I18N_STORAGE_KEY);
    if (guardado && I18N_SUPPORTED.includes(guardado)) return guardado;
  } catch (e) {}

  // 2. Querystring ?lang=xx
  try {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get("lang");
    if (queryLang && I18N_SUPPORTED.includes(queryLang)) {
      try { localStorage.setItem(I18N_STORAGE_KEY, queryLang); } catch (e) {}
      return queryLang;
    }
  } catch (e) {}

  // 3. Default PT
  return I18N_DEFAULT;
}

/** Devemos sugerir EN? (browser em inglês + 1º acesso) */
function deveSugerirEn() {
  try {
    if (localStorage.getItem(I18N_STORAGE_KEY)) return false; // já escolheu
    if (localStorage.getItem(I18N_SUGERIDO_KEY)) return false; // já sugerimos
    const nav = (navigator.language || "pt").toLowerCase();
    return nav.startsWith("en");
  } catch (e) { return false; }
}

/** Aplica traduções aos elementos [data-i18n*]. */
function aplicarI18nNoDOM(root) {
  const scope = root || document;

  // Textos
  scope.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    const params = parseDataI18nParams(el);
    el.innerHTML = t(chave, params);
  });

  // Placeholders
  scope.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });

  // aria-label
  scope.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
  });

  // title
  scope.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });

  // Sincronizar o estado visual do switcher
  document.querySelectorAll(".btn-lang").forEach(b => {
    const v = b.getAttribute("data-lang");
    b.classList.toggle("ativo", v === LANG_ACTUAL);
  });
}

function parseDataI18nParams(el) {
  const raw = el.getAttribute("data-i18n-params");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

// ─────────────────────────────────────────────────────────────
//  Auto-init no DOMContentLoaded
// ─────────────────────────────────────────────────────────────
LANG_ACTUAL = detectarIdiomaInicial();
document.documentElement.lang = LANG_ACTUAL === "pt" ? "pt-MZ" : "en";

document.addEventListener("DOMContentLoaded", () => {
  aplicarI18nNoDOM();

  // Sugerir EN se aplicável (após 1.5s para não interromper)
  if (deveSugerirEn()) {
    setTimeout(() => sugerirIdiomaEn(), 1500);
  }
});

function sugerirIdiomaEn() {
  try { localStorage.setItem(I18N_SUGERIDO_KEY, "1"); } catch (e) {}

  const banner = document.createElement("div");
  banner.id = "i18n-suggest-banner";
  banner.className = "i18n-suggest";
  banner.setAttribute("role", "dialog");
  banner.innerHTML = `
    <span class="lmi lmi-sm" aria-hidden="true">translate</span>
    <span class="i18n-suggest-texto">${t("i18n.sugerir_en")}</span>
    <div class="i18n-suggest-acoes">
      <button class="i18n-suggest-btn i18n-suggest-primario" onclick="setLang('en');this.closest('.i18n-suggest').remove()">${t("i18n.btn_sim_en")}</button>
      <button class="i18n-suggest-btn" onclick="this.closest('.i18n-suggest').remove()">${t("i18n.btn_nao_pt")}</button>
    </div>
  `;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("visivel"));

  // Auto-dismiss em 12s
  setTimeout(() => {
    banner.classList.remove("visivel");
    setTimeout(() => banner.remove(), 350);
  }, 12000);
}
