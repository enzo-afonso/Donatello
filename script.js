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

    if (isInvalid) {
        commandLine.classList.add('invalid-command');
    }

    consoleDiv.appendChild(commandLine);
}

// Executar comando ao pressionar ENTER
commandInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {
        executeCommand();
    }
});

// Navegar pelo histórico de comandos
commandInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 38) { // seta ↑
        event.preventDefault();
        if (commandHistory.length > 0) {
            if (historyIndex === -1) {
                historyIndex = commandHistory.length - 1;
            } else if (historyIndex > 0) {
                historyIndex--;
            }
            commandInput.value = commandHistory[historyIndex];
        }
    } else if (event.keyCode === 40) { // seta ↓
        event.preventDefault();
        if (commandHistory.length > 0) {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = -1;
                commandInput.value = '';
            }
        }
    }
});

// Posição inicial: centro do canvas
let posX = canvas.width / 2;
let posY = canvas.height / 2;
let angle = 0;
const step = 20;

// Inicializa o robô no centro
robot.style.top = `${posY}px`;
robot.style.left = `${posX}px`;
robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

// Inicia o desenho no centro
ctx.beginPath();
ctx.moveTo(posX, posY);

// Função para interpretar e executar comandos
function executeCommand() {
    const commandInputValue = commandInput.value.trim().toLowerCase();
    const [action, value] = commandInputValue.split(' ');

    if (action === 'parafrente' || action === 'paratras' || action === 'paradireita' || action === 'paraesquerda') {
        if (isNaN(value)) {
            addToConsole(commandInputValue, false);
            addToConsole('Valor inválido! Digite um número.', true);
            return;
        } else if (!Number.isInteger(parseFloat(value))) {
            addToConsole(commandInputValue, false);
            addToConsole('Valor inválido! Digite um número inteiro.', true);
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
            addToConsole('Comando não reconhecido!', true);
    }

    commandInput.value = '';
}

function sendCommandToESP(action, value) {
    const espIpAddress = '192.168.137.74'; // IP do ESP8266
    const url = `http://${espIpAddress}/command?action=${action}&value=${value || '0'}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Comando não enviado para o ESP8266');
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
    const newPosX = posX + Math.cos(radians) * units * step;
    const newPosY = posY + Math.sin(radians) * units * step;

    const minX = 20, minY = 20;
    const maxX = canvas.width - 20, maxY = canvas.height - 20;

    if (newPosX >= minX && newPosX <= maxX && newPosY >= minY && newPosY <= maxY) {
        posX = newPosX;
        posY = newPosY;
        robot.style.top = `${posY}px`;
        robot.style.left = `${posX}px`;
        ctx.lineTo(posX, posY);
        ctx.strokeStyle = '#646D35';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        addToConsole('A tartaruga não pode sair da arena!', true);
    }
}

// Função para mover o robô para trás
function moveBackward(units) {
    const radians = (Math.PI / 180) * angle;
    const newPosX = posX - Math.cos(radians) * units * step;
    const newPosY = posY - Math.sin(radians) * units * step;

    const minX = 20, minY = 20;
    const maxX = canvas.width - 20, maxY = canvas.height - 20;

    if (newPosX >= minX && newPosX <= maxX && newPosY >= minY && newPosY <= maxY) {
        posX = newPosX;
        posY = newPosY;
        robot.style.top = `${posY}px`;
        robot.style.left = `${posX}px`;
        ctx.lineTo(posX, posY);
        ctx.strokeStyle = '#646D35';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        addToConsole('A tartaruga não pode sair da arena!', true);
    }
}

// Rotacionar robô
function rotateRight(degrees) {
    angle = (angle + degrees) % 360;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

function rotateLeft(degrees) {
    angle = (angle - degrees + 360) % 360;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

// Reiniciar desenho
function resetDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    posX = canvas.width / 2;
    posY = canvas.height / 2;
    angle = 0;

    robot.style.top = `${posY}px`;
    robot.style.left = `${posX}px`;
    robot.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    consoleDiv.innerHTML = '';

    ctx.beginPath();
    ctx.moveTo(posX, posY);
}
