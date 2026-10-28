
const botaoMenu = document.getElementById('menuHamburguer');
const navHeader = document.querySelector('.navHeader');

botaoMenu.addEventListener('click', function () {
    const menuAberto = navHeader.classList.toggle('menu-aberto');

    botaoMenu.setAttribute('aria-expanded', menuAberto);
    botaoMenu.setAttribute(
        'aria-label',
        menuAberto ? 'Fechar menu' : 'Abrir menu'
    );
});

document.querySelectorAll('.navLinks a, .navConta a')
    .forEach(function (link) {
        link.addEventListener('click', function () {
            navHeader.classList.remove('menu-aberto');
            botaoMenu.setAttribute('aria-expanded', 'false');
            botaoMenu.setAttribute('aria-label', 'Abrir menu');
        });
    });
