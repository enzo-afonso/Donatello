const robot = document.getElementById('robot');
const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');
const consoleDiv = document.getElementById('console');
const commandInput = document.getElementById('command');

// Histórico de comandos
let commandHistory = [];
let historyIndex = -1; // Índice atual no histórico

// Função para adicionar comandos ao console
function addToConsole(command, isInvalid = false) {
    const commandLine = document.createElement('div');
    commandLine.textContent = `> ${command}`;

    // Adiciona classe para comandos inválidos
    if (isInvalid) {
        commandLine.classList.add('invalid-command');
    }

    consoleDiv.appendChild(commandLine);
}

// Executar comando ao pressionar ENTER
commandInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) { // 13 é o código da tecla ENTER
        executeCommand();
    }
});

// Navegar pelo histórico de comandos
commandInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 38) { // Seta para cima
        event.preventDefault(); // Evita que o cursor se mova para o início do campo
        if (commandHistory.length > 0) {
            if (historyIndex === -1) {
                historyIndex = commandHistory.length - 1; // Começa do último comando
            } else if (historyIndex > 0) {
                historyIndex--; // Vai para o comando anterior
            }
            commandInput.value = commandHistory[historyIndex];
        }
    } else if (event.keyCode === 40) { // Seta para baixo
        event.preventDefault(); // Evita que o cursor se mova para o final do campo
        if (commandHistory.length > 0) {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++; // Vai para o próximo comando
                commandInput.value = commandHistory[historyIndex];
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = -1; // Volta ao estado inicial (campo vazio)
                commandInput.value = '';
            }
        }
    }
});

let posX = 180, posY = 180; // Posição inicial (o centro do robô)
let angle = 0; // Ângulo atual do robô (em graus)
const step = 20; // Tamanho do passo

// Inicializa o robô na posição inicial
robot.style.top = `${posY}px`;
robot.style.left = `${posX}px`;

// Inicia o desenho no centro
ctx.beginPath();
ctx.moveTo(posX, posY);

// Função para interpretar e executar comandos
function executeCommand() {
    const commandInputValue = commandInput.value.trim().toLowerCase();
    const [action, value] = commandInputValue.split(' ');

    // Verifica se o comando é válido
    if (action === 'parafrente' || action === 'paratras' || action === 'paradireita' || action === 'paraesquerda') {
        if (isNaN(value)) {
            // Comando inválido: valor não é um número
            addToConsole(commandInputValue, false); // Exibe o comando em vermelho
            addToConsole('Valor inválido! Digite um número.', true); // Exibe o aviso em vermelho
            return;
        } else if (!Number.isInteger(parseFloat(value))) {
            // Comando inválido: valor é decimal
            addToConsole(commandInputValue, false); // Exibe o comando em vermelho
            addToConsole('Valor inválido! Digite um número inteiro.', true); // Exibe o aviso em vermelho
            return;
        }
    }

    commandHistory.push(commandInputValue);
    historyIndex = -1; 

    addToConsole(commandInputValue);

    sendCommandToESP(action, value);

    switch (action) {
        case 'pf':
            moveForward(parseInt(value));
            break;
        case 'pt':
            moveBackward(parseInt(value));
            break;
        case 'vd':
            rotateRight(parseInt(value));
            break;
        case 've':
            rotateLeft(parseInt(value));
            break;
        default:
            addToConsole('Comando não reconhecido!', true); // Exibe o aviso em vermelho
    }

    commandInput.value = '';
}

function sendCommandToESP(action, value) {
    const espIpAddress = '192.168.137.176'; // Substitua pelo IP do seu ESP8266
    const url = `http://${espIpAddress}/command?action=${action}&value=${value || '0'}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Comando não enviado para o ESP8266');
            }
            console.log('Comando enviado com sucesso para o ESP8266.');
        })
        .catch(error => {
            console.error('Erro ao enviar comando:', error);
            addToConsole('', true);
        });
}

// Função para mover o robô para frente
function moveForward(units) {
    const radians = (Math.PI / 180) * angle;

    // Calcula a nova posição
    const newPosX = posX + Math.cos(radians) * units * step;
    const newPosY = posY + Math.sin(radians) * units * step;

    // Verifica se a nova posição está dentro dos limites do canvas
    const minX = 20; // Metade do tamanho da tartaruga
    const minY = 20; // Metade do tamanho da tartaruga
    const maxX = canvas.width - 20; // Largura do canvas menos metade do tamanho da tartaruga
    const maxY = canvas.height - 20; // Altura do canvas menos metade do tamanho da tartaruga

    if (newPosX >= minX && newPosX <= maxX && newPosY >= minY && newPosY <= maxY) {
        // Atualiza a posição da tartaruga
        posX = newPosX;
        posY = newPosY;

        // Atualiza a posição do robô
        robot.style.top = `${posY}px`;
        robot.style.left = `${posX}px`;

        // Desenha a linha
        ctx.lineTo(posX, posY);
        ctx.strokeStyle = '#646D35';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        // Tartaruga tenta sair da arena
        addToConsole('A tartaruga não pode sair da arena!', true); // Exibe o aviso em vermelho
    }
}

// Função para mover o robô para trás
function moveBackward(units) {
    const radians = (Math.PI / 180) * angle;

    // Calcula a nova posição (movimento na direção oposta)
    const newPosX = posX - Math.cos(radians) * units * step;
    const newPosY = posY - Math.sin(radians) * units * step;

    // Verifica se a nova posição está dentro dos limites do canvas
    const minX = 20; // Metade do tamanho da tartaruga
    const minY = 20; // Metade do tamanho da tartaruga
    const maxX = canvas.width - 20; // Largura do canvas menos metade do tamanho da tartaruga
    const maxY = canvas.height - 20; // Altura do canvas menos metade do tamanho da tartaruga

    if (newPosX >= minX && newPosX <= maxX && newPosY >= minY && newPosY <= maxY) {
        // Atualiza a posição da tartaruga
        posX = newPosX;
        posY = newPosY;

        // Atualiza a posição do robô
        robot.style.top = `${posY}px`;
        robot.style.left = `${posX}px`;

        // Desenha a linha
        ctx.lineTo(posX, posY);
        ctx.strokeStyle = '#646D35';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        // Tartaruga tenta sair da arena
        addToConsole('A tartaruga não pode sair da arena!', true); // Exibe o aviso em vermelho
    }
}

// Funções para rotacionar o robô
function rotateRight(degrees) {
    angle = (angle + degrees) % 360;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

function rotateLeft(degrees) {
    angle = (angle - degrees + 360) % 360;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

// Função para reiniciar o desenho
function resetDraw() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reinicia a posição e o ângulo
    posX = 180;
    posY = 180;
    angle = 0;
    robot.style.top = `${posY}px`;
    robot.style.left = `${posX}px`;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    // Limpa o console
    consoleDiv.innerHTML = '';

    // Reinicia o desenho
    ctx.beginPath();
    ctx.moveTo(posX, posY);
}