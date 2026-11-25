const painel = document.getElementById('paciente-exercicios-painel');
const saudacao = document.getElementById('paciente-exercicios-saudacao');
const lista = document.getElementById('paciente-exercicios-lista');
const acesso = document.getElementById('paciente-exercicios-acesso');
const erro = document.getElementById('paciente-exercicios-erro');

function mostrarExercicios() {
    painel.hidden = true;
    acesso.hidden = true;
    erro.hidden = true;
    saudacao.textContent = 'Área do paciente';
    lista.replaceChildren();

    try {
        const vinculo = lerDadosPaciente();
        if (!vinculo) {
            acesso.hidden = false;
            return;
        }
        const ids = vinculo.paciente.exercicioIds || [];
        const exercicios = (vinculo.dados.exercicios || []).filter(item => ids.includes(item.id));
        const modelo = document.getElementById('paciente-exercicios-modelo');
        for (const exercicio of exercicios) {
            const cartao = modelo.content.firstElementChild.cloneNode(true);
            const foto = cartao.querySelector('img');
            const indisponivel = cartao.querySelector('.paciente-exercicios-midia p');
            foto.alt = exercicio.nome;
            foto.addEventListener('error', function () {
                foto.hidden = true;
                indisponivel.hidden = false;
            });
            if (exercicio.imagem) {
                foto.src = exercicio.imagem;
            } else {
                foto.hidden = true;
                indisponivel.hidden = false;
            }
            cartao.querySelector('h2').textContent = exercicio.nome;
            cartao.querySelector('.paciente-exercicios-detalhes p').textContent = exercicio.beneficio;
            const registro = cartao.querySelector('a');
            registro.href = 'paciente-registro.html?exercicio=' + encodeURIComponent(exercicio.id);
            registro.setAttribute('aria-label', 'Enviar registro de ' + exercicio.nome);
            lista.appendChild(cartao);
        }
        document.getElementById('paciente-exercicios-vazio').hidden = exercicios.length > 0;
        saudacao.textContent = 'Área do paciente · ' + vinculo.paciente.nome;
        painel.hidden = false;
    } catch {
        lista.replaceChildren();
        erro.hidden = false;
    }
}

window.addEventListener('pageshow', mostrarExercicios);
window.addEventListener('storage', mostrarExercicios);
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) mostrarExercicios();
});
mostrarExercicios();
