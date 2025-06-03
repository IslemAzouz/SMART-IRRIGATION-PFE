const firebaseConfig = {
  apiKey: "AIzaSyC5yTL6aQ-LEP1Bcl6cJBOaxl5dmi4HsFo",
  authDomain: "pfe-smart-irrigation2.firebaseapp.com",
  databaseURL: "https://pfe-smart-irrigation2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pfe-smart-irrigation2",
  storageBucket: "pfe-smart-irrigation2.firebaseapp.com",
  messagingSenderId: "503798252883",
  appId: "1:503798252883:web:18f8e18b18c236fe84cda6",
  measurementId: "G-P0RD5Z1BGZ"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const currentHumidity = document.getElementById('current-humidity');
const currentTemperature = document.getElementById('current-temperature');
const humidityTable = document.getElementById('humidity-table');
const temperatureTable = document.getElementById('temperature-table');
const pompeStatus = document.getElementById('pompe-status');
const togglePompeBtn = document.getElementById('toggle-pompe');
const pumpTimer = document.getElementById('pump-timer');

const MAX_TABLE_ENTRIES = 10;

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('fr-FR');
}

function updateHumidityTable(data) {
  if (!data) return;
  humidityTable.innerHTML = '';

  const entries = Object.entries(data).map(([key, value]) => {
    const parts = key.split('_');
    const year = 2000 + parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10);
    const minute = parseInt(parts[4], 10);
    const second = parseInt(parts[5], 10);
    const date = new Date(year, month, day, hour, minute, second);
    return {
      timestamp: date.getTime(),
      value: value
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  if (entries.length > 0) {
    currentHumidity.textContent = `${entries[0].value}%`;
  }

  const limitedEntries = entries.slice(0, MAX_TABLE_ENTRIES);
  limitedEntries.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${formatTimestamp(entry.timestamp)}</td><td>${entry.value}%</td>`;
    humidityTable.appendChild(row);
  });

  if (limitedEntries.length === 0) {
    humidityTable.innerHTML = '<tr><td colspan="2">Aucune donnée disponible</td></tr>';
  }
}

function updateTemperatureTable(data) {
  if (!data) return;
  temperatureTable.innerHTML = '';

  const entries = Object.entries(data).map(([key, value]) => {
    const parts = key.split('_');
    const year = 2000 + parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10);
    const minute = parseInt(parts[4], 10);
    const second = parseInt(parts[5], 10);
    const date = new Date(year, month, day, hour, minute, second);
    return {
      timestamp: date.getTime(),
      value: value
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  if (entries.length > 0) {
    currentTemperature.textContent = `${entries[0].value}°C`;
  }

  const limitedEntries = entries.slice(0, MAX_TABLE_ENTRIES);
  limitedEntries.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${formatTimestamp(entry.timestamp)}</td><td>${entry.value}°C</td>`;
    temperatureTable.appendChild(row);
  });

  if (limitedEntries.length === 0) {
    temperatureTable.innerHTML = '<tr><td colspan="2">Aucune donnée disponible</td></tr>';
  }
}

database.ref('humidity').on('value', (snapshot) => {
  updateHumidityTable(snapshot.val());
});

database.ref('temperature').on('value', (snapshot) => {
  updateTemperatureTable(snapshot.val());
});

database.ref('.info/connected').on('value', (snapshot) => {
  if (snapshot.val() === false) {
    currentHumidity.textContent = '--';
    currentTemperature.textContent = '--';
    humidityTable.innerHTML = '<tr><td colspan="2">Erreur de connexion</td></tr>';
    temperatureTable.innerHTML = '<tr><td colspan="2">Erreur de connexion</td></tr>';
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
