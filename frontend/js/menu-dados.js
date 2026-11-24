function lerSessaoMenu() {
    const usuario = JSON.parse(sessionStorage.getItem('reabsys_usuario'));

    if (typeof usuario?.crefito !== 'string' || !usuario.crefito.trim()) {
        return null;
    }

    return { nome: usuario.nome, crefito: usuario.crefito.trim().toUpperCase() };
}

function lerDadosMenu(crefito) {
    const salvo = localStorage.getItem('reabsys_menu_' + crefito);
    if (salvo === null) {
        return { pacientes: [] };
    }

    const dados = JSON.parse(salvo);
    if (!Array.isArray(dados?.pacientes)) {
        throw new Error('Não foi possível ler as fichas deste fisioterapeuta.');
    }
    return dados;
}

function salvarDadosMenu(crefito, dados) {
    localStorage.setItem('reabsys_menu_' + crefito, JSON.stringify(dados));
}
