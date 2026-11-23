const pastaFotos = '../assets/images/fisio-exercicios/';
const catalogo = [
    {
        id: 'ex-ponte', nome: 'Ponte glútea (bridge)', imagem: pastaFotos + 'ponte.webp',
        beneficio: 'Auxilia no fortalecimento dos glúteos e na estabilidade do quadril e do tronco.'
    },
    {
        id: 'ex-parede', nome: 'Agachamento na parede (wall sit)', imagem: pastaFotos + 'parede.webp',
        beneficio: 'Trabalha a resistência dos quadríceps em uma posição sustentada com apoio na parede.'
    },
    {
        id: 'ex-perna', nome: 'Elevação de perna estendida', imagem: pastaFotos + 'perna-estendida.webp',
        beneficio: 'Auxilia no fortalecimento dos flexores do quadril e no controle do quadríceps, mantendo o joelho estendido.'
    },
    {
        id: 'ex-isquiotibiais', nome: 'Alongamento de isquiotibiais', imagem: pastaFotos + 'isquiotibiais.webp',
        beneficio: 'Trabalha a flexibilidade dos músculos posteriores da coxa.'
    },
    {
        id: 'ex-prancha', nome: 'Prancha abdominal', imagem: pastaFotos + 'prancha.webp',
        beneficio: 'Trabalha a resistência da musculatura do tronco e o controle da estabilidade corporal.'
    },
    {
        id: 'ex-pendulo', nome: 'Exercício do pêndulo (Codman)', imagem: pastaFotos + 'pendulo.webp',
        beneficio: 'Favorece movimentos suaves do ombro com o braço relaxado, conforme orientação profissional.'
    }
];

function elemento(nome) {
    return document.getElementById('fisio-exercicios-' + nome);
}

const formulario = elemento('form');
const campos = formulario.elements;
const paciente = elemento('paciente');
const busca = elemento('busca');
const novo = elemento('adicionar');
const salvar = elemento('salvar');
const previa = elemento('previa');
let crefitoAtual = '';
let exercicioEmEdicao = '';
let imagemLocal = '';
let leituraImagem = 0;
let pacienteAtual = '';
let atribuicaoSalva = '';
let selecionados = new Set();
let tempoAviso;

function mostrarErro(campo, erro) {
    const mensagem = elemento(campo);
    mensagem.textContent = erro.name === 'QuotaExceededError'
        ? 'O armazenamento deste navegador está cheio. Tente uma imagem menor.'
        : erro.message;
    mensagem.hidden = false;
}

function avisar(texto) {
    const aviso = elemento('aviso');
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(() => { aviso.hidden = true; }, 6000);
}

function mostrarPrevia(imagem) {
    previa.hidden = !imagem;
    if (imagem) previa.src = imagem;
    else previa.removeAttribute('src');
}

function fecharEditor() {
    leituraImagem++;
    formulario.reset();
    exercicioEmEdicao = '';
    imagemLocal = '';
    mostrarPrevia('');
    salvar.disabled = false;
    elemento('erro-form').hidden = true;
    elemento('editor').hidden = true;
    novo.setAttribute('aria-expanded', 'false');
}

function abrirEditor(exercicio) {
    fecharEditor();
    if (exercicio) {
        exercicioEmEdicao = exercicio.id;
        campos.nome.value = exercicio.nome;
        campos.beneficio.value = exercicio.beneficio;
        if (exercicio.imagem.startsWith('data:image/')) imagemLocal = exercicio.imagem;
        else campos.url.value = exercicio.imagem;
        mostrarPrevia(exercicio.imagem);
    }
    elemento('titulo').textContent = exercicio ? 'Editar exercício' : 'Novo exercício';
    salvar.textContent = exercicio ? 'Salvar alterações' : 'Criar exercício';
    elemento('editor').hidden = false;
    novo.setAttribute('aria-expanded', 'true');
    campos.nome.focus();
}

function resumoSelecao() {
    elemento('selecao').textContent = paciente.value
        ? selecionados.size + ' exercícios selecionados. Salve para atualizar o plano do paciente.'
        : 'Selecione um paciente para marcar os exercícios nos cards.';
    elemento('atribuir').disabled = !paciente.value;
}

function cartaoExercicio(exercicio) {
    const cartao = elemento('modelo').content.firstElementChild.cloneNode(true);
    const foto = cartao.querySelector('img');
    foto.alt = exercicio.nome;
    foto.addEventListener('error', function () {
        foto.hidden = true;
        cartao.querySelector('.fisio-exercicios-midia span').hidden = false;
    });
    foto.src = exercicio.imagem;
    cartao.querySelector('h3').textContent = exercicio.nome;
    cartao.querySelector('p').textContent = exercicio.beneficio;
    const marcar = cartao.querySelector('input');
    marcar.value = exercicio.id;
    marcar.checked = selecionados.has(exercicio.id);
    marcar.disabled = !paciente.value;
    marcar.setAttribute('aria-label', 'Atribuir ao paciente: ' + exercicio.nome);
    marcar.addEventListener('change', function () {
        if (marcar.checked) selecionados.add(exercicio.id);
        else selecionados.delete(exercicio.id);
        resumoSelecao();
    });
    if (!catalogo.some(item => item.id === exercicio.id)) {
        cartao.querySelector('.fisio-exercicios-acoes').hidden = false;
        const editar = cartao.querySelector('.fisio-exercicios-secundario');
        const remover = cartao.querySelector('.fisio-exercicios-remover');
        editar.setAttribute('aria-label', 'Editar ' + exercicio.nome);
        remover.setAttribute('aria-label', 'Remover ' + exercicio.nome);
        editar.addEventListener('click', () => abrirEditor(exercicio));
        remover.addEventListener('click', () => removerExercicio(exercicio));
    }
    return cartao;
}

function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function atualizarTela() {
    elemento('falha').hidden = true;
    try {
        const usuario = lerSessaoMenu();
        if (!usuario) {
            elemento('conteudo').hidden = true;
            window.location.replace('login.html');
            return;
        }
        if (usuario.crefito !== crefitoAtual) {
            fecharEditor();
            crefitoAtual = usuario.crefito;
            pacienteAtual = '';
            paciente.value = '';
            selecionados.clear();
            atribuicaoSalva = '';
            busca.value = '';
            elemento('aviso').hidden = true;
        }
        const dados = lerDadosMenu(crefitoAtual);
        if (!dados.exercicios) {
            dados.exercicios = catalogo;
            salvarDadosMenu(crefitoAtual, dados);
        }

        const escolhido = paciente.value;
        paciente.replaceChildren(new Option('Selecione um paciente', ''));
        for (const ficha of dados.pacientes) paciente.add(new Option(ficha.nome, ficha.id));
        const ficha = dados.pacientes.find(item => item.id === escolhido);
        paciente.value = ficha?.id || '';
        const ids = ficha?.exercicioIds || [];
        if (paciente.value !== pacienteAtual || JSON.stringify(ids) !== atribuicaoSalva) {
            pacienteAtual = paciente.value;
            atribuicaoSalva = JSON.stringify(ids);
            selecionados = new Set(ids);
        }
        for (const id of selecionados) {
            if (!dados.exercicios.some(item => item.id === id)) selecionados.delete(id);
        }

        const termo = normalizar(busca.value.trim());
        const encontrados = dados.exercicios.filter(item => normalizar(item.nome + ' ' + item.beneficio).includes(termo));
        const lista = elemento('lista');
        lista.replaceChildren();
        for (const exercicio of encontrados) lista.appendChild(cartaoExercicio(exercicio));
        elemento('contagem').textContent = encontrados.length + ' de ' + dados.exercicios.length;
        elemento('vazio').hidden = encontrados.length > 0;
        elemento('erro').hidden = true;
        elemento('conteudo').hidden = false;
        resumoSelecao();
    } catch (erro) {
        elemento('conteudo').hidden = true;
        fecharEditor();
        mostrarErro('falha', erro.name === 'QuotaExceededError' ? erro : new Error('Não foi possível ler a sessão ou os exercícios neste navegador.'));
    }
}

function dadosParaAlterar() {
    if (!crefitoAtual || lerSessaoMenu()?.crefito !== crefitoAtual) {
        atualizarTela();
        throw new Error('A sessão mudou. Confira o fisioterapeuta antes de continuar.');
    }
    return lerDadosMenu(crefitoAtual);
}

function urlImagem(valor) {
    try {
        const url = new URL(valor);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

campos.url.addEventListener('input', function () {
    leituraImagem++;
    imagemLocal = '';
    campos.arquivo.value = '';
    salvar.disabled = false;
    mostrarPrevia(urlImagem(campos.url.value.trim()));
});

campos.arquivo.addEventListener('change', async function () {
    const arquivo = campos.arquivo.files[0];
    if (!arquivo) return;
    const leitura = ++leituraImagem;
    salvar.disabled = true;
    elemento('erro-form').hidden = true;
    try {
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
            throw new Error('Escolha uma imagem PNG, JPG, WebP ou GIF de até 5 MB.');
        }
        const foto = await createImageBitmap(arquivo);
        const escala = Math.min(1, 960 / foto.width, 720 / foto.height);
        const tela = document.createElement('canvas');
        tela.width = Math.max(1, Math.round(foto.width * escala));
        tela.height = Math.max(1, Math.round(foto.height * escala));
        const pincel = tela.getContext('2d');
        pincel.fillStyle = '#fff';
        pincel.fillRect(0, 0, tela.width, tela.height);
        pincel.drawImage(foto, 0, 0, tela.width, tela.height);
        foto.close();
        if (leitura !== leituraImagem) return;
        imagemLocal = tela.toDataURL('image/jpeg', 0.8);
        campos.url.value = '';
        mostrarPrevia(imagemLocal);
    } catch (erro) {
        if (leitura !== leituraImagem) return;
        campos.arquivo.value = '';
        mostrarErro('erro-form', erro.name === 'Error' ? erro : new Error('Não foi possível abrir a imagem.'));
    } finally {
        if (leitura === leituraImagem) salvar.disabled = false;
    }
});

formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (salvar.disabled || !formulario.reportValidity()) return;
    try {
        const dados = dadosParaAlterar();
        const nome = campos.nome.value.trim();
        const beneficio = campos.beneficio.value.trim();
        const imagem = imagemLocal || urlImagem(campos.url.value.trim());
        if (nome.length < 3 || beneficio.length < 3) throw new Error('Preencha o nome e o benefício com pelo menos 3 caracteres.');
        if (!imagem) throw new Error('Selecione uma imagem ou informe uma URL HTTP ou HTTPS válida.');
        if (imagem.length > 1200000) throw new Error('A imagem é muito grande para o armazenamento local. Escolha uma menor.');
        if (exercicioEmEdicao) {
            const exercicio = dados.exercicios.find(item => item.id === exercicioEmEdicao);
            if (!exercicio) throw new Error('Esse exercício foi removido. Atualize a lista.');
            Object.assign(exercicio, { nome, beneficio, imagem });
        } else {
            dados.exercicios.push({ id: crypto.randomUUID(), nome, beneficio, imagem });
        }
        salvarDadosMenu(crefitoAtual, dados);
        fecharEditor();
        atualizarTela();
        avisar('Exercício salvo.');
    } catch (erro) {
        mostrarErro('erro-form', erro);
    }
});

function removerExercicio(exercicio) {
    if (!window.confirm('Remover “' + exercicio.nome + '”? O exercício será retirado dos planos e seus registros de dor também serão excluídos.')) return;
    try {
        const dados = dadosParaAlterar();
        dados.exercicios = dados.exercicios.filter(item => item.id !== exercicio.id);
        for (const ficha of dados.pacientes) {
            if (ficha.exercicioIds) ficha.exercicioIds = ficha.exercicioIds.filter(id => id !== exercicio.id);
            if (ficha.registros) ficha.registros = ficha.registros.filter(registro => registro.exercicioId !== exercicio.id);
        }
        salvarDadosMenu(crefitoAtual, dados);
        if (exercicioEmEdicao === exercicio.id) fecharEditor();
        atualizarTela();
        avisar('Exercício removido.');
    } catch (erro) {
        mostrarErro('erro', erro);
    }
}

elemento('atribuicao').addEventListener('submit', function (evento) {
    evento.preventDefault();
    try {
        const dados = dadosParaAlterar();
        const ficha = dados.pacientes.find(item => item.id === paciente.value);
        if (!ficha) throw new Error('Selecione um paciente válido.');
        const ids = [...selecionados];
        if (!ids.every(id => dados.exercicios.some(item => item.id === id))) {
            throw new Error('A lista de exercícios mudou. Confira a seleção.');
        }
        ficha.exercicioIds = ids;
        salvarDadosMenu(crefitoAtual, dados);
        atualizarTela();
        avisar('Exercícios do paciente atualizados.');
    } catch (erro) {
        mostrarErro('erro', erro);
    }
});

novo.addEventListener('click', () => abrirEditor());
elemento('cancelar').addEventListener('click', fecharEditor);
busca.addEventListener('input', atualizarTela);
paciente.addEventListener('change', atualizarTela);
window.addEventListener('pageshow', atualizarTela);
window.addEventListener('storage', atualizarTela);
atualizarTela();
const parametros = new URLSearchParams(location.search);
const pacientePedido = parametros.get('paciente') || parametros.get('patient');
if (pacientePedido) {
    paciente.value = pacientePedido;
    atualizarTela();
}
