const fs = require('fs');
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const dotenv = require('dotenv');
const launcher = new Client();
let minecraftRunning = false; // Variable para controlar si Minecraft está corriendo
let outputLines = []; // Array para almacenar las líneas de salida
let config = {}; // Objeto para almacenar la configuración
let production = false;
dotenv.config();

// Ruta al archivo JSON de configuración                 ../../../../../config.json
const configPath = production ? path.resolve(__dirname, '../../../config.json') : path.join(__dirname, 'config.json');

// Configuración predeterminada
const defaultConfig = {
    username: 'defaultUser',
    root: './minecraft',
    version: '1.16',
    type: 'release',
    memoryMax: '6G',
    memoryMin: '4G'
};

// Función para verificar y crear el archivo config.json si no existe
function checkAndCreateConfigFile() {
    if (!fs.existsSync(configPath)) {
        try {
            const jsonData = JSON.stringify(defaultConfig, null, 2);
            fs.writeFileSync(configPath, jsonData, 'utf8');
            console.log('Archivo config.json creado con configuración predeterminada.');
        } catch (err) {
            console.error('Error al crear el archivo config.json:', err.message);
        }
    }
}


// Función para cargar la configuración desde el archivo JSON
function loadConfig() {
    //alert(configPath);
    checkAndCreateConfigFile(); 
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(data);
        document.getElementById('username').value = config.username;
        document.getElementById('root').value = config.root;
        document.getElementById('version').value = config.version;
        document.getElementById('type').value = config.type;
        document.getElementById('memoryMax').value = config.memoryMax;
        document.getElementById('memoryMin').value = config.memoryMin;
    } catch (err) {
        console.error('Error al cargar la configuración:', err.message);
    }
}

function saveConfig() {
    try {
        const jsonData = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, jsonData, 'utf8');
    } catch (err) {
        console.error('Error al guardar la configuración:', err.message);
    }
}

loadConfig();

document.getElementById('launchForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    if (minecraftRunning) {
        return; // Evitar múltiples lanzamientos si Minecraft ya está corriendo
    }

    const username = document.getElementById('username').value;
    const root = document.getElementById('root').value;
    const version = document.getElementById('version').value;
    const type = document.getElementById('type').value;
    const memoryMax = document.getElementById('memoryMax').value;
    const memoryMin = document.getElementById('memoryMin').value;

    config.username = username;
    config.root = root;
    config.version = version;
    config.type = type;
    config.memoryMax = memoryMax;
    config.memoryMin = memoryMin;

    saveConfig();

    let opts = {
        authorization: await Authenticator.getAuth(username),
        root: root + version,
        version: {
            number: version,
            type: type
        },
        memory: {
            max: memoryMax,
            min: memoryMin
        }
    };

    setLaunchButtonText('Running');
    setLaunchButtonColor('green');
    launchButtonDisabled(true); // Deshabilitar el botón de lanzamiento

    launcher.launch(opts);

    minecraftRunning = true;

    updateProgressBar(1);

    launcher.on('close', (e) => {
        clearOutput();

        loadConfig();

        setLaunchButtonText('Launch Minecraft');
        setLaunchButtonColor('blue');
        launchButtonDisabled(false); 
        minecraftRunning = false;
        updateProgressBar(0); 
    });

    launcher.on('debug', (e) => {
        updateOutput(e);
        updateProgressBar(25);
        updateProgressBar(100);
    });
    launcher.on('data', (e) => {
        updateOutput(e);
        updateProgressBar(25);
    });
    launcher.on('progress', (e) => {
        updateOutput(e);
        updateProgressBar(75);
    });
    updateProgressBar(100);
});

function setLaunchButtonColor(color) {
    const launchButton = document.querySelector('button[type="submit"]');
    launchButton.classList.remove('btn-primary', 'btn-success'); 
    launchButton.classList.add(color === 'green' ? 'btn-success' : 'btn-primary'); 
}

function setLaunchButtonText(text) {
    const launchButton = document.querySelector('button[type="submit"]');
    launchButton.textContent = text;
}

function launchButtonDisabled(disabled) {
    const launchButton = document.querySelector('button[type="submit"]');
    launchButton.disabled = disabled;
}

function updateOutput(message) {
    outputLines.push(message); 

    if (outputLines.length > 5) {
        outputLines.shift(); // Eliminar la primera línea si excede 5 líneas
    }

    const output = document.getElementById('output');
    output.textContent = outputLines.join('\n'); // Actualizar el contenido del elemento
}

function clearOutput() {
    outputLines = []; 

    const output = document.getElementById('output');
    output.textContent = ''; 
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressBar.textContent = `${percentage}%`;
}

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;
let isDarkMode = true; // Iniciar en modo oscuro
        
themeToggleBtn.addEventListener('click', function() {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                body.classList.remove('theme-light');
                body.style.backgroundColor = '#343a40'; 
                body.style.color = '#fff'; 
                themeIcon.src = './img/sun-icon.png'; 
            } else {
                body.classList.add('theme-light');
                body.style.backgroundColor = '#fff'; 
                body.style.color = '#343a40'; 
                themeIcon.src = './img/moon-icon.png'; 
            }
});

const optionsButton = document.querySelector('.btn-options');
const optionGroups = document.querySelectorAll('.option-group');

optionsButton.addEventListener('click', function() {
            optionGroups.forEach(group => {
                group.classList.toggle('active');
            });

            optionsButton.classList.toggle('active');
            if (optionsButton.classList.contains('active')) {
                optionsButton.style.backgroundColor = '#dc3545'; 
                optionsButton.style.borderColor = '#dc3545';
            } else {
                optionsButton.style.backgroundColor = '#28a745';
                optionsButton.style.borderColor = '#28a745';
            }
});

const usernameInput = document.getElementById('username');
const usernameError = document.getElementById('usernameError');

usernameInput.addEventListener('input', function() {
            const usernameValue = usernameInput.value.trim();
            const regex = /^[A-Za-z0-9]+$/;

            if (regex.test(usernameValue)) {
                usernameError.style.display = 'none';
            } else {
                usernameError.style.display = 'block';
            }
        });
    