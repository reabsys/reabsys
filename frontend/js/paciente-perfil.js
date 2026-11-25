const painel = document.getElementById('paciente-perfil-painel');
const saudacao = document.getElementById('paciente-perfil-saudacao');
const acesso = document.getElementById('paciente-perfil-acesso');
const erro = document.getElementById('paciente-perfil-erro');
const nome = document.getElementById('paciente-perfil-nome');
const email = document.getElementById('paciente-perfil-email');
const acompanhamento = document.getElementById('paciente-perfil-acompanhamento');

function mostrarPerfil() {
    painel.hidden = true;
    acesso.hidden = true;
    erro.hidden = true;
    saudacao.textContent = 'Área do paciente';
    nome.textContent = '';
    email.textContent = '';
    acompanhamento.textContent = '';
    try {
        const vinculo = lerDadosPaciente();
        if (!vinculo) {
            acesso.hidden = false;
            return;
        }
        nome.textContent = vinculo.paciente.nome;
        email.textContent = vinculo.paciente.email;
        acompanhamento.textContent = vinculo.paciente.acompanhamento;
        saudacao.textContent = 'Área do paciente · ' + vinculo.paciente.nome;
        painel.hidden = false;
    } catch {
        erro.textContent = 'Não foi possível ler seu perfil neste navegador.';
        erro.hidden = false;
    }
}

document.getElementById('paciente-perfil-sair').addEventListener('click', function () {
    try {
        sessionStorage.removeItem('reabsys_paciente');
        mostrarPerfil();
    } catch {
        erro.textContent = 'Não foi possível encerrar o acesso do paciente.';
        erro.hidden = false;
    }
});

window.addEventListener('pageshow', mostrarPerfil);
window.addEventListener('storage', mostrarPerfil);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) mostrarPerfil();
});
mostrarPerfil();
