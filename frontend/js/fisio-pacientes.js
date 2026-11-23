const formulario = document.getElementById('fisio-pacientes-form');
const busca = document.getElementById('fisio-pacientes-busca');
const filtro = document.getElementById('fisio-pacientes-filtro');
const lista = document.getElementById('fisio-pacientes-lista');
const erro = document.getElementById('fisio-pacientes-erro');
let crefitoAtual = '';
let pacienteEmEdicao = '';

function mostrarErro(mensagem) {
    erro.textContent = mensagem;
    erro.hidden = false;
}

function limparFormulario() {
    formulario.reset();
    pacienteEmEdicao = '';
    document.getElementById('fisio-pacientes-titulo').textContent = 'Novo paciente';
    document.getElementById('fisio-pacientes-salvar').textContent = 'Adicionar paciente';
    document.getElementById('fisio-pacientes-cancelar').hidden = true;
    erro.hidden = true;
}

function editarPaciente(paciente) {
    for (const campo of ['nome', 'email', 'telefone', 'acompanhamento', 'situacao']) {
        formulario.elements[campo].value = paciente[campo];
    }
    pacienteEmEdicao = paciente.id;
    document.getElementById('fisio-pacientes-titulo').textContent = 'Editar paciente';
    document.getElementById('fisio-pacientes-salvar').textContent = 'Salvar alterações';
    document.getElementById('fisio-pacientes-cancelar').hidden = false;
    erro.hidden = true;
    formulario.elements.nome.focus();
}

function normalizarBusca(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mostrarLista(pacientes) {
    const termo = normalizarBusca(busca.value.trim());
    const filtrados = pacientes.filter(paciente => {
        const texto = [paciente.nome, paciente.email, paciente.acompanhamento].join(' ');
        return (!filtro.value || paciente.situacao === filtro.value) && normalizarBusca(texto).includes(termo);
    });
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    lista.replaceChildren();
    const contagem = document.getElementById('fisio-pacientes-contagem');
    contagem.textContent = filtrados.length + ' de ' + pacientes.length + ' pacientes';
    if (!filtrados.length) {
        contagem.textContent = pacientes.length ? 'Nenhum paciente corresponde aos filtros.' : 'Nenhum paciente adicionado.';
    }

    const modelo = document.getElementById('fisio-pacientes-modelo');
    for (const paciente of filtrados) {
        const ficha = modelo.content.firstElementChild.cloneNode(true);
        ficha.querySelector('h3').textContent = paciente.nome;
        ficha.querySelector('.fisio-pacientes-situacao').textContent = paciente.situacao === 'ativo' ? 'Ativo' : 'Inativo';
        ficha.querySelector('.fisio-pacientes-acompanhamento').textContent = paciente.acompanhamento;
        ficha.querySelector('.fisio-pacientes-email').textContent = paciente.email;
        ficha.querySelector('.fisio-pacientes-telefone').textContent = paciente.telefone;
        ficha.querySelector('.fisio-pacientes-editar').addEventListener('click', () => editarPaciente(paciente));
        ficha.querySelector('.fisio-pacientes-excluir').addEventListener('click', () => excluirPaciente(paciente));
        const agendar = ficha.querySelector('a');
        agendar.hidden = paciente.situacao !== 'ativo';
        agendar.href = 'fisio-agenda.html?paciente=' + encodeURIComponent(paciente.id);
        lista.appendChild(ficha);
    }
}

function atualizarTela() {
    const conteudo = document.getElementById('fisio-pacientes-conteudo');
    const acesso = document.getElementById('fisio-pacientes-acesso');
    try {
        const usuario = lerSessaoMenu();
        const crefito = usuario?.crefito || '';
        if (crefito !== crefitoAtual) {
            limparFormulario();
            busca.value = '';
            filtro.value = '';
            lista.replaceChildren();
            crefitoAtual = crefito;
        }
        acesso.hidden = Boolean(crefito);
        conteudo.hidden = !crefito;
        if (crefito) {
            mostrarLista(lerDadosMenu(crefito).pacientes);
        }
    } catch {
        conteudo.hidden = true;
        mostrarErro('Não foi possível ler a sessão ou as fichas neste navegador.');
    }
}

function sessaoAtiva() {
    if (crefitoAtual && lerSessaoMenu()?.crefito === crefitoAtual) {
        return true;
    }
    atualizarTela();
    mostrarErro('A sessão mudou. Confira o fisioterapeuta antes de continuar.');
    return false;
}

formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    erro.hidden = true;
    const campos = formulario.elements;
    const ficha = {
        nome: campos.nome.value.trim(),
        email: campos.email.value.trim().toLowerCase(),
        telefone: campos.telefone.value.trim(),
        acompanhamento: campos.acompanhamento.value.trim(),
        situacao: campos.situacao.value
    };

    if (ficha.nome.length < 3 || ficha.acompanhamento.length < 3) {
        mostrarErro('Informe ao menos três caracteres no nome e no acompanhamento.');
        return;
    }
    if (ficha.telefone && !/^(?:\+?55\s*)?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/.test(ficha.telefone)) {
        mostrarErro('Confira o telefone com DDD ou deixe o campo vazio.');
        return;
    }

    try {
        if (!sessaoAtiva()) return;
        const dados = lerDadosMenu(crefitoAtual);
        if (dados.pacientes.some(paciente => paciente.email === ficha.email && paciente.id !== pacienteEmEdicao)) {
            mostrarErro('Já existe um paciente com esse e-mail na sua lista.');
            return;
        }
        if (pacienteEmEdicao) {
            const paciente = dados.pacientes.find(item => item.id === pacienteEmEdicao);
            if (!paciente) {
                mostrarErro('Esta ficha foi excluída. Cancele a edição para continuar.');
                return;
            }
            Object.assign(paciente, ficha);
        } else {
            ficha.id = crypto.randomUUID();
            dados.pacientes.push(ficha);
        }
        salvarDadosMenu(crefitoAtual, dados);
        limparFormulario();
        mostrarLista(dados.pacientes);
    } catch {
        mostrarErro('Não foi possível salvar a ficha neste navegador.');
    }
});

function excluirPaciente(paciente) {
    if (!window.confirm('Excluir a ficha de ' + paciente.nome + ' e os dados de acompanhamento vinculados?')) return;

    try {
        if (!sessaoAtiva()) return;
        const dados = lerDadosMenu(crefitoAtual);
        dados.pacientes = dados.pacientes.filter(item => item.id !== paciente.id);
        salvarDadosMenu(crefitoAtual, dados);
        if (pacienteEmEdicao === paciente.id) limparFormulario();
        erro.hidden = true;
        mostrarLista(dados.pacientes);
        busca.focus();
    } catch {
        mostrarErro('Não foi possível excluir a ficha neste navegador.');
    }
}

document.getElementById('fisio-pacientes-cancelar').addEventListener('click', limparFormulario);
busca.addEventListener('input', atualizarTela);
filtro.addEventListener('change', atualizarTela);
window.addEventListener('storage', atualizarTela);
window.addEventListener('pageshow', atualizarTela);
atualizarTela();
