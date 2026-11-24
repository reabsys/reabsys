const formulario = document.getElementById('paciente-registro-form');
const campos = formulario.elements;
const painel = document.getElementById('paciente-registro-painel');
const saudacao = document.getElementById('paciente-registro-saudacao');
const acesso = document.getElementById('paciente-registro-acesso');
const falha = document.getElementById('paciente-registro-falha');
const erro = document.getElementById('paciente-registro-erro');
const aviso = document.getElementById('paciente-registro-aviso');
const enviar = document.getElementById('paciente-registro-enviar');
const grupoCampos = document.getElementById('paciente-registro-campos');
let pacienteAtual = '';
let crefitoAtual = '';
let enviando = false;
let tempoAviso;

function dataHoje() {
    const hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
}

function limparFormulario() {
    formulario.reset();
    campos.data.value = dataHoje();
}

function atualizarTela() {
    painel.hidden = true;
    acesso.hidden = true;
    falha.hidden = true;
    saudacao.textContent = 'Área do paciente';
    try {
        const vinculo = lerDadosPaciente();
        if (!vinculo) {
            limparFormulario();
            pacienteAtual = '';
            crefitoAtual = '';
            aviso.hidden = true;
            acesso.hidden = false;
            return;
        }
        if (pacienteAtual !== vinculo.paciente.id || crefitoAtual !== vinculo.crefito) {
            limparFormulario();
            aviso.hidden = true;
            pacienteAtual = vinculo.paciente.id;
            crefitoAtual = vinculo.crefito;
        }
        const escolhido = campos.exercicio.value;
        const ids = vinculo.paciente.exercicioIds || [];
        const exercicios = (vinculo.dados.exercicios || []).filter(item => ids.includes(item.id));
        campos.exercicio.replaceChildren(new Option('Selecione um exercício', ''));
        for (const exercicio of exercicios) campos.exercicio.add(new Option(exercicio.nome, exercicio.id));
        if (exercicios.some(item => item.id === escolhido)) campos.exercicio.value = escolhido;
        campos.data.max = dataHoje();
        enviar.disabled = enviando || !exercicios.length;
        document.getElementById('paciente-registro-orientacao').textContent = exercicios.length
            ? 'Selecione um exercício do seu plano para registrar a sessão.'
            : 'Aguarde a atribuição de exercícios pelo fisioterapeuta para enviar um registro.';
        saudacao.textContent = 'Área do paciente · ' + vinculo.paciente.nome;
        painel.hidden = false;
    } catch {
        falha.hidden = false;
    }
}

async function lerImagem(arquivo) {
    try {
        const imagem = await createImageBitmap(arquivo);
        imagem.close();
    } catch {
        throw new Error('Não foi possível abrir a imagem. Escolha uma imagem válida.');
    }
    return new Promise(function (resolver, rejeitar) {
        const leitor = new FileReader();
        leitor.onload = () => resolver(leitor.result);
        leitor.onerror = () => rejeitar(new Error('Não foi possível ler a imagem selecionada.'));
        leitor.readAsDataURL(arquivo);
    });
}

async function prepararAnexos(arquivos) {
    if (!arquivos.length || arquivos.length > 5) throw new Error('Anexe de 1 a 5 imagens ou vídeos.');
    const total = arquivos.reduce((soma, arquivo) => soma + arquivo.size, 0);
    if (total > 50 * 1024 * 1024) throw new Error('O conjunto de arquivos deve ter até 50 MB.');

    const anexos = [];
    for (const arquivo of arquivos) {
        const imagem = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type);
        const video = ['video/mp4', 'video/webm', 'video/quicktime'].includes(arquivo.type);
        if (!imagem && !video) throw new Error('Use imagens JPG, PNG, WebP ou GIF e vídeos MP4, WebM ou MOV.');
        const limite = (imagem ? 1 : 25) * 1024 * 1024;
        if (!arquivo.size || arquivo.size > limite) {
            throw new Error('Cada imagem deve ter até 1 MB e cada vídeo até 25 MB.');
        }
        const anexo = { nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size };
        if (imagem) anexo.conteudo = await lerImagem(arquivo);
        anexos.push(anexo);
    }
    return anexos;
}

formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (enviando || !formulario.reportValidity()) return;
    erro.hidden = true;
    aviso.hidden = true;
    enviando = true;
    grupoCampos.disabled = true;
    enviar.textContent = 'Enviando...';
    try {
        const inicial = lerDadosPaciente();
        if (!inicial || inicial.paciente.id !== pacienteAtual || inicial.crefito !== crefitoAtual) {
            throw new Error('O acesso do paciente mudou. Confira os dados antes de enviar.');
        }
        const exercicioId = campos.exercicio.value;
        const data = campos.data.value;
        const dor = Number(campos.dor.value);
        const observacao = campos.observacao.value.trim();
        if (!data || data > dataHoje()) throw new Error('Informe uma data válida, até hoje.');
        if (campos.dor.value === '' || !Number.isInteger(dor) || dor < 0 || dor > 10) {
            throw new Error('Informe um nível de dor inteiro entre 0 e 10.');
        }
        const anexos = await prepararAnexos([...campos.arquivos.files]);

        // Confere o vínculo e relê os dados após carregar as imagens.
        const atual = lerDadosPaciente();
        if (!atual || atual.crefito !== inicial.crefito || atual.paciente.id !== inicial.paciente.id) {
            throw new Error('O acesso do paciente mudou. Confira os dados antes de enviar.');
        }
        if (!atual.paciente.exercicioIds?.includes(exercicioId) ||
            !atual.dados.exercicios?.some(item => item.id === exercicioId)) {
            throw new Error('Esse exercício deixou de estar atribuído a você. Confira a seleção.');
        }
        const registro = {
            id: crypto.randomUUID(),
            pacienteId: atual.paciente.id,
            exercicioId: exercicioId,
            data: data,
            dor: dor,
            observacao: observacao,
            anexos: anexos,
            criadoEm: Date.now(),
            origem: 'paciente'
        };
        if (!atual.paciente.registros) atual.paciente.registros = [];
        atual.paciente.registros.push(registro);
        salvarDadosMenu(atual.crefito, atual.dados);
        limparFormulario();
        aviso.textContent = 'Registro salvo no acompanhamento do fisioterapeuta.';
        aviso.hidden = false;
        clearTimeout(tempoAviso);
        tempoAviso = setTimeout(() => { aviso.hidden = true; }, 6000);
    } catch (problema) {
        erro.textContent = problema.name === 'QuotaExceededError'
            ? 'O armazenamento deste navegador está cheio. Escolha imagens menores e tente novamente. O registro continua no formulário.'
            : problema.message || 'Não foi possível salvar o registro. Tente novamente.';
        erro.hidden = false;
    } finally {
        enviando = false;
        grupoCampos.disabled = false;
        enviar.textContent = 'Enviar registro';
        atualizarTela();
    }
});

window.addEventListener('pageshow', atualizarTela);
window.addEventListener('storage', atualizarTela);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) atualizarTela();
});
atualizarTela();
const parametros = new URLSearchParams(location.search);
const exercicioPedido = parametros.get('exercicio') || parametros.get('exercise');
if (exercicioPedido) campos.exercicio.value = exercicioPedido;
