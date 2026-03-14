let map, markers = [], vehicleKmpl = 15, selectedCurrency = "$";

function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    map.locate({setView: true, maxZoom: 12});

    map.on('click', (e) => {
        if (markers.length >= 2) { markers.forEach(m => map.removeLayer(m)); markers = []; }
        markers.push(L.marker(e.latlng).addTo(map));
        if (markers.length === 2) {
            const d = (markers[0].getLatLng().distanceTo(markers[1].getLatLng()) / 1000).toFixed(2);
            document.getElementById('distance').value = d;
        }
    });
}

function fetchVehicleData() {
    const model = document.getElementById('carSearch').value.toLowerCase();
    let kmpl = 14.0;
    if (model.includes("tesla") || model.includes("ev")) kmpl = 45.0;
    else if (model.includes("civic") || model.includes("corolla")) kmpl = 17.5;
    else if (model.includes("truck")) kmpl = 8.5;
    vehicleKmpl = kmpl;
    document.getElementById('carInfo').innerHTML = `✅ Found: <strong>${kmpl} km/L</strong>`;
}

function calculateTrip() {
    const d = parseFloat(document.getElementById('distance').value);
    const t = parseFloat(document.getElementById('time').value);
    const p = parseFloat(document.getElementById('price').value) || 0;

    if (d > 0 && t > 0) {
        const speed = d / t;
        const fuel = (d / vehicleKmpl).toFixed(2);
        const cost = (fuel * p).toFixed(2);

        document.getElementById('fuelNeeded').innerText = fuel;
        document.getElementById('costRes').innerText = cost;
        document.getElementById('speedRes').innerText = speed.toFixed(1);
        document.getElementById('results').style.display = 'block';

        updateEfficiency(speed);
        saveTrip(d, speed.toFixed(1), cost, fuel);
    }
}

function updateEfficiency(s) {
    const bar = document.getElementById('meterBar');
    const tip = document.getElementById('efficiencyTip');
    let score = s >= 60 && s <= 90 ? 100 : (s > 90 ? Math.max(20, 100 - (s-90)*2) : (s/60)*100);
    bar.style.width = score + "%";
    tip.innerText = s > 90 ? "High air drag reduces efficiency." : (s < 60 ? "Low gears/idling reduces efficiency." : "Optimal speed!");
}

function saveTrip(dist, speed, cost, fuel) {
    let h = JSON.parse(localStorage.getItem('trips')) || [];
    h.unshift({ dist, speed, cost, fuel, cur: selectedCurrency, date: new Date().toLocaleDateString() });
    localStorage.setItem('trips', JSON.stringify(h.slice(0, 5)));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const h = JSON.parse(localStorage.getItem('trips')) || [];
    list.innerHTML = h.map(i => `<div class="history-item">${i.date}: ${i.dist}km | ${i.fuel}L | ${i.cur}${i.cost}</div>`).join('');
}

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').innerText = theme === 'light' ? '🌙' : '☀️';
}

function updateCurrency() {
    selectedCurrency = document.getElementById('currency').value;
    document.getElementById('currSymbol').innerText = selectedCurrency;
    document.getElementById('resSymbol').innerText = selectedCurrency;
}

function exportToCSV() {
    const h = JSON.parse(localStorage.getItem('trips')) || [];
    let csv = "Date,Dist,Fuel,Cost\n" + h.map(i => `${i.date},${i.dist},${i.fuel},${i.cost}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'trips.csv'; a.click();
}

window.onload = () => { initMap(); renderHistory(); };
