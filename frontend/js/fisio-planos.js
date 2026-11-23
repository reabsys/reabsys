const conteudo = document.getElementById('fisio-planos-conteudo');
const botoes = conteudo.querySelectorAll('[data-plano]');
const confirmacao = document.getElementById('fisio-planos-confirmacao');
const aviso = document.getElementById('fisio-planos-aviso');
let tempoAviso;

function verificarSessao() {
    let usuario;
    try {
        usuario = lerSessaoMenu();
    } catch {
        usuario = null;
    }

    conteudo.hidden = !usuario;
    if (!usuario) {
        window.location.replace('login.html');
    }
}

for (const botao of botoes) {
    botao.addEventListener('click', function () {
        for (const opcao of botoes) {
            opcao.setAttribute('aria-pressed', String(opcao === botao));
        }

        const mensagem = 'Plano ' + botao.dataset.plano + ' selecionado. Nenhuma cobrança foi realizada.';
        confirmacao.textContent = mensagem;
        confirmacao.hidden = false;
        aviso.textContent = mensagem;
        aviso.hidden = false;
        clearTimeout(tempoAviso);
        tempoAviso = setTimeout(function () {
            aviso.hidden = true;
        }, 6000);
    });
}

window.addEventListener('pageshow', verificarSessao);
window.addEventListener('storage', verificarSessao);
verificarSessao();
