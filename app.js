const FIELDS = [
  ['cleaning', 'Limpieza', '✦'],
  ['furniture', 'Mobiliario', '▤'],
  ['installations', 'Instalaciones', '⚙'],
  ['supplies', 'Enseres', '□'],
  ['climate', 'Clima', '❉'],
  ['security', 'Seguridad', '◆'],
  ['painting', 'Pintura', '▰']
];
const STATUS = {
  pending: { label: 'Sin empezar', className: 'pending', color: 'red' },
  process: { label: 'En proceso', className: 'in-process', color: 'yellow' },
  done: { label: 'Terminado', className: 'done', color: 'green' },
  rented: { label: 'Alquilado', className: 'rented', color: 'blue' }
};
const BUILDINGS = { building1: 'Newton', building2: 'Olimpo' };
const STORAGE_KEY = 'manoli-viviendas-v1';
const DIARY_DB = 'manoli-diario-v1';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function freshApartment(number) {
  return { number, notes: '', statuses: Object.fromEntries(FIELDS.map(([key]) => [key, 'pending'])) };
}
function defaultData() {
  return {
    building1: Array.from({ length: 51 }, (_, i) => freshApartment(i + 1)),
    building2: Array.from({ length: 51 }, (_, i) => freshApartment(i + 1))
  };
}
function normalizeData(saved) {
  const normalized = saved && typeof saved === 'object' ? saved : defaultData();
  Object.keys(BUILDINGS).forEach(building => {
    if (!Array.isArray(normalized[building])) normalized[building] = [];
    normalized[building].forEach((apartment, index) => {
      apartment.number = Number(apartment.number) || index + 1;
      apartment.notes = apartment.notes || '';
      apartment.statuses = apartment.statuses || {};
      FIELDS.forEach(([field]) => {
        if (!STATUS[apartment.statuses[field]]) apartment.statuses[field] = 'pending';
      });
    });
    const numbers = new Set(normalized[building].map(apartment => Number(apartment.number)));
    for (let number = 1; number <= 51; number += 1) {
      if (!numbers.has(number)) normalized[building].push(freshApartment(number));
    }
    normalized[building].sort((a, b) => Number(a.number) - Number(b.number));
  });
  return normalized;
}
function loadData() {
  try { return normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { return defaultData(); }
}

let data = loadData();
let currentBuilding = 'building1';
let currentApartment = 0;
let toastTimer;
let deferredInstallPrompt = null;
let monthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDateKey = '';
let currentPhoto = '';

const $ = selector => document.querySelector(selector);
const views = [...document.querySelectorAll('.view')];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
function save(showToast = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (showToast) showToastMessage('Cambio guardado');
}
function showToastMessage(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}
function showView(id) {
  views.forEach(view => view.classList.toggle('active', view.id === id));
  window.scrollTo({ top: document.querySelector('.hero').offsetHeight - 28, behavior: 'smooth' });
}
function percent(apartment) {
  const values = Object.values(apartment.statuses);
  return Math.round((values.reduce((sum, value) => sum + (value === 'done' || value === 'rented' ? 1 : value === 'process' ? .5 : 0), 0) / values.length) * 100);
}
function overallLabel(apartment) {
  const values = Object.values(apartment.statuses);
  if (values.every(value => value === 'rented')) return 'rented';
  if (values.every(value => value === 'done' || value === 'rented')) return 'done';
  if (values.some(value => value !== 'pending')) return 'process';
  return 'pending';
}
function buildingPercent(key) {
  const apartments = data[key];
  return apartments.length ? Math.round(apartments.reduce((sum, apt) => sum + percent(apt), 0) / apartments.length) : 0;
}

function renderHome() {
  $('#summaryCards').innerHTML = Object.entries(BUILDINGS).map(([key, name]) => {
    const ready = data[key].filter(apt => ['done', 'rented'].includes(overallLabel(apt))).length;
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
  const apartment = data[currentBuilding][currentApartment];
  renderTabs();
  $('#apartmentTitle').textContent = `Piso ${apartment.number}`;
  const state = overallLabel(apartment);
  const badge = $('#apartmentBadge');
  badge.textContent = STATUS[state].label;
  badge.className = `status-badge ${STATUS[state].className}`;
  $('#statusFields').innerHTML = FIELDS.map(([key, label, icon]) => {
    const value = apartment.statuses[key];
    return `<div class="field"><label for="${key}"><span>${label}</span><i class="field-icon">${icon}</i></label><select class="status-select ${STATUS[value].className}" id="${key}" data-field="${key}"><option value="pending" ${value === 'pending' ? 'selected' : ''}>🔴 Sin empezar</option><option value="process" ${value === 'process' ? 'selected' : ''}>🟡 En proceso</option><option value="done" ${value === 'done' ? 'selected' : ''}>🟢 Terminado</option><option value="rented" ${value === 'rented' ? 'selected' : ''}>🔵 Alquilado</option></select></div>`;
  }).join('');
  $('#apartmentNotes').value = apartment.notes || '';
  const progress = buildingPercent(currentBuilding);
  $('#buildingProgress').style.background = `conic-gradient(var(--green) ${progress}%, #d9dedb 0)`;
  $('#buildingProgress strong').textContent = `${progress}%`;
  requestAnimationFrame(() => document.querySelector('.tab.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
}
function renderOverview() {
  const filter = $('#overviewBuilding').value;
  const keys = filter === 'all' ? Object.keys(BUILDINGS) : [filter];
  $('#overviewBody').innerHTML = keys.flatMap(key => data[key].map((apt, index) => {
    const progress = percent(apt);
    const cells = FIELDS.map(([field, label]) => `<td class="state-cell" title="${label}: ${STATUS[apt.statuses[field]].label}"><i class="${STATUS[apt.statuses[field]].color}"></i></td>`).join('');
    return `<tr data-building="${key}" data-apartment="${index}"><td>${BUILDINGS[key]}</td><td>P${apt.number}</td>${cells}<td><div class="mini-progress"><span>${progress}%</span><i style="--progress:${progress}%"></i></div></td></tr>`;
  })).join('');
}

function openDiaryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIARY_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('entries')) request.result.createObjectStore('entries', { keyPath: 'date' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function diaryOperation(mode, operation) {
  const database = await openDiaryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('entries', mode);
    const store = transaction.objectStore('entries');
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}
const getDiaryEntry = date => diaryOperation('readonly', store => store.get(date));
const putDiaryEntry = entry => diaryOperation('readwrite', store => store.put(entry));
async function getMonthEntries(date) {
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const entries = await diaryOperation('readonly', store => store.getAll());
  return entries.filter(entry => entry.date.startsWith(prefix));
}
function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function prettyDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
}
function daysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
function monthTitle(date) { return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`; }

async function renderCalendar() {
  $('#calendarMonth').textContent = monthTitle(monthCursor);
  const entries = await getMonthEntries(monthCursor);
  const entryMap = new Map(entries.map(entry => [entry.date, entry]));
  const firstWeekday = (new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1).getDay() + 6) % 7;
  const today = new Date();
  const cells = Array.from({ length: firstWeekday }, () => '<span class="calendar-day empty"></span>');
  for (let day = 1; day <= daysInMonth(monthCursor); day += 1) {
    const key = dateKey(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    const entry = entryMap.get(key);
    const isToday = today.getFullYear() === monthCursor.getFullYear() && today.getMonth() === monthCursor.getMonth() && today.getDate() === day;
    cells.push(`<button class="calendar-day ${isToday ? 'today' : ''} ${entry ? 'has-entry' : ''} ${entry?.photo ? 'has-photo' : ''}" data-date="${key}" type="button"><span>${day}</span></button>`);
  }
  $('#calendarGrid').innerHTML = cells.join('');
}
async function openCalendar() {
  await renderCalendar();
  showView('calendarView');
}
async function openDay(key) {
  selectedDateKey = key;
  const [year, month] = key.split('-').map(Number);
  monthCursor = new Date(year, month - 1, 1);
  const entry = await getDiaryEntry(key) || { date: key, tag: '', memo: '', photo: '' };
  currentPhoto = entry.photo || '';
  $('#dayTitle').textContent = prettyDate(key);
  $('#dayTag').value = entry.tag || '';
  $('#dayMemo').value = entry.memo || '';
  $('#tagCounter').textContent = `${$('#dayTag').value.length}/60`;
  renderPhotoPreview();
  showView('dayView');
}
function renderPhotoPreview() {
  $('#photoPreview').innerHTML = currentPhoto ? `<img src="${currentPhoto}" alt="Fotografía del día">` : '<span>Sin fotografía</span>';
  $('#removePhoto').hidden = !currentPhoto;
}
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSize = 1600;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', .82));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo leer la fotografía')); };
    image.src = objectUrl;
  });
}
async function handlePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    currentPhoto = await resizePhoto(file);
    renderPhotoPreview();
    showToastMessage('Fotografía preparada');
  } catch { alert('No se ha podido cargar esta fotografía. Prueba con otra imagen.'); }
  event.target.value = '';
}
async function saveDayEntry() {
  await putDiaryEntry({ date: selectedDateKey, tag: $('#dayTag').value.trim(), memo: $('#dayMemo').value.trim(), photo: currentPhoto, updatedAt: Date.now() });
  showToastMessage('Ficha diaria guardada');
  await renderCalendar();
}
async function renderJournalList() {
  $('#listMonth').textContent = monthTitle(monthCursor);
  const entries = await getMonthEntries(monthCursor);
  const entryMap = new Map(entries.map(entry => [entry.date, entry]));
  const rows = [];
  for (let day = 1; day <= daysInMonth(monthCursor); day += 1) {
    const key = dateKey(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    const entry = entryMap.get(key);
    const preview = entry?.memo ? `${entry.memo.slice(0, 130)}${entry.memo.length > 130 ? '…' : ''}` : 'Sin memoria';
    rows.push(`<tr data-date="${key}"><td>${day} ${MONTHS[monthCursor.getMonth()]}</td><td><div class="journal-photo">${entry?.photo ? `<img src="${entry.photo}" alt="Foto del día ${day}">` : 'Sin foto'}</div></td><td><div class="journal-description"><strong>${escapeHtml(entry?.tag || 'Sin etiqueta')}</strong><span>${escapeHtml(preview)}</span></div></td></tr>`);
  }
  $('#journalListBody').innerHTML = rows.join('');
}
async function openJournalList() {
  await renderJournalList();
  showView('journalListView');
}

$('#buildingSelect').addEventListener('change', event => {
  if (event.target.value) { openBuilding(event.target.value); event.target.value = ''; }
});
$('#overviewBtn').addEventListener('click', () => { $('#overviewBuilding').value = 'all'; renderOverview(); showView('overviewView'); });
$('#showBuildingOverview').addEventListener('click', () => { $('#overviewBuilding').value = currentBuilding; renderOverview(); showView('overviewView'); });
$('#calendarBtn').addEventListener('click', openCalendar);
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
$('#apartmentNotes').addEventListener('input', event => { data[currentBuilding][currentApartment].notes = event.target.value; save(false); });
$('#apartmentNotes').addEventListener('change', () => save());
$('#addApartment').addEventListener('click', () => {
  const apartments = data[currentBuilding];
  const nextNumber = Math.max(...apartments.map(apt => Number(apt.number) || 0)) + 1;
  apartments.push(freshApartment(nextNumber));
  currentApartment = apartments.length - 1;
  save();
  renderBuilding();
});
$('#removeApartment').addEventListener('click', () => {
  const apartments = data[currentBuilding];
  if (apartments.length <= 51) return alert('Deben mantenerse al menos los 51 pisos del edificio.');
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

$('#previousMonth').addEventListener('click', async () => { monthCursor.setMonth(monthCursor.getMonth() - 1); await renderCalendar(); });
$('#nextMonth').addEventListener('click', async () => { monthCursor.setMonth(monthCursor.getMonth() + 1); await renderCalendar(); });
$('#calendarGrid').addEventListener('click', event => { const day = event.target.closest('[data-date]'); if (day) openDay(day.dataset.date); });
$('#monthlyListBtn').addEventListener('click', openJournalList);
$('#backToCalendar').addEventListener('click', openCalendar);
$('#backToCalendarFromList').addEventListener('click', openCalendar);
$('#listPreviousMonth').addEventListener('click', async () => { monthCursor.setMonth(monthCursor.getMonth() - 1); await renderJournalList(); });
$('#listNextMonth').addEventListener('click', async () => { monthCursor.setMonth(monthCursor.getMonth() + 1); await renderJournalList(); });
$('#journalListBody').addEventListener('click', event => { const row = event.target.closest('[data-date]'); if (row) openDay(row.dataset.date); });
$('#cameraInput').addEventListener('change', handlePhoto);
$('#galleryInput').addEventListener('change', handlePhoto);
$('#removePhoto').addEventListener('click', () => { currentPhoto = ''; renderPhotoPreview(); });
$('#dayTag').addEventListener('input', event => { $('#tagCounter').textContent = `${event.target.value.length}/60`; });
$('#saveDay').addEventListener('click', saveDayEntry);

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
  if (isIos) { installHelp.hidden = false; return; }
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
window.addEventListener('appinstalled', () => { installBtn.hidden = true; deferredInstallPrompt = null; });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    registration.update();
  });
}

save(false);
renderHome();
