/* =====================================================
   ESSENZA - script.js
   Carrinho de compras, somatória, pagamento e formulário
   de contato. Este mesmo arquivo é usado em TODAS as páginas.
   ===================================================== */


/* ---------- 1. DADOS DO CARRINHO (localStorage) ---------- */

// Nome da "gaveta" onde o carrinho fica guardado no navegador
const CHAVE_CARRINHO = "carrinho";

// Lê o texto bruto do carrinho. Tenta o localStorage; se o navegador bloquear
// (acontece em alguns navegadores ao abrir o arquivo direto do computador),
// usa o window.name como reserva, que também sobrevive à troca de página.
function lerBruto() {
    try {
        const valor = localStorage.getItem(CHAVE_CARRINHO);
        if (valor !== null) return valor;
    } catch (erro) { /* localStorage bloqueado */ }

    try {
        const reserva = JSON.parse(window.name);
        if (reserva && reserva.essenzaCarrinho) return reserva.essenzaCarrinho;
    } catch (erro) { /* window.name vazio */ }

    return null;
}

// Grava o texto do carrinho nos dois lugares (principal e reserva)
function gravarBruto(texto) {
    try { localStorage.setItem(CHAVE_CARRINHO, texto); } catch (erro) { /* bloqueado */ }
    try { window.name = JSON.stringify({ essenzaCarrinho: texto }); } catch (erro) { /* ignora */ }
}

// Lê o carrinho salvo. Se não existir (ou estiver corrompido), devolve lista vazia.
function lerCarrinho() {
    try {
        const dados = JSON.parse(lerBruto());
        if (!Array.isArray(dados)) return [];

        // Garante que todo item tenha nome, preço e quantidade válidos
        return dados
            .map(function (item) {
                return {
                    nome: String(item.nome),
                    preco: Number(item.preco),
                    quantidade: Number(item.quantidade) || 1
                };
            })
            .filter(function (item) {
                return item.nome && !isNaN(item.preco);
            });
    } catch (erro) {
        return [];
    }
}

// Grava o carrinho (só guarda texto, por isso o JSON.stringify)
function salvarCarrinho(carrinho) {
    gravarBruto(JSON.stringify(carrinho));
}


// Foto de cada produto (usada para mostrar a miniatura na página do carrinho)
const IMAGENS = {
    "Perfume Essenza": "essenza.jpeg",
    "Perfume Floral": "floral.jpeg",
    "Perfume Elegance": "elegance.jpeg",
    "Perfume Intense": "intense.jpeg",
    "Creme Hidratante": "creme.jpeg",
    "Sérum Facial": "serum.jpeg",
    "Gloss Essenza": "gloss.jpeg",
    "Máscara Facial": "mascara.jpeg",
    "Kit Essenza": "kit.jpeg",
    "Eyes Pad": "olhos.jpeg"
};


/* ---------- 2. FUNÇÕES AUXILIARES ---------- */

// Formata número como dinheiro brasileiro: 1234.5 -> "1.234,50"
function formatarPreco(valor) {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// SOMATÓRIA dos valores. Calcula em centavos (números inteiros)
// para evitar erros de ponto flutuante do JavaScript (ex.: 0.1 + 0.2 = 0.30000000000000004)
function calcularTotal(carrinho) {
    const centavos = carrinho.reduce(function (soma, item) {
        return soma + Math.round(item.preco * 100) * item.quantidade;
    }, 0);

    return centavos / 100;
}

// Soma as quantidades (2 perfumes + 1 gloss = 3 itens)
function quantidadeTotal(carrinho) {
    return carrinho.reduce(function (soma, item) {
        return soma + item.quantidade;
    }, 0);
}

// Evita que um texto vire HTML quando inserido com innerHTML
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

// Mensagem rápida que aparece no canto da tela e some sozinha
function mostrarAviso(mensagem, tipo) {
    const aviso = document.createElement("div");
    aviso.textContent = mensagem;

    aviso.style.position = "fixed";
    aviso.style.right = "20px";
    aviso.style.bottom = "20px";
    aviso.style.zIndex = "9999";
    aviso.style.padding = "14px 22px";
    aviso.style.borderRadius = "30px";
    aviso.style.color = "#fff";
    aviso.style.fontWeight = "600";
    aviso.style.boxShadow = "0 8px 22px rgba(0,0,0,0.20)";
    aviso.style.background = tipo === "erro" ? "#b5524f" : "#657466";
    aviso.style.transition = "opacity 0.4s";

    document.body.appendChild(aviso);

    setTimeout(function () { aviso.style.opacity = "0"; }, 2200);
    setTimeout(function () { aviso.remove(); }, 2700);
}


/* ---------- 3. CONTADOR DO NAVBAR ---------- */

// Mostra no navbar quantos produtos há no carrinho
function atualizarContador() {
    const contador = document.getElementById("contador-carrinho");

    if (contador) {
        contador.textContent = quantidadeTotal(lerCarrinho());
    }
}


/* ---------- 4. AÇÕES DO CARRINHO ---------- */

// Adiciona um produto. Se já existir, só aumenta a quantidade.
function adicionarProduto(nome, preco) {
    const carrinho = lerCarrinho();

    const existente = carrinho.find(function (item) {
        return item.nome === nome;
    });

    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push({ nome: nome, preco: Number(preco), quantidade: 1 });
    }

    salvarCarrinho(carrinho);
    atualizarContador();
    mostrarAviso(nome + " foi adicionado ao carrinho!");
}

// Remove o produto inteiro da lista
function removerProduto(indice) {
    const carrinho = lerCarrinho();

    carrinho.splice(indice, 1);

    salvarCarrinho(carrinho);
    atualizarContador();
    mostrarCarrinho();
}

// Aumenta (+1) ou diminui (-1) a quantidade. Se chegar a 0, remove o item.
function alterarQuantidade(indice, mudanca) {
    const carrinho = lerCarrinho();

    if (!carrinho[indice]) return;

    carrinho[indice].quantidade += mudanca;

    if (carrinho[indice].quantidade <= 0) {
        carrinho.splice(indice, 1);
    }

    salvarCarrinho(carrinho);
    atualizarContador();
    mostrarCarrinho();
}


/* ---------- 5. PÁGINA DO CARRINHO ---------- */

// Valor total atual e forma de pagamento escolhida (usados na parte de pagamento)
let totalCompra = 0;
let pagamentoSelecionado = "";

// Desenha a lista de produtos e o TOTAL na página carrinho.html
function mostrarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const totalElemento = document.getElementById("total-carrinho");

    // Se não estamos na página do carrinho, não faz nada
    if (!lista || !totalElemento) return;

    const carrinho = lerCarrinho();

    totalCompra = calcularTotal(carrinho);
    totalElemento.textContent = formatarPreco(totalCompra);

    // Resumo lateral: quantidade total de itens
    const resumoItens = document.getElementById("resumo-itens");
    if (resumoItens) resumoItens.textContent = quantidadeTotal(carrinho);

    // Carrinho vazio
    if (carrinho.length === 0) {
        lista.innerHTML =
            '<div class="carrinho-vazio">' +
                "<h3>Seu carrinho está vazio</h3>" +
                "<p>Escolha seus produtos favoritos na ESSENZA.</p>" +
                '<a href="produtos.html" class="btn btn-primary">Ver produtos</a>' +
            "</div>";

        fecharPagamento();
        return;
    }

    // Monta um cartão para cada produto
    let html = "";

    carrinho.forEach(function (item, indice) {
        const subtotal = (Math.round(item.preco * 100) * item.quantidade) / 100;
        const foto = IMAGENS[item.nome];

        html +=
            '<article class="item-carrinho">' +
                (foto
                    ? '<img src="' + foto + '" alt="' + escaparHTML(item.nome) + '">'
                    : '<div class="item-sem-imagem"></div>') +

                '<div class="item-info">' +
                    "<h4>" + escaparHTML(item.nome) + "</h4>" +
                    '<p class="item-preco">R$ ' + formatarPreco(item.preco) + " cada</p>" +
                "</div>" +

                '<div class="item-qtd">' +
                    '<button data-acao="diminuir" data-indice="' + indice + '" aria-label="Diminuir quantidade">−</button>' +
                    "<span>" + item.quantidade + "</span>" +
                    '<button data-acao="aumentar" data-indice="' + indice + '" aria-label="Aumentar quantidade">+</button>' +
                "</div>" +

                '<div class="item-subtotal">R$ ' + formatarPreco(subtotal) + "</div>" +

                '<button class="item-remover" data-acao="remover" data-indice="' + indice + '">Remover</button>' +
            "</article>";
    });

    lista.innerHTML = html;

    // Se a área de pagamento estiver aberta, atualiza os valores dela também
    const caixa = document.getElementById("pagamento");
    if (caixa && caixa.style.display === "block") {
        if (pagamentoSelecionado) {
            selecionarPagamento(pagamentoSelecionado);
        } else {
            document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
        }
    }
}

// Um único "ouvinte" na lista cuida dos botões −, + e Remover (delegação de eventos)
function ativarBotoesDoCarrinho() {
    const lista = document.getElementById("lista-carrinho");

    if (!lista) return;

    lista.addEventListener("click", function (evento) {
        const botao = evento.target.closest("button[data-acao]");

        if (!botao) return;

        const indice = Number(botao.getAttribute("data-indice"));
        const acao = botao.getAttribute("data-acao");

        if (acao === "aumentar") alterarQuantidade(indice, 1);
        if (acao === "diminuir") alterarQuantidade(indice, -1);
        if (acao === "remover") removerProduto(indice);
    });
}


/* ---------- 6. PAGAMENTO ---------- */

// Botão "Finalizar compra": abre a área de pagamento
function finalizarCompra() {
    const carrinho = lerCarrinho();

    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    totalCompra = calcularTotal(carrinho);
    pagamentoSelecionado = "";

    // Limpa escolhas anteriores
    document.querySelectorAll(".forma-pagamento button").forEach(function (botao) {
        botao.classList.remove("ativo");
    });
    document.getElementById("opcoes-parcelamento").style.display = "none";
    document.getElementById("forma-escolhida").textContent = "Selecione uma opção";
    document.getElementById("texto-parcela").textContent = "";
    document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);

    const caixa = document.getElementById("pagamento");
    caixa.style.display = "block";
    caixa.scrollIntoView({ behavior: "smooth" });
}

// Escolha entre Pix, Boleto e Cartão de crédito
function selecionarPagamento(tipo) {
    pagamentoSelecionado = tipo;

    const nomes = { pix: "Pix", boleto: "Boleto", credito: "Cartão de crédito" };

    // Marca só o botão escolhido
    document.querySelectorAll(".forma-pagamento button").forEach(function (botao) {
        botao.classList.remove("ativo");
    });
    document.getElementById("btn-" + tipo).classList.add("ativo");

    document.getElementById("forma-escolhida").textContent = nomes[tipo];

    const areaParcelas = document.getElementById("opcoes-parcelamento");

    // Pix e boleto: à vista
    if (tipo !== "credito") {
        areaParcelas.style.display = "none";
        document.getElementById("texto-parcela").textContent = "Pagamento à vista";
        document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
        return;
    }

    // Cartão: compras abaixo de R$ 300 só à vista; a partir de R$ 300, até 5x sem juros
    const select = document.getElementById("parcelas");
    const maximo = totalCompra < 300 ? 1 : 5;
    let opcoes = "";

    for (let i = 1; i <= maximo; i++) {
        opcoes += '<option value="' + i + '">' + i + "x de R$ " + formatarPreco(totalCompra / i) + "</option>";
    }

    select.innerHTML = opcoes;
    areaParcelas.style.display = "block";

    atualizarParcela();
}

// Atualiza o resumo quando o cliente troca o número de parcelas
function atualizarParcela() {
    const parcelas = Number(document.getElementById("parcelas").value) || 1;

    document.getElementById("texto-parcela").textContent =
        parcelas === 1
            ? "Pagamento à vista"
            : parcelas + "x de R$ " + formatarPreco(totalCompra / parcelas) + " sem juros";

    document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
}

// Botão "Confirmar pagamento"
function confirmarPagamento() {
    if (!pagamentoSelecionado) {
        alert("Selecione uma forma de pagamento.");
        return;
    }

    let mensagem = "";

    if (pagamentoSelecionado === "pix") {
        mensagem = "Pagamento via Pix selecionado.";
    } else if (pagamentoSelecionado === "boleto") {
        mensagem = "Boleto selecionado.";
    } else {
        const parcelas = Number(document.getElementById("parcelas").value) || 1;

        mensagem = parcelas === 1
            ? "Cartão de crédito à vista selecionado."
            : "Cartão de crédito em " + parcelas + "x selecionado.";
    }

    alert(
        "Pedido realizado com sucesso!\n\n" +
        mensagem +
        "\n\nTotal: R$ " + formatarPreco(totalCompra)
    );

    // Pedido concluído: esvazia o carrinho
    salvarCarrinho([]);

    fecharPagamento();
    atualizarContador();
    mostrarCarrinho();
}

// Botão "Voltar": fecha a área de pagamento
function fecharPagamento() {
    const caixa = document.getElementById("pagamento");

    if (caixa) caixa.style.display = "none";

    pagamentoSelecionado = "";
}


/* ---------- 7. FORMULÁRIO DE CONTATO ---------- */

function ativarFormularioContato() {
    const form = document.querySelector(".formulario form");

    if (!form) return;

    form.addEventListener("submit", function (evento) {
        // Impede a página de recarregar
        evento.preventDefault();

        const nome = form.elements["nome"].value.trim();
        const email = form.elements["email"].value.trim();
        const assunto = form.elements["assunto"].value.trim();
        const mensagem = form.elements["mensagem"].value.trim();

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (nome.length < 3) {
            mostrarAviso("Digite seu nome (mínimo 3 letras).", "erro");
            return;
        }
        if (!emailValido) {
            mostrarAviso("Digite um e-mail válido.", "erro");
            return;
        }
        if (assunto === "") {
            mostrarAviso("Digite o assunto.", "erro");
            return;
        }
        if (mensagem.length < 10) {
            mostrarAviso("A mensagem precisa ter pelo menos 10 caracteres.", "erro");
            return;
        }

        mostrarAviso("Mensagem enviada! Obrigado, " + nome + "!");
        form.reset();
    });
}


/* ---------- 8. INICIALIZAÇÃO (roda quando a página abre) ---------- */

// Escuta cliques na página inteira. Qualquer botão com a classe
// "adicionar-carrinho" (index, produtos e páginas de produto) adiciona o item.
// Fica fora do DOMContentLoaded para funcionar em qualquer situação.
document.addEventListener("click", function (evento) {
    const botao = evento.target.closest(".adicionar-carrinho");

    if (!botao) return;

    adicionarProduto(
        botao.getAttribute("data-nome"),
        botao.getAttribute("data-preco")
    );
});

document.addEventListener("DOMContentLoaded", function () {
    ativarBotoesDoCarrinho();
    ativarFormularioContato();
    atualizarContador();
    mostrarCarrinho();
});

// Se o carrinho mudar em outra aba, o contador desta aba acompanha
window.addEventListener("storage", function () {
    atualizarContador();
    mostrarCarrinho();
});