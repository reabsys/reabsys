function elementoAgenda(nome) {
    return document.getElementById('fisio-agenda-' + nome);
}

const formulario = elementoAgenda('form');
const campos = formulario.elements;
const busca = elementoAgenda('busca');
const filtroData = elementoAgenda('filtro-data');
const filtroSituacao = elementoAgenda('filtro-situacao');
const dialogo = elementoAgenda('dialogo');
const situacoes = { agendada: 'Agendada', concluida: 'Concluída', cancelada: 'Cancelada' };
let crefitoAtual = '';
let cancelamento = null;
let tempoAviso;

function dataHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return hoje.getFullYear() + '-' + mes + '-' + dia;
}

function inicioSessao(sessao) {
    return new Date(sessao.data + 'T' + sessao.hora).getTime();
}

function notificar(texto) {
    const aviso = elementoAgenda('aviso');
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(() => { aviso.hidden = true; }, 6000);
}

function mostrarErro(local, texto) {
    const aviso = elementoAgenda(local);
    aviso.textContent = texto;
    aviso.hidden = false;
}

function listarPacientes(pacientes) {
    const selecionado = campos.paciente.value;
    const ativos = pacientes.filter(paciente => paciente.situacao === 'ativo');
    ativos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    campos.paciente.replaceChildren(new Option('Selecione um paciente', ''));
    for (const paciente of ativos) {
        campos.paciente.add(new Option(paciente.nome, paciente.id));
    }
    if (ativos.some(paciente => paciente.id === selecionado)) {
        campos.paciente.value = selecionado;
    }
    elementoAgenda('sem-pacientes').hidden = ativos.length > 0;
    elementoAgenda('agendar').disabled = ativos.length === 0;
}

function cartaoSessao(paciente, sessao) {
    const cartao = elementoAgenda('modelo').content.firstElementChild.cloneNode(true);
    const data = new Date(inicioSessao(sessao));
    cartao.querySelector('.fisio-agenda-dia strong').textContent = data.toLocaleDateString('pt-BR', { day: '2-digit' });
    cartao.querySelector('.fisio-agenda-dia span').textContent = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    cartao.querySelector('h3').textContent = paciente.nome;
    cartao.querySelector('p').textContent = sessao.tipo + ' · ' + sessao.hora + ' · ' + sessao.duracao + ' min';
    const situacao = cartao.querySelector('.fisio-agenda-situacao');
    situacao.textContent = situacoes[sessao.situacao];
    situacao.dataset.situacao = sessao.situacao;

    if (sessao.situacao !== 'agendada') {
        cartao.querySelector('.fisio-agenda-acoes').hidden = true;
        return cartao;
    }

    const concluir = cartao.querySelector('.fisio-agenda-concluir');
    const cancelar = cartao.querySelector('.fisio-agenda-perigo');
    const descricao = 'sessão de ' + paciente.nome + ' em ' + data.toLocaleDateString('pt-BR') + ', às ' + sessao.hora;
    concluir.setAttribute('aria-label', 'Concluir ' + descricao);
    cancelar.setAttribute('aria-label', 'Cancelar ' + descricao);
    concluir.addEventListener('click', () => alterarSituacao(paciente.id, sessao.id, 'concluida'));
    cancelar.addEventListener('click', function () {
        cancelamento = { pacienteId: paciente.id, sessaoId: sessao.id };
        elementoAgenda('descricao').textContent = 'Cancelar a ' + descricao + '? Ela permanecerá no histórico como cancelada.';
        dialogo.showModal();
    });
    return cartao;
}

function normalizarNome(nome) {
    return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function listarSessoes(pacientes) {
    const termo = normalizarNome(busca.value.trim());
    const encontradas = [];
    let total = 0;
    for (const paciente of pacientes) {
        const sessoes = paciente.sessoes || [];
        total += sessoes.length;
        if (!normalizarNome(paciente.nome).includes(termo)) continue;
        for (const sessao of sessoes) {
            if (filtroData.value && sessao.data !== filtroData.value) continue;
            if (filtroSituacao.value && sessao.situacao !== filtroSituacao.value) continue;
            encontradas.push({ paciente, sessao });
        }
    }
    encontradas.sort((a, b) => inicioSessao(a.sessao) - inicioSessao(b.sessao));
    const lista = elementoAgenda('lista');
    lista.replaceChildren();
    for (const item of encontradas) {
        lista.appendChild(cartaoSessao(item.paciente, item.sessao));
    }
    elementoAgenda('contagem').textContent = encontradas.length + ' de ' + total + ' sessões';
    elementoAgenda('vazio').hidden = encontradas.length > 0;
}

function limparFiltros() {
    busca.value = '';
    filtroData.value = '';
    filtroSituacao.value = '';
}

function atualizarTela() {
    const conteudo = elementoAgenda('conteudo');
    try {
        const crefito = lerSessaoMenu()?.crefito || '';
        if (crefito !== crefitoAtual) {
            formulario.reset();
            campos.data.value = dataHoje();
            limparFiltros();
            if (dialogo.open) dialogo.close();
            elementoAgenda('aviso').hidden = true;
            elementoAgenda('erro-form').hidden = true;
            crefitoAtual = crefito;
        }
        elementoAgenda('acesso').hidden = Boolean(crefito);
        elementoAgenda('erro').hidden = true;
        conteudo.hidden = !crefito;
        if (!crefito) return;

        const dados = lerDadosMenu(crefito);
        campos.data.min = dataHoje();
        listarPacientes(dados.pacientes);
        listarSessoes(dados.pacientes);
    } catch {
        conteudo.hidden = true;
        mostrarErro('erro', 'Não foi possível ler a agenda neste navegador.');
    }
}

function dadosParaAlterar() {
    if (!crefitoAtual || lerSessaoMenu()?.crefito !== crefitoAtual) {
        atualizarTela();
        throw new Error('A sessão mudou. Confira o fisioterapeuta antes de continuar.');
    }
    return lerDadosMenu(crefitoAtual);
}

formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    elementoAgenda('erro-form').hidden = true;
    if (!formulario.reportValidity()) return;

    try {
        const dados = dadosParaAlterar();
        const paciente = dados.pacientes.find(item => item.id === campos.paciente.value);
        if (!paciente || paciente.situacao !== 'ativo') {
            throw new Error('Selecione um paciente ativo.');
        }
        const sessao = {
            id: crypto.randomUUID(),
            data: campos.data.value,
            hora: campos.hora.value,
            duracao: Number(campos.duracao.value),
            tipo: campos.tipo.value,
            situacao: 'agendada'
        };
        const inicio = inicioSessao(sessao);
        const fim = inicio + sessao.duracao * 60000;
        if (inicio < Date.now()) {
            throw new Error('Escolha uma data e um horário futuros.');
        }
        for (const ficha of dados.pacientes) {
            for (const outra of ficha.sessoes || []) {
                const outroInicio = inicioSessao(outra);
                if (outra.situacao !== 'cancelada' && inicio < outroInicio + outra.duracao * 60000 && fim > outroInicio) {
                    throw new Error('Já existe uma sessão nesse intervalo. Escolha outro horário.');
                }
            }
        }

        if (!paciente.sessoes) paciente.sessoes = [];
        paciente.sessoes.push(sessao);
        salvarDadosMenu(crefitoAtual, dados);
        formulario.reset();
        campos.data.value = dataHoje();
        limparFiltros();
        filtroData.value = sessao.data;
        atualizarTela();
        notificar('Sessão agendada com sucesso.');
    } catch (erro) {
        mostrarErro('erro-form', erro.name === 'Error' ? erro.message : 'Não foi possível salvar a sessão neste navegador.');
    }
});

function alterarSituacao(pacienteId, sessaoId, situacao) {
    try {
        const dados = dadosParaAlterar();
        const paciente = dados.pacientes.find(item => item.id === pacienteId);
        const sessao = paciente?.sessoes?.find(item => item.id === sessaoId);
        if (!sessao || sessao.situacao !== 'agendada') {
            throw new Error('Essa sessão já foi alterada ou removida.');
        }
        sessao.situacao = situacao;
        salvarDadosMenu(crefitoAtual, dados);
        atualizarTela();
        notificar(situacao === 'concluida' ? 'Sessão marcada como concluída.' : 'Sessão cancelada. O horário está disponível novamente.');
    } catch (erro) {
        mostrarErro('erro', erro.name === 'Error' ? erro.message : 'Não foi possível alterar a sessão neste navegador.');
    }
}

elementoAgenda('manter').addEventListener('click', () => dialogo.close());
elementoAgenda('cancelar').addEventListener('click', function () {
    if (cancelamento) alterarSituacao(cancelamento.pacienteId, cancelamento.sessaoId, 'cancelada');
    dialogo.close();
    busca.focus();
});
dialogo.addEventListener('close', () => { cancelamento = null; });
elementoAgenda('limpar').addEventListener('click', function () {
    limparFiltros();
    atualizarTela();
});
busca.addEventListener('input', atualizarTela);
filtroData.addEventListener('change', atualizarTela);
filtroSituacao.addEventListener('change', atualizarTela);
window.addEventListener('storage', atualizarTela);
window.addEventListener('pageshow', atualizarTela);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) atualizarTela();
});

atualizarTela();
const parametros = new URLSearchParams(location.search);
const pacientePedido = parametros.get('paciente') || parametros.get('patient');
if (pacientePedido) campos.paciente.value = pacientePedido;
filtroData.value = parametros.get('data') || parametros.get('date') || '';
if (filtroData.value) atualizarTela();
