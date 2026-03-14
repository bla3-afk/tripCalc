let map, markers = [];
let vehicleKmpl = 12.5; 
let selectedCurrency = "$";

// 1. Map Initialization with User Location
function initMap() {
    map = L.map('map').setView([0, 0], 2); // Default zoom out
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Try to find user's current location
    map.locate({setView: true, maxZoom: 13});

    map.on('click', (e) => {
        if (markers.length >= 2) {
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }
        let marker = L.marker(e.latlng).addTo(map);
        markers.push(marker);

        if (markers.length === 2) {
            const dist = (markers[0].getLatLng().distanceTo(markers[1].getLatLng()) / 1000).toFixed(2);
            document.getElementById('distance').value = dist;
            document.getElementById('mapHint').innerText = `Destination set! Distance: ${dist} km`;
        }
    });
}

// 2. Mileage Simulation (Keyword Based)
function fetchVehicleData() {
    const model = document.getElementById('carSearch').value.toLowerCase();
    const info = document.getElementById('carInfo');
    if (!model) return;

    let kmpl = 12.5; 
    if (model.includes("tesla") || model.includes("ev") || model.includes("electric")) kmpl = 48.0;
    else if (model.includes("civic") || model.includes("corolla") || model.includes("hybrid")) kmpl = 18.5;
    else if (model.includes("truck") || model.includes("f150") || model.includes("suv")) kmpl = 8.2;

    vehicleKmpl = kmpl;
    info.innerHTML = `✅ <strong>${kmpl} km/L</strong> estimated for ${model}.`;
}

// 3. Core Calculations
function calculateTrip() {
    const dist = parseFloat(document.getElementById('distance').value);
    const time = parseFloat(document.getElementById('time').value);
    const price = parseFloat(document.getElementById('price').value) || 0;

    if (dist > 0 && time > 0) {
        const speed = dist / time;
        const fuel = (dist / vehicleKmpl).toFixed(2);
        const cost = (fuel * price).toFixed(2);

        document.getElementById('fuelNeeded').innerText = fuel;
        document.getElementById('speedRes').innerText = speed.toFixed(1);
        document.getElementById('costRes').innerText = cost;
        document.getElementById('results').style.display = 'block';

        updateEfficiencyMeter(speed);
        saveTrip(dist, speed.toFixed(1), cost, fuel);
    } else {
        alert("Please tap points on the map or enter distance manually.");
    }
}

function updateEfficiencyMeter(speed) {
    const bar = document.getElementById('meterBar');
    const tip = document.getElementById('efficiencyTip');
    let score = 0;

    if (speed >= 60 && speed <= 90) {
        score = 100;
        bar.style.backgroundColor = "#28a745";
        tip.innerText = "Efficiency Peak: 60-90 km/h is your car's sweet spot.";
    } else if (speed > 90) {
        score = Math.max(20, 100 - (speed - 90) * 1.8);
        bar.style.backgroundColor = "#ffc107";
        tip.innerText = "High air drag at high speeds is increasing fuel consumption.";
    } else {
        score = (speed / 60) * 100;
        bar.style.backgroundColor = "#17a2b8";
        tip.innerText = "Stop-start driving is less efficient than cruising.";
    }
    bar.style.width = score + "%";
}

// 4. Persistence & UI
function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    document.getElementById('themeToggle').innerText = next === 'light' ? '🌙' : '☀️';
    localStorage.setItem('tp-theme', next);
}

function updateCurrency() {
    selectedCurrency = document.getElementById('currency').value;
    document.getElementById('currSymbol').innerText = selectedCurrency;
    document.getElementById('resSymbol').innerText = selectedCurrency;
}

function saveTrip(dist, speed, cost, fuel) {
    let history = JSON.parse(localStorage.getItem('tp-history')) || [];
    history.unshift({ dist, speed, cost, fuel, curr: selectedCurrency, date: new Date().toLocaleDateString() });
    localStorage.setItem('tp-history', JSON.stringify(history.slice(0, 5)));
    loadHistory();
}

function loadHistory() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('tp-history')) || [];
    list.innerHTML = history.map(h => `
        <div class="history-item">
            <span><strong>${h.dist}km</strong> @ ${h.speed}km/h</span>
            <span>${h.fuel}L | ${h.curr}${h.cost}</span>
        </div>
    `).join('');
}

function exportToCSV() {
    const history = JSON.parse(localStorage.getItem('tp-history')) || [];
    if (!history.length) return;
    const csv = "Date,Distance,Speed,Fuel,Cost\n" + history.map(h => `${h.date},${h.dist},${h.speed},${h.fuel},${h.cost}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trip_history.csv'; a.click();
}

window.onload = () => {
    initMap();
    loadHistory();
    const saved = localStorage.getItem('tp-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        document.getElementById('themeToggle').innerText = saved === 'light' ? '🌙' : '☀️';
    }
};
