const firebaseConfig = {
    apiKey: "AIzaSyC5yTL6aQ-LEP1Bcl6cJBOaxl5dmi4HsFo",
    authDomain: "pfe-smart-irrigation2.firebaseapp.com",
    databaseURL: "https://pfe-smart-irrigation2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pfe-smart-irrigation2",
    storageBucket: "pfe-smart-irrigation2.appspot.com",
    messagingSenderId: "503798252883",
    appId: "1:503798252883:web:18f8e18b18c236fe84cda6",
    measurementId: "G-P0RD5Z1BGZ"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const currentHumidity = document.getElementById('current-humidity');
const currentTemperature = document.getElementById('current-temperature');
const currentSoilMoisture = document.getElementById('current-soilmoisture');

const humidityTable = document.getElementById('humidity-table');
const temperatureTable = document.getElementById('temperature-table');
const soilMoistureTable = document.getElementById('soilmoisture-table');

const pompeStatus = document.getElementById('pompe-status');
const togglePompeBtn = document.getElementById('toggle-pompe');
const pumpTimer = document.getElementById('pump-timer');

const MAX_TABLE_ENTRIES = 10;

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR');
}

function parseEntries(data) {
    return Object.entries(data).map(([key, value]) => {
        const parts = key.split('_');
        const date = new Date(
            2000 + parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
            parseInt(parts[3]),
            parseInt(parts[4]),
            parseInt(parts[5])
        );
        return { timestamp: date.getTime(), value };
    }).sort((a, b) => b.timestamp - a.timestamp);
}

function updateTable(data, tableElement, valueElement, unit) {
    if (!data) return;
    tableElement.innerHTML = '';
    const entries = parseEntries(data);
    if (entries.length > 0) valueElement.textContent = `${entries[0].value}${unit}`;
    entries.slice(0, MAX_TABLE_ENTRIES).forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${formatTimestamp(entry.timestamp)}</td><td>${entry.value}${unit}</td>`;
        tableElement.appendChild(row);
    });
    if (entries.length === 0) {
        tableElement.innerHTML = '<tr><td colspan="2">Aucune donnée disponible</td></tr>';
    }
}

database.ref('humidity').on('value', (snapshot) => {
    updateTable(snapshot.val(), humidityTable, currentHumidity, '%');
});
database.ref('temperature').on('value', (snapshot) => {
    updateTable(snapshot.val(), temperatureTable, currentTemperature, '°C');
});
database.ref('soilMoisture').on('value', (snapshot) => {
    updateTable(snapshot.val(), soilMoistureTable, currentSoilMoisture, '%');
});

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) {
        currentHumidity.textContent = '--';
        currentTemperature.textContent = '--';
        currentSoilMoisture.textContent = '--';
        humidityTable.innerHTML = '<tr><td colspan="2">Erreur de connexion</td></tr>';
        temperatureTable.innerHTML = '<tr><td colspan="2">Erreur de connexion</td></tr>';
        soilMoistureTable.innerHTML = '<tr><td colspan="2">Erreur de connexion</td></tr>';
    }
});

function updatePompeDisplay(status) {
    if (status === 'on') {
        pompeStatus.textContent = 'Allumée';
        togglePompeBtn.textContent = 'Éteindre la Pompe';
        togglePompeBtn.classList.add('active');
    } else {
        pompeStatus.textContent = 'Éteinte';
        togglePompeBtn.textContent = 'Allumer la Pompe';
        togglePompeBtn.classList.remove('active');
    }
}

togglePompeBtn.addEventListener('click', () => {
    const newStatus = pompeStatus.textContent === 'Allumée' ? 'off' : 'on';
    database.ref('pompe').set({ status: newStatus });
});

let pumpStartTime = null;
let pumpTimerInterval = null;

function formatElapsed(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
}

function startPumpTimer() {
    pumpStartTime = Date.now();
    pumpTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - pumpStartTime) / 1000);
        pumpTimer.textContent = `Temps de fonctionnement : ${formatElapsed(elapsed)}`;
    }, 1000);
}

function stopPumpTimer() {
    clearInterval(pumpTimerInterval);
    pumpTimerInterval = null;
    pumpTimer.textContent = '';
}

database.ref('pompe/status').on('value', (snapshot) => {
    const status = snapshot.val() || 'off';
    updatePompeDisplay(status);
    if (status === 'on') {
        startPumpTimer();
    } else {
        stopPumpTimer();
    }
});
