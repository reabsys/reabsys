const conteudo = document.getElementById('fisio-perfil-conteudo');
const formulario = document.getElementById('fisio-perfil-form');
const campos = formulario.elements;
const erro = document.getElementById('fisio-perfil-erro');
const aviso = document.getElementById('fisio-perfil-aviso');
let crefitoAtual = '';
let tempoAviso;

function mostrarErro(mensagem) {
    aviso.hidden = true;
    erro.textContent = mensagem;
    erro.hidden = false;
}

function verificarSessao() {
    let usuario;
    try {
        usuario = lerSessaoMenu();
    } catch {
        usuario = null;
    }
    if (!usuario) {
        conteudo.hidden = true;
        window.location.replace('login.html');
    }
    return usuario;
}

function carregarPerfil(usuario) {
    if (!usuario) return;
    crefitoAtual = usuario.crefito;
    formulario.reset();
    aviso.hidden = true;
    erro.hidden = true;
    conteudo.hidden = false;
    try {
        const perfil = lerDadosMenu(crefitoAtual).perfil || {};
        campos.nome.value = perfil.nome || '';
        campos.email.value = perfil.email || '';
        campos.crefito.value = perfil.crefito || '';
    } catch {
        mostrarErro('Não foi possível carregar o perfil salvo.');
    }
}

formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const usuario = verificarSessao();
    if (!usuario) return;
    if (usuario.crefito !== crefitoAtual) {
        carregarPerfil(usuario);
        mostrarErro('A sessão mudou. Confira o perfil antes de salvar.');
        return;
    }

    const nome = campos.nome.value.trim();
    if (nome.length < 3) {
        mostrarErro('Informe um nome com pelo menos 3 caracteres.');
        campos.nome.focus();
        return;
    }
    if (!formulario.reportValidity()) return;

    try {
        const dados = lerDadosMenu(crefitoAtual);
        dados.perfil = {
            nome: nome,
            email: campos.email.value.trim(),
            crefito: campos.crefito.value.trim()
        };
        salvarDadosMenu(crefitoAtual, dados);
        campos.nome.value = dados.perfil.nome;
        campos.crefito.value = dados.perfil.crefito;
        erro.hidden = true;
        aviso.hidden = false;
        clearTimeout(tempoAviso);
        tempoAviso = setTimeout(() => { aviso.hidden = true; }, 6000);
    } catch {
        mostrarErro('Não foi possível salvar o perfil neste navegador.');
    }
});

document.getElementById('fisio-perfil-sair').addEventListener('click', function () {
    try {
        sessionStorage.removeItem('reabsys_usuario');
        conteudo.hidden = true;
        window.location.replace('login.html');
    } catch {
        mostrarErro('Não foi possível encerrar a sessão.');
    }
});

window.addEventListener('pageshow', function (evento) {
    if (evento.persisted) carregarPerfil(verificarSessao());
});
document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    const usuario = verificarSessao();
    if (usuario && usuario.crefito !== crefitoAtual) carregarPerfil(usuario);
});
carregarPerfil(verificarSessao());
