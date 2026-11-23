function lerDadosPaciente() {
    // O login do grupo deverá gravar reabsys_paciente com { pacienteId, crefito }.
    const sessao = JSON.parse(sessionStorage.getItem('reabsys_paciente'));
    if (typeof sessao?.pacienteId !== 'string' || !sessao.pacienteId.trim() ||
        typeof sessao.crefito !== 'string' || !sessao.crefito.trim()) {
        return null;
    }

    const crefito = sessao.crefito.trim().toUpperCase();
    const dados = lerDadosMenu(crefito);
    const paciente = dados.pacientes.find(ficha => ficha.id === sessao.pacienteId);
    return paciente ? { crefito, paciente, dados } : null;
}
