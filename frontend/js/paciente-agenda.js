const painel = document.getElementById('paciente-agenda-painel');
const saudacao = document.getElementById('paciente-agenda-saudacao');
const acesso = document.getElementById('paciente-agenda-acesso');
const erro = document.getElementById('paciente-agenda-erro');
const grupos = ['proximas', 'passadas', 'canceladas'];
const situacoes = { agendada: 'Agendada', concluida: 'Concluída', cancelada: 'Cancelada' };

function horarioSessao(sessao) {
    return new Date(sessao.data + 'T' + sessao.hora).getTime();
}

function mostrarConsultas(grupo, sessoes, profissional) {
    const lista = document.getElementById('paciente-agenda-' + grupo);
    document.getElementById('paciente-agenda-' + grupo + '-vazio').hidden = sessoes.length > 0;
    const modelo = document.getElementById('paciente-agenda-modelo');
    for (const sessao of sessoes) {
        const consulta = modelo.content.firstElementChild.cloneNode(true);
        const data = new Date(horarioSessao(sessao)).toLocaleDateString('pt-BR', { dateStyle: 'long' });
        consulta.querySelector('h3').textContent = data + ' às ' + sessao.hora;
        consulta.querySelector('.paciente-agenda-detalhes').textContent =
            sessao.tipo + ' · ' + sessao.duracao + ' minutos · ' + profissional;
        const situacao = consulta.querySelector('.paciente-agenda-situacao');
        situacao.textContent = situacoes[sessao.situacao];
        situacao.dataset.situacao = sessao.situacao;
        lista.appendChild(consulta);
    }
}

function mostrarAgenda() {
    painel.hidden = true;
    acesso.hidden = true;
    erro.hidden = true;
    saudacao.textContent = 'Área do paciente';
    for (const grupo of grupos) {
        document.getElementById('paciente-agenda-' + grupo).replaceChildren();
    }
    try {
        const vinculo = lerDadosPaciente();
        if (!vinculo) {
            acesso.hidden = false;
            return;
        }
        const agora = Date.now();
        const sessoes = [...(vinculo.paciente.sessoes || [])];
        sessoes.sort((a, b) => horarioSessao(a) - horarioSessao(b));
        const profissional = vinculo.dados.perfil?.nome || 'Fisioterapeuta responsável';
        mostrarConsultas('proximas', sessoes.filter(sessao =>
            sessao.situacao === 'agendada' && horarioSessao(sessao) >= agora
        ), profissional);
        mostrarConsultas('passadas', sessoes.filter(sessao =>
            sessao.situacao !== 'cancelada' && (sessao.situacao === 'concluida' || horarioSessao(sessao) < agora)
        ), profissional);
        mostrarConsultas('canceladas', sessoes.filter(sessao => sessao.situacao === 'cancelada'), profissional);
        saudacao.textContent = 'Área do paciente · ' + vinculo.paciente.nome;
        painel.hidden = false;
    } catch {
        erro.hidden = false;
    }
}

window.addEventListener('pageshow', mostrarAgenda);
window.addEventListener('storage', mostrarAgenda);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) mostrarAgenda();
});
mostrarAgenda();
