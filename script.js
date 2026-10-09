const CHAVE_CARRINHO = "carrinho";
function lerBruto() {
    try {
        const valor = localStorage.getItem(CHAVE_CARRINHO);
        if (valor !== null) return valor;
    } catch (erro)
    try {
        const reserva = JSON.parse(window.name);
        if (reserva && reserva.essenzaCarrinho) return reserva.essenzaCarrinho;
    } catch (erro) 
    return null;
}
function gravarBruto(texto) {
    try { localStorage.setItem(CHAVE_CARRINHO, texto); } catch (erro)
    try { window.name = JSON.stringify({ essenzaCarrinho: texto }); } catch (erro) 
function lerCarrinho() {
    try {
        const dados = JSON.parse(lerBruto());
        if (!Array.isArray(dados)) return [];
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
function salvarCarrinho(carrinho) {
    gravarBruto(JSON.stringify(carrinho));
}
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
function formatarPreco(valor) {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function calcularTotal(carrinho) {
    const centavos = carrinho.reduce(function (soma, item) {
        return soma + Math.round(item.preco * 100) * item.quantidade;
    }, 0);

    return centavos / 100;
}
function quantidadeTotal(carrinho) {
    return carrinho.reduce(function (soma, item) {
        return soma + item.quantidade;
    }, 0);
}
function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}
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
function atualizarContador() {
    const contador = document.getElementById("contador-carrinho");
    if (contador) {
        contador.textContent = quantidadeTotal(lerCarrinho());
    }
}

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
function removerProduto(indice) {
    const carrinho = lerCarrinho();
    carrinho.splice(indice, 1);
    salvarCarrinho(carrinho);
    atualizarContador();
    mostrarCarrinho();
}
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
let totalCompra = 0;
let pagamentoSelecionado = "";
function mostrarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const totalElemento = document.getElementById("total-carrinho");
    if (!lista || !totalElemento) return;

    const carrinho = lerCarrinho();
    totalCompra = calcularTotal(carrinho);
    totalElemento.textContent = formatarPreco(totalCompra);
    const resumoItens = document.getElementById("resumo-itens");
    if (resumoItens) resumoItens.textContent = quantidadeTotal(carrinho);
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
    const caixa = document.getElementById("pagamento");
    if (caixa && caixa.style.display === "block") {
        if (pagamentoSelecionado) {
            selecionarPagamento(pagamentoSelecionado);
        } else {
            document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
        }
    }
}
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
function finalizarCompra() {
    const carrinho = lerCarrinho();
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    totalCompra = calcularTotal(carrinho);
    pagamentoSelecionado = "";
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
function selecionarPagamento(tipo) {
    pagamentoSelecionado = tipo;
    const nomes = { pix: "Pix", boleto: "Boleto", credito: "Cartão de crédito" };
    document.querySelectorAll(".forma-pagamento button").forEach(function (botao) {
        botao.classList.remove("ativo");
    });
    document.getElementById("btn-" + tipo).classList.add("ativo");
    document.getElementById("forma-escolhida").textContent = nomes[tipo];
    const areaParcelas = document.getElementById("opcoes-parcelamento");
    if (tipo !== "credito") {
        areaParcelas.style.display = "none";
        document.getElementById("texto-parcela").textContent = "Pagamento à vista";
        document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
        return;
    }
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
function atualizarParcela() {
    const parcelas = Number(document.getElementById("parcelas").value) || 1;
    document.getElementById("texto-parcela").textContent =
        parcelas === 1
            ? "Pagamento à vista"
            : parcelas + "x de R$ " + formatarPreco(totalCompra / parcelas) + " sem juros";
    document.getElementById("valor-pagamento").textContent = formatarPreco(totalCompra);
}
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
    salvarCarrinho([]);
    fecharPagamento();
    atualizarContador();
    mostrarCarrinho();
}
function fecharPagamento() {
    const caixa = document.getElementById("pagamento");
    if (caixa) caixa.style.display = "none";
    pagamentoSelecionado = "";
}
function ativarFormularioContato() {
    const form = document.querySelector(".formulario form");
    if (!form) return;
    form.addEventListener("submit", function (evento) {
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
window.addEventListener("storage", function () {
    atualizarContador();
    mostrarCarrinho();
});
