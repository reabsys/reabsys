document.addEventListener('DOMContentLoaded', () => {

    const USUARIOS_DEMO = [
        { crefito: '123456-F', senha: '123456', nome: 'Fisio Demonstração' }
    ]

    const PAGINA_DESTINO = 'fisiomenu.html';

    const form = document.querySelector('form');
    const inputCrefito = document.getElementById('CREFITO');
    const inputSenha = document.getElementById('senha');
    const botao = form.querySelector('button[type="submit"]');


    const mensagem = document.createElement('p');
    mensagem.className = 'mensagem-erro';
    mensagem.setAttribute('role', 'alert');
    form.insertBefore(mensagem, botao);

    function mostrarErro(texto) {
        mensagem.textContent = texto;
        inputCrefito.classList.add('input-erro');
        inputSenha.classList.add('input-erro');
    }

    function limparErro() {
        mensagem.textContent = '';
        inputCrefito.classList.remove('input-erro');
        inputSenha.classList.remove('input-erro');
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
        limparErro();
    });

    inputSenha.addEventListener('input', limparErro);

    const ICONE_OLHO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const ICONE_OLHO_RISCADO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a19.7 19.7 0 0 1-3.17 4.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

    const envoltorio = document.createElement('div');
    envoltorio.className = 'campo-senha';
    inputSenha.parentNode.insertBefore(envoltorio, inputSenha);
    envoltorio.appendChild(inputSenha);

    const botaoOlho = document.createElement('button');
    botaoOlho.type = 'button';
    botaoOlho.className = 'toggle-senha';
    botaoOlho.setAttribute('aria-label', 'Mostrar senha');
    botaoOlho.setAttribute('aria-pressed', 'false');
    botaoOlho.innerHTML = ICONE_OLHO;
    envoltorio.appendChild(botaoOlho);

    botaoOlho.addEventListener('click', () => {
        const mostrando = inputSenha.type === 'text';

        inputSenha.type = mostrando ? 'password' : 'text';
        botaoOlho.innerHTML = mostrando ? ICONE_OLHO : ICONE_OLHO_RISCADO;
        botaoOlho.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
        botaoOlho.setAttribute('aria-pressed', String(!mostrando));

        inputSenha.focus();
    });

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        limparErro();

        const crefito = inputCrefito.value.trim().toUpperCase();
        const senha = inputSenha.value;

        if (!crefito || !senha) {
            mostrarErro('Preencha o CREFITO e a senha.');
            return;
        }

        const usuario = USUARIOS_DEMO.find(
            (u) => u.crefito === crefito && u.senha === senha
        );

        if (!usuario) {
            mostrarErro('CREFITO ou senha incorretos.');
            inputSenha.value = '';
            inputSenha.focus();
            return;
        }

        sessionStorage.setItem('reabsys_usuario', JSON.stringify({
            nome: usuario.nome,
            crefito: usuario.crefito
        }));

        window.location.href = PAGINA_DESTINO;

    });
});