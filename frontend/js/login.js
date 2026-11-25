document.addEventListener('DOMContentLoaded', () => {

    const USUARIOS_DEMO = [
        { crefito: '123456-F', senha: '123456', nome: 'Fisio Demonstração' }
    ]

    const PAGINA_DESTINO = 'fisiomenu.html';

    const form = document.getElementById('form-fisio');
    const inputCrefito = document.getElementById('CREFITO');
    const inputSenha = document.getElementById('senha');
    const formPaciente = document.getElementById('form-paciente');
    const inputEmailPaciente = document.getElementById('login-paciente-email');
    const inputSenhaPaciente = document.getElementById('login-paciente-senha');
    const formularios = document.querySelectorAll('.formulario');
    const abas = document.querySelectorAll('.aba');

    const ICONE_OLHO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const ICONE_OLHO_RISCADO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a19.7 19.7 0 0 1-3.17 4.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

    function mostrarErro(formulario, texto) {
        formulario.querySelector('.mensagem-erro').textContent = texto;
        formulario.querySelectorAll('input').forEach(input => {
            input.classList.add('input-erro');
        });
    }

    function limparErro(formulario) {
        formulario.querySelector('.mensagem-erro').textContent = '';
        formulario.querySelectorAll('input').forEach(input => {
            input.classList.remove('input-erro');
        });
    }

    formularios.forEach(formulario => {
        const botao = formulario.querySelector('button[type="submit"]');
        const campoSenha = formulario.querySelector('input[type="password"]');
        const mensagem = document.createElement('p');
        mensagem.className = 'mensagem-erro';
        mensagem.setAttribute('role', 'alert');
        formulario.insertBefore(mensagem, botao);

        formulario.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => limparErro(formulario));
        });

        const envoltorio = document.createElement('div');
        envoltorio.className = 'campo-senha';
        campoSenha.parentNode.insertBefore(envoltorio, campoSenha);
        envoltorio.appendChild(campoSenha);

        const botaoOlho = document.createElement('button');
        botaoOlho.type = 'button';
        botaoOlho.className = 'toggle-senha';
        botaoOlho.setAttribute('aria-label', 'Mostrar senha');
        botaoOlho.setAttribute('aria-pressed', 'false');
        botaoOlho.innerHTML = ICONE_OLHO;
        envoltorio.appendChild(botaoOlho);

        botaoOlho.addEventListener('click', () => {
            const mostrando = campoSenha.type === 'text';
            campoSenha.type = mostrando ? 'password' : 'text';
            botaoOlho.innerHTML = mostrando ? ICONE_OLHO : ICONE_OLHO_RISCADO;
            botaoOlho.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
            botaoOlho.setAttribute('aria-pressed', String(!mostrando));
            campoSenha.focus();
        });
    });

    function selecionarAba(aba) {
        abas.forEach(item => {
            const selecionada = item === aba;
            item.classList.toggle('ativa', selecionada);
            item.setAttribute('aria-selected', String(selecionada));
            item.tabIndex = selecionada ? 0 : -1;
        });
        formularios.forEach(formulario => {
            formulario.hidden = formulario.id !== aba.dataset.form;
            limparErro(formulario);
        });
        const fisioSelecionado = aba.dataset.form === 'form-fisio';
        document.querySelector('.cadastro').hidden = !fisioSelecionado;
        document.querySelector('.demo-aviso').hidden = !fisioSelecionado;
    }

    abas.forEach((aba, indice) => {
        aba.addEventListener('click', () => selecionarAba(aba));
        aba.addEventListener('keydown', evento => {
            let destino;
            if (evento.key === 'ArrowRight') destino = (indice + 1) % abas.length;
            else if (evento.key === 'ArrowLeft') destino = (indice + abas.length - 1) % abas.length;
            else if (evento.key === 'Home') destino = 0;
            else if (evento.key === 'End') destino = abas.length - 1;
            else return;

            evento.preventDefault();
            selecionarAba(abas[destino]);
            abas[destino].focus();
        });
    });

    function normalizarEmail(valor) {
        return valor.replace(/\s/g, '').toLowerCase();
    }

    inputEmailPaciente.addEventListener('input', () => {
        inputEmailPaciente.value = normalizarEmail(inputEmailPaciente.value);
    });

    function buscarPaciente(email) {
        const prefixo = 'reabsys_menu_';
        for (let indice = 0; indice < localStorage.length; indice++) {
            const chave = localStorage.key(indice);
            if (!chave || !chave.startsWith(prefixo)) continue;
            const crefito = chave.slice(prefixo.length);
            if (!crefito) continue;

            let dados;
            try {
                dados = lerDadosMenu(crefito);
            } catch {
                continue;
            }
            const paciente = dados.pacientes.find(ficha =>
                typeof ficha?.id === 'string' && ficha.id.trim() &&
                typeof ficha.email === 'string' && normalizarEmail(ficha.email) === email &&
                (ficha.situacao === undefined || ficha.situacao === 'ativo')
            );
            if (paciente) return { pacienteId: paciente.id, crefito: crefito };
        }
        return null;
    }

    inputCrefito.maxLength = 10;

    function aplicarMascaraCrefito(valor, apagando) {
        const limpo = valor.toUpperCase().replace(/[^0-9A-Z]/g, '');
        const numeros = limpo.match(/^\d{0,6}/)[0];
        const letras = limpo.slice(numeros.length).replace(/[^A-Z]/g, '').slice(0, 3);

        let resultado = numeros;

        if (letras || (numeros.length === 6 && !apagando)) {
            resultado += '-' + letras;
        }
        return resultado;
    }

    inputCrefito.addEventListener('input', (evento) => {
        const apagando = Boolean(evento.inputType && evento.inputType.startsWith('delete'));
        inputCrefito.value = aplicarMascaraCrefito(inputCrefito.value, apagando);
    });

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        limparErro(form);

        const crefito = inputCrefito.value.trim().toUpperCase();
        const senha = inputSenha.value;

        if (!crefito || !senha) {
            mostrarErro(form, 'Preencha o CREFITO e a senha.');
            return;
        }

        const usuario = USUARIOS_DEMO.find(
            (u) => u.crefito === crefito && u.senha === senha
        );

        if (!usuario) {
            mostrarErro(form, 'CREFITO ou senha incorretos.');
            inputSenha.value = '';
            inputSenha.focus();
            return;
        }

        sessionStorage.setItem('reabsys_usuario', JSON.stringify({
            nome: usuario.nome,
            crefito: usuario.crefito
        }));

        sessionStorage.removeItem('reabsys_paciente');

        window.location.href = PAGINA_DESTINO;

    });

    formPaciente.addEventListener('submit', evento => {
        evento.preventDefault();
        limparErro(formPaciente);

        const email = normalizarEmail(inputEmailPaciente.value);
        const senha = inputSenhaPaciente.value;
        inputEmailPaciente.value = email;
        if (!email || !senha.trim()) {
            mostrarErro(formPaciente, 'Preencha o e-mail e a senha.');
            return;
        }

        try {
            const paciente = buscarPaciente(email);
            if (!paciente) {
                mostrarErro(formPaciente, 'Paciente não encontrado. Peça ao seu fisioterapeuta para cadastrar sua ficha.');
                inputSenhaPaciente.value = '';
                inputSenhaPaciente.focus();
                return;
            }
            sessionStorage.setItem('reabsys_paciente', JSON.stringify(paciente));
            sessionStorage.removeItem('reabsys_usuario');
            window.location.href = 'paciente-exercicios.html';
        } catch {
            mostrarErro(formPaciente, 'Não foi possível acessar os dados deste navegador. Tente novamente.');
        }
    });
});
