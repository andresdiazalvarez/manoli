const FIELDS = [
  ['cleaning', 'Limpieza', '✦'],
  ['furniture', 'Mobiliario', '▤'],
  ['installations', 'Instalaciones', '⚙'],
  ['supplies', 'Enseres', '□'],
  ['climate', 'Clima', '❉'],
  ['security', 'Seguridad', '◆']
];
const STATUS = {
  pending: { label: 'Sin empezar', className: 'pending', color: 'red' },
  process: { label: 'En proceso', className: 'in-process', color: 'yellow' },
  done: { label: 'Terminado', className: 'done', color: 'green' }
};
const BUILDINGS = { building1: 'Edificio 1', building2: 'Edificio 2' };
const STORAGE_KEY = 'manoli-viviendas-v1';

function freshApartment(number) {
  return { number, notes: '', statuses: Object.fromEntries(FIELDS.map(([key]) => [key, 'pending'])) };
}
function defaultData() {
  return { building1: Array.from({length: 12}, (_, i) => freshApartment(i + 1)), building2: Array.from({length: 12}, (_, i) => freshApartment(i + 1)) };
}
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData(); }
  catch { return defaultData(); }
}

let data = loadData();
let currentBuilding = 'building1';
let currentApartment = 0;
let toastTimer;
let deferredInstallPrompt = null;

const $ = (selector) => document.querySelector(selector);
const views = [...document.querySelectorAll('.view')];

function save(showToast = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (showToast) {
    const toast = $('#toast');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
  }
}
function showView(id) {
  views.forEach(view => view.classList.toggle('active', view.id === id));
  window.scrollTo({ top: document.querySelector('.hero').offsetHeight - 28, behavior: 'smooth' });
}
function percent(apartment) {
  const values = Object.values(apartment.statuses);
  return Math.round((values.reduce((sum, value) => sum + (value === 'done' ? 1 : value === 'process' ? .5 : 0), 0) / values.length) * 100);
}
function overallLabel(apartment) {
  const values = Object.values(apartment.statuses);
  if (values.every(value => value === 'done')) return 'done';
  if (values.some(value => value !== 'pending')) return 'process';
  return 'pending';
}
function buildingPercent(key) {
  const apartments = data[key];
  return apartments.length ? Math.round(apartments.reduce((sum, apt) => sum + percent(apt), 0) / apartments.length) : 0;
}

function renderHome() {
  $('#summaryCards').innerHTML = Object.entries(BUILDINGS).map(([key, name]) => {
    const ready = data[key].filter(apt => overallLabel(apt) === 'done').length;
    return `<article class="summary-card"><div><h3>${name}</h3><p>${ready} de ${data[key].length} pisos listos</p></div><strong>${buildingPercent(key)}%</strong></article>`;
  }).join('');
}
function openBuilding(key, apartmentIndex = 0) {
  currentBuilding = key;
  currentApartment = Math.min(apartmentIndex, Math.max(0, data[key].length - 1));
  $('#buildingTitle').textContent = BUILDINGS[key];
  renderBuilding();
  showView('buildingView');
}
function renderTabs() {
  $('#apartmentTabs').innerHTML = data[currentBuilding].map((apt, index) => `<button class="tab ${index === currentApartment ? 'active' : ''}" role="tab" aria-selected="${index === currentApartment}" data-apartment="${index}">Piso ${apt.number}</button>`).join('');
}
function renderBuilding() {
  const apartments = data[currentBuilding];
  if (!apartments.length) {
    apartments.push(freshApartment(1));
    currentApartment = 0;
  }
  const apartment = apartments[currentApartment];
  renderTabs();
  $('#apartmentTitle').textContent = `Piso ${apartment.number}`;
  const state = overallLabel(apartment);
  const badge = $('#apartmentBadge');
  badge.textContent = STATUS[state].label;
  badge.className = `status-badge ${STATUS[state].className}`;
  $('#statusFields').innerHTML = FIELDS.map(([key, label, icon]) => {
    const value = apartment.statuses[key];
    return `<div class="field"><label for="${key}"><span>${label}</span><i class="field-icon">${icon}</i></label><select class="status-select ${STATUS[value].className}" id="${key}" data-field="${key}"><option value="pending" ${value === 'pending' ? 'selected' : ''}>🔴 Sin empezar</option><option value="process" ${value === 'process' ? 'selected' : ''}>🟡 En proceso</option><option value="done" ${value === 'done' ? 'selected' : ''}>🟢 Terminado</option></select></div>`;
  }).join('');
  $('#apartmentNotes').value = apartment.notes || '';
  const progress = buildingPercent(currentBuilding);
  $('#buildingProgress').style.background = `conic-gradient(var(--green) ${progress}%, #d9dedb 0)`;
  $('#buildingProgress strong').textContent = `${progress}%`;
}
function renderOverview() {
  const filter = $('#overviewBuilding').value;
  const keys = filter === 'all' ? Object.keys(BUILDINGS) : [filter];
  $('#overviewBody').innerHTML = keys.flatMap(key => data[key].map((apt, index) => {
    const progress = percent(apt);
    const cells = FIELDS.map(([field, label]) => `<td class="state-cell" title="${label}: ${STATUS[apt.statuses[field]].label}"><i class="${STATUS[apt.statuses[field]].color}"></i></td>`).join('');
    return `<tr data-building="${key}" data-apartment="${index}"><td>${BUILDINGS[key].replace('Edificio ', 'E')}</td><td>P${apt.number}</td>${cells}<td><div class="mini-progress"><span>${progress}%</span><i style="--progress:${progress}%"></i></div></td></tr>`;
  })).join('');
}

$('#buildingSelect').addEventListener('change', event => {
  if (event.target.value) {
    openBuilding(event.target.value);
    event.target.value = '';
  }
});
$('#overviewBtn').addEventListener('click', () => { $('#overviewBuilding').value = 'all'; renderOverview(); showView('overviewView'); });
$('#showBuildingOverview').addEventListener('click', () => { $('#overviewBuilding').value = currentBuilding; renderOverview(); showView('overviewView'); });
document.querySelectorAll('[data-go-home]').forEach(button => button.addEventListener('click', () => { renderHome(); showView('homeView'); }));
$('#apartmentTabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-apartment]');
  if (!tab) return;
  currentApartment = Number(tab.dataset.apartment);
  renderBuilding();
});
$('#statusFields').addEventListener('change', event => {
  if (!event.target.dataset.field) return;
  data[currentBuilding][currentApartment].statuses[event.target.dataset.field] = event.target.value;
  save();
  renderBuilding();
});
$('#apartmentNotes').addEventListener('input', event => {
  data[currentBuilding][currentApartment].notes = event.target.value;
  save(false);
});
$('#apartmentNotes').addEventListener('change', () => save());
$('#addApartment').addEventListener('click', () => {
  const apartments = data[currentBuilding];
  const nextNumber = apartments.length ? Math.max(...apartments.map(apt => Number(apt.number) || 0)) + 1 : 1;
  apartments.push(freshApartment(nextNumber));
  currentApartment = apartments.length - 1;
  save();
  renderBuilding();
});
$('#removeApartment').addEventListener('click', () => {
  const apartments = data[currentBuilding];
  if (apartments.length <= 1) return alert('Debe quedar al menos un piso en el edificio.');
  if (!confirm(`¿Eliminar el Piso ${apartments[currentApartment].number}?`)) return;
  apartments.splice(currentApartment, 1);
  currentApartment = Math.max(0, currentApartment - 1);
  save();
  renderBuilding();
});
$('#overviewBuilding').addEventListener('change', renderOverview);
$('#overviewBody').addEventListener('click', event => {
  const row = event.target.closest('tr[data-building]');
  if (row) openBuilding(row.dataset.building, Number(row.dataset.apartment));
});

const installBtn = $('#installBtn');
const installHelp = $('#iosInstallHelp');
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.hidden = false;
});

if (isIos && !isStandalone) installBtn.hidden = false;

installBtn.addEventListener('click', async () => {
  if (isIos) {
    installHelp.hidden = false;
    return;
  }
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

function closeInstallHelp() { installHelp.hidden = true; }
$('#closeInstallHelp').addEventListener('click', closeInstallHelp);
$('#understoodInstall').addEventListener('click', closeInstallHelp);
installHelp.addEventListener('click', event => { if (event.target === installHelp) closeInstallHelp(); });

window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  deferredInstallPrompt = null;
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}

renderHome();
