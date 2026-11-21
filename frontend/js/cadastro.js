// Para mudar se formulário
const abas = document.querySelectorAll('.aba');
abas.forEach(aba => {
    aba.addEventListener('click', function() {

        abas.forEach(item => {
        item.classList.remove('ativa');
    });

        this.classList.add('ativa');

        const formularioId = this.getAttribute('data-form');

        document.querySelectorAll('.formulario').forEach(formulario => {

            if (formulario.id === formularioId) {
                formulario.hidden = false;
            } else {
                formulario.hidden = true;
            }

        });

    });
});

// Máscara do CPF
const campoCPF = document.querySelector("#cpf");
if (campoCPF) {

    campoCPF.addEventListener("input", function() {

        let valor = this.value.replace(/\D/g, "");

        // Limita a 11 números
        valor = valor.substring(0, 11);

        // Adiciona o primeiro ponto
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");

        // Adiciona o segundo ponto
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");

        // Adiciona o traço
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

        this.value = valor;
    });
}

// Alteração da mensagem de erro padrão
const formularios = document.querySelectorAll(".formulario");
formularios.forEach(formulario => {
    const campos = formulario.querySelectorAll("input, select, textarea");
    campos.forEach(campo => {
        campo.addEventListener("invalid", function() {

            if (this.validity.valueMissing) {
                this.setCustomValidity("Este campo é obrigatório.");

            } else if (this.validity.typeMismatch) {
                this.setCustomValidity("Digite uma informação válida.");

            }
        });
        campo.addEventListener("input", function() {
            this.setCustomValidity("");
        });

        campo.addEventListener("change", function() {
            this.setCustomValidity("");
        });
    });
});

// Configurações do calendário
const portugues = {
    days: [
        "domingo",
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado"
    ],

    daysShort: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
    daysMin: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],

    months: [
        "janeiro", "fevereiro", "março", "abril",
        "maio", "junho", "julho", "agosto",
        "setembro", "outubro", "novembro", "dezembro"
    ],

    monthsShort: [
        "jan", "fev", "mar", "abr", "mai", "jun",
        "jul", "ago", "set", "out", "nov", "dez"
    ],

    today: "Hoje",
    clear: "Limpar",
    dateFormat: "dd/MM/yyyy",
    firstDay: 1
};

const campoData = document.querySelector("#dt-nascimento");

if (campoData) {

    const calendario = new AirDatepicker(campoData, {
        locale: portugues,
        dateFormat: "dd/MM/yyyy",
        maxDate: new Date(),
        autoClose: true
    });

}