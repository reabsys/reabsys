const conteudo = document.getElementById('fisio-evolucao-conteudo');
const paciente = document.getElementById('fisio-evolucao-paciente');
const filtro = document.getElementById('fisio-evolucao-exercicio');
const graficos = document.getElementById('fisio-evolucao-graficos');
const historico = document.getElementById('fisio-evolucao-historico');
const parametros = new URLSearchParams(location.search);
let crefitoAtual = '';
let dados;
let exerciciosDaFicha = [];
let registrosDaFicha = [];

function dataFormatada(data, comAno = true) {
    const [ano, mes, dia] = data.split('-');
    return comAno ? dia + '/' + mes + '/' + ano : dia + '/' + mes;
}

function registroDoPaciente(registro) {
    if (registro?.origem !== 'paciente' || !Number.isInteger(registro.dor) || registro.dor < 0 || registro.dor > 10) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(registro.data)) return false;
    const data = new Date(registro.data);
    return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === registro.data;
}

function mensagemVazia(titulo, texto) {
    const caixa = document.createElement('div');
    caixa.className = 'fisio-evolucao-mensagem';
    const destaque = document.createElement('strong');
    destaque.textContent = titulo;
    const detalhe = document.createElement('p');
    detalhe.textContent = texto;
    caixa.append(destaque, detalhe);
    return caixa;
}

function elementoSvg(nome, atributos, texto) {
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', nome);
    for (const [chave, valor] of Object.entries(atributos)) {
        elemento.setAttribute(chave, valor);
    }
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function desenharGrafico(exercicio, registros) {
    const secao = document.createElement('section');
    secao.className = 'fisio-evolucao-grafico';
    const titulo = document.createElement('h3');
    titulo.textContent = exercicio.nome;
    secao.appendChild(titulo);
    if (!registros.length) {
        secao.appendChild(mensagemVazia('Sem medições para este exercício',
            'O gráfico aparecerá quando o paciente enviar seu primeiro registro.'));
        return secao;
    }

    const largura = Math.max(160, graficos.clientWidth);
    const esquerda = 32;
    const direita = largura - 24;
    const base = 205;
    const altura = base - 24;
    const svg = elementoSvg('svg', {
        viewBox: '0 0 ' + largura + ' 245',
        role: 'img',
        'aria-label': 'Dor em ' + exercicio.nome + ', de 0 a 10. Valores completos na tabela do histórico.'
    });
    svg.appendChild(elementoSvg('title', {}, 'Nível de dor — ' + exercicio.nome));
    for (let dor = 0; dor <= 10; dor += 2) {
        const y = base - dor * altura / 10;
        svg.appendChild(elementoSvg('line', { x1: esquerda, x2: direita, y1: y, y2: y }));
        svg.appendChild(elementoSvg('text', { x: esquerda - 9, y: y + 4, 'text-anchor': 'end' }, dor));
    }

    const inicio = Date.parse(registros[0].data);
    const intervalo = Date.parse(registros[registros.length - 1].data) - inicio;
    function posicaoData(data) {
        if (!intervalo) return (esquerda + direita) / 2;
        return esquerda + (Date.parse(data) - inicio) / intervalo * (direita - esquerda);
    }

    const pontos = registros.map(registro => ({
        x: posicaoData(registro.data),
        y: base - registro.dor * altura / 10
    }));
    if (pontos.length > 1) {
        svg.appendChild(elementoSvg('polyline', { points: pontos.map(ponto => ponto.x + ',' + ponto.y).join(' ') }));
    }
    pontos.forEach(function (ponto, indice) {
        const registro = registros[indice];
        const marca = elementoSvg('circle', { cx: ponto.x, cy: ponto.y, r: 5 });
        marca.appendChild(elementoSvg('title', {}, dataFormatada(registro.data) + ': dor ' + registro.dor + ' de 10'));
        svg.appendChild(marca);
    });

    const datas = [...new Set(registros.map(registro => registro.data))];
    const ultima = datas[datas.length - 1];
    const quantidade = Math.max(1, Math.min(4, datas.length, Math.floor((direita - esquerda) / 85)));
    let ultimoX = -Infinity;
    for (let indice = 0; indice < quantidade; indice++) {
        const data = datas[quantidade === 1 ? 0 : Math.round(indice * (datas.length - 1) / (quantidade - 1))];
        const x = posicaoData(data);
        if (x - ultimoX < 65 || (indice > 0 && data !== ultima && posicaoData(ultima) - x < 65)) continue;
        svg.appendChild(elementoSvg('text', { x, y: base + 24, 'text-anchor': 'middle' }, dataFormatada(data, false)));
        ultimoX = x;
    }
    const legenda = document.createElement('p');
    legenda.className = 'fisio-evolucao-ajuda';
    legenda.textContent = registros.length + (registros.length === 1 ? ' medição' : ' medições') + ' · 0 = sem dor · 10 = maior dor percebida';
    secao.append(svg, legenda);
    return secao;
}

function mostrarGraficos() {
    graficos.replaceChildren();
    if (!paciente.value) {
        const mensagem = paciente.options.length > 1
            ? mensagemVazia('Selecione um paciente', 'Os gráficos e o histórico serão exibidos aqui.')
            : mensagemVazia('Nenhum paciente na sua lista', 'As fichas adicionadas em Pacientes aparecerão aqui.');
        graficos.appendChild(mensagem);
        return;
    }
    if (!exerciciosDaFicha.length) {
        graficos.appendChild(mensagemVazia('Nenhum exercício atribuído', 'Use Gerenciar exercícios para montar o plano do paciente.'));
        return;
    }
    for (const exercicio of exerciciosDaFicha) {
        if (filtro.value && exercicio.id !== filtro.value) continue;
        graficos.appendChild(desenharGrafico(exercicio, registrosDaFicha.filter(item => item.exercicioId === exercicio.id)));
    }
}

function mostrarSelecao() {
    mostrarGraficos();
    historico.replaceChildren();
    const registros = registrosDaFicha.filter(item => !filtro.value || item.exercicioId === filtro.value);
    for (const registro of registros.reverse()) {
        const exercicio = exerciciosDaFicha.find(item => item.id === registro.exercicioId);
        const anexos = (registro.anexos || []).map(anexo => anexo.nome).filter(Boolean);
        const linha = historico.insertRow();
        for (const valor of [dataFormatada(registro.data), exercicio.nome, registro.dor + ' / 10',
            registro.observacao || '—', anexos.join(', ') || '—']) {
            linha.insertCell().textContent = valor;
        }
    }
    document.getElementById('fisio-evolucao-contagem').textContent = registros.length + (registros.length === 1 ? ' registro' : ' registros');
    document.getElementById('fisio-evolucao-tabela').hidden = !registros.length;
    const vazio = document.getElementById('fisio-evolucao-vazio');
    vazio.hidden = registros.length > 0;
    vazio.textContent = paciente.value ? 'Nenhuma medição para a seleção atual.' : 'Selecione um paciente para consultar os registros.';
}

function selecionarPaciente(exercicioAnterior = '') {
    const ficha = dados.pacientes.find(item => item.id === paciente.value);
    const atribuidos = ficha?.exercicioIds || [];
    const catalogo = dados.exercicios || [];
    registrosDaFicha = (ficha?.registros || []).filter(registro =>
        registroDoPaciente(registro) && (!registro.pacienteId || registro.pacienteId === ficha.id) &&
        catalogo.some(item => item.id === registro.exercicioId)
    );
    registrosDaFicha.sort((a, b) => a.data.localeCompare(b.data) || (a.criadoEm || 0) - (b.criadoEm || 0));
    exerciciosDaFicha = catalogo.filter(item =>
        atribuidos.includes(item.id) || registrosDaFicha.some(registro => registro.exercicioId === item.id)
    );

    filtro.replaceChildren(new Option('Todos os exercícios', ''));
    for (const exercicio of exerciciosDaFicha) {
        const nome = exercicio.nome + (atribuidos.includes(exercicio.id) ? '' : ' (não atribuído)');
        filtro.add(new Option(nome, exercicio.id));
    }
    if (exerciciosDaFicha.some(item => item.id === exercicioAnterior)) filtro.value = exercicioAnterior;
    filtro.disabled = !ficha;
    document.getElementById('fisio-evolucao-gerenciar').href = ficha
        ? 'fisio-exercicios.html?paciente=' + encodeURIComponent(ficha.id) : 'fisio-exercicios.html';
    mostrarSelecao();
}

function carregarDados() {
    const erro = document.getElementById('fisio-evolucao-erro');
    try {
        const usuario = lerSessaoMenu();
        if (!usuario) {
            conteudo.hidden = true;
            window.location.replace('login.html');
            return;
        }
        const id = crefitoAtual ? paciente.value : parametros.get('paciente') || parametros.get('patient');
        const mesmoFisio = crefitoAtual === usuario.crefito;
        const exercicioAnterior = mesmoFisio ? filtro.value : '';
        dados = lerDadosMenu(usuario.crefito);
        paciente.replaceChildren(new Option('Selecione um paciente', ''));
        for (const ficha of dados.pacientes) paciente.add(new Option(ficha.nome, ficha.id));
        if ((!crefitoAtual || mesmoFisio) && dados.pacientes.some(ficha => ficha.id === id)) paciente.value = id;
        crefitoAtual = usuario.crefito;
        erro.hidden = true;
        conteudo.hidden = false;
        selecionarPaciente(exercicioAnterior);
    } catch {
        conteudo.hidden = true;
        erro.hidden = false;
    }
}

paciente.addEventListener('change', () => selecionarPaciente());
filtro.addEventListener('change', mostrarSelecao);
window.addEventListener('pageshow', carregarDados);
window.addEventListener('storage', carregarDados);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) carregarDados();
});
let larguraAnterior = 0;
new ResizeObserver(function () {
    if (!conteudo.hidden && graficos.clientWidth !== larguraAnterior) {
        larguraAnterior = graficos.clientWidth;
        mostrarGraficos();
    }
}).observe(graficos);
carregarDados();
