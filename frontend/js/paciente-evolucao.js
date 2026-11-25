const painel = document.getElementById('paciente-evolucao-painel');
const saudacao = document.getElementById('paciente-evolucao-saudacao');
const acesso = document.getElementById('paciente-evolucao-acesso');
const erro = document.getElementById('paciente-evolucao-erro');
const filtro = document.getElementById('paciente-evolucao-filtro');
const resumos = document.getElementById('paciente-evolucao-resumos');
const graficos = document.getElementById('paciente-evolucao-graficos');
const historico = document.getElementById('paciente-evolucao-historico');
let registros = [];
let exercicios = [];
let pacienteAtual = '';
let crefitoAtual = '';

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
    secao.className = 'paciente-evolucao-grafico';
    const titulo = document.createElement('h3');
    titulo.textContent = exercicio.nome;
    secao.appendChild(titulo);

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
    legenda.className = 'paciente-evolucao-ajuda';
    legenda.textContent = registros.length + (registros.length === 1 ? ' medição' : ' medições') + ' · 0 = sem dor · 10 = maior dor percebida';
    secao.append(svg, legenda);
    return secao;
}

function mostrarResumo(exercicio, medidas) {
    const resumo = document.getElementById('paciente-evolucao-modelo-resumo').content.firstElementChild.cloneNode(true);
    const primeiro = medidas[0];
    const ultimo = medidas[medidas.length - 1];
    let mensagem = 'Envie mais um registro para comparar sua evolução.';
    if (medidas.length > 1) {
        const diferenca = primeiro.dor - ultimo.dor;
        const pontos = Math.abs(diferenca);
        const variacao = pontos + (pontos === 1 ? ' ponto' : ' pontos');
        if (diferenca > 0) {
            mensagem = 'Sua dor diminuiu ' + variacao + '.';
        } else if (diferenca < 0) {
            mensagem = 'Sua dor aumentou ' + variacao + '. Converse com seu fisioterapeuta.';
        } else {
            mensagem = 'Sua dor permaneceu no mesmo nível entre o primeiro e o último registro.';
        }
    }
    resumo.querySelector('h3').textContent = exercicio.nome;
    resumo.querySelector('p').textContent = mensagem;
    resumo.querySelector('.paciente-evolucao-comparacao').textContent =
        'Primeiro: ' + primeiro.dor + '/10 em ' + dataFormatada(primeiro.data) +
        ' · Último: ' + ultimo.dor + '/10 em ' + dataFormatada(ultimo.data);
    return resumo;
}

function mostrarGraficos() {
    graficos.replaceChildren();
    for (const exercicio of exercicios) {
        if (filtro.value && exercicio.id !== filtro.value) continue;
        graficos.appendChild(desenharGrafico(exercicio, registros.filter(item => item.exercicioId === exercicio.id)));
    }
}

function mostrarSelecao() {
    resumos.replaceChildren();
    historico.replaceChildren();
    const visiveis = registros.filter(item => !filtro.value || item.exercicioId === filtro.value);
    for (const exercicio of exercicios) {
        if (filtro.value && exercicio.id !== filtro.value) continue;
        resumos.appendChild(mostrarResumo(exercicio, visiveis.filter(item => item.exercicioId === exercicio.id)));
    }
    mostrarGraficos();
    for (const registro of [...visiveis].reverse()) {
        const exercicio = exercicios.find(item => item.id === registro.exercicioId);
        const anexos = (registro.anexos || []).map(anexo => anexo.nome).filter(Boolean);
        const linha = historico.insertRow();
        for (const valor of [dataFormatada(registro.data), exercicio.nome, registro.dor + ' / 10',
            registro.observacao || '—', anexos.join(', ') || '—']) {
            linha.insertCell().textContent = valor;
        }
    }
    document.getElementById('paciente-evolucao-sem-registros').hidden = visiveis.length > 0;
    document.getElementById('paciente-evolucao-historico-vazio').hidden = visiveis.length > 0;
    document.getElementById('paciente-evolucao-tabela').hidden = !visiveis.length;
}

function carregarEvolucao() {
    const anterior = filtro.value;
    painel.hidden = true;
    acesso.hidden = true;
    erro.hidden = true;
    saudacao.textContent = 'Área do paciente';
    resumos.replaceChildren();
    graficos.replaceChildren();
    historico.replaceChildren();
    filtro.replaceChildren(new Option('Todos os exercícios', ''));
    registros = [];
    exercicios = [];
    try {
        const vinculo = lerDadosPaciente();
        if (!vinculo) {
            pacienteAtual = '';
            crefitoAtual = '';
            acesso.hidden = false;
            return;
        }
        const catalogo = vinculo.dados.exercicios || [];
        registros = (vinculo.paciente.registros || []).filter(registro =>
            registroDoPaciente(registro) && (!registro.pacienteId || registro.pacienteId === vinculo.paciente.id) &&
            catalogo.some(item => item.id === registro.exercicioId)
        );
        registros.sort((a, b) => a.data.localeCompare(b.data) || (a.criadoEm || 0) - (b.criadoEm || 0));
        exercicios = catalogo.filter(item => registros.some(registro => registro.exercicioId === item.id));
        for (const exercicio of exercicios) filtro.add(new Option(exercicio.nome, exercicio.id));
        if (pacienteAtual === vinculo.paciente.id && crefitoAtual === vinculo.crefito &&
            exercicios.some(item => item.id === anterior)) {
            filtro.value = anterior;
        }
        filtro.disabled = !exercicios.length;
        pacienteAtual = vinculo.paciente.id;
        crefitoAtual = vinculo.crefito;
        saudacao.textContent = 'Área do paciente · ' + vinculo.paciente.nome;
        painel.hidden = false;
        mostrarSelecao();
    } catch {
        painel.hidden = true;
        erro.hidden = false;
    }
}

filtro.addEventListener('change', mostrarSelecao);
window.addEventListener('pageshow', carregarEvolucao);
window.addEventListener('storage', carregarEvolucao);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) carregarEvolucao();
});
let larguraAnterior = 0;
new ResizeObserver(function () {
    if (!painel.hidden && graficos.clientWidth !== larguraAnterior) {
        larguraAnterior = graficos.clientWidth;
        mostrarGraficos();
    }
}).observe(graficos);
carregarEvolucao();
