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
const DOTATION_ITEMS = [
  'Aparador',
  'Cortinas del salón',
  'Cortinas del dormitorio',
  'Sillón',
  'Sillas',
  'Mesa',
  'Mesa pequeña',
  'Jarrón',
  'Flores',
  'Cuadro grande',
  'Cuadros de cocina',
  'Mesitas de dormitorio',
  'Lamparitas',
  'Lámparas de pie',
  'Espejo de baño',
  'Espejo de dormitorio',
  'Armario',
  'Cama',
  'Colchón',
  'Funda',
  'Sábanas',
  'Colcha',
  'Cojines',
  'Frigorífico',
  'Lavadora',
  'Microondas',
  'Platero',
  'Sartén',
  'Vajilla',
  'Vasos',
  'Olla',
  'Escurridor',
  'Tabla de cortar',
  'Tijeras de cocina',
  'Pala de madera',
  'Cuchillo',
  'Cubiertos',
  'Aire acondicionado',
  'Bombillas',
  'Cepillo',
  'Recogedor',
  'Cubo de basura',
  'Tendedero',
  'Cesto de ropa',
  'Mueble',
  'Estropajo',
  'Paño de cocina',
  'Televisión',
  'Cable de antena',
  'Mandos de aire acondicionado y televisión'
].map((label, index) => ({ key: `item${index + 1}`, label }));
const NEWTON_COLOR_GROUPS = [
  { className: 'newton-light-green', floors: [1, 2, 3, 4, 5] },
  { className: 'newton-blue', floors: [6, 7, 8, 9, 10] },
  { className: 'newton-yellow', floors: [11, 12, 13, 14, 15] },
  { className: 'newton-red', floors: [16, 17, 18, 19, 20, 21, 22, 23] },
  { className: 'newton-beige', floors: [24, 25, 26, 27, 28] },
  { className: 'newton-medium-gray', floors: [29, 30, 31, 32, 33, 34, 35] },
  { className: 'newton-dark-blue', floors: [36, 37, 38, 39, 40] },
  { className: 'newton-medium-green', floors: [41, 42, 43, 44, 45, 46, 47] },
  { className: 'newton-brown', floors: [48, 49] },
  { className: 'newton-dark-red', floors: [50, 51] }
];
const STORAGE_KEY = 'manoli-viviendas-v1';
const DOTATION_STORAGE_KEY = 'lachar-dotacion-v1';
const DIARY_DB = 'manoli-diario-v1';
const DIARY_DB_VERSION = 3;
const APARTMENT_PHOTO_SLOTS = 4;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function freshApartment(number) {
  return { number, notes: '', statuses: Object.fromEntries(FIELDS.map(([key]) => [key, 'pending'])) };
}
function freshDotationApartment(number) {
  return { number, items: Object.fromEntries(DOTATION_ITEMS.map(item => [item.key, { installed: false, notes: '' }])) };
}
function defaultData() {
  return {
    building1: Array.from({ length: 51 }, (_, i) => freshApartment(i + 1)),
    building2: Array.from({ length: 51 }, (_, i) => freshApartment(i + 1))
  };
}
function defaultDotationData() {
  return {
    building1: Array.from({ length: 51 }, (_, i) => freshDotationApartment(i + 1)),
    building2: Array.from({ length: 51 }, (_, i) => freshDotationApartment(i + 1))
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
function normalizeDotationData(saved) {
  const normalized = saved && typeof saved === 'object' ? saved : defaultDotationData();
  Object.keys(BUILDINGS).forEach(building => {
    if (!Array.isArray(normalized[building])) normalized[building] = [];
    normalized[building].forEach((apartment, index) => {
      apartment.number = Number(apartment.number) || index + 1;
      apartment.items = apartment.items || {};
      DOTATION_ITEMS.forEach(item => {
        if (!apartment.items[item.key] || typeof apartment.items[item.key] !== 'object') apartment.items[item.key] = { installed: false, notes: '' };
        apartment.items[item.key].installed = Boolean(apartment.items[item.key].installed);
        apartment.items[item.key].notes = apartment.items[item.key].notes || '';
      });
    });
    const numbers = new Set(normalized[building].map(apartment => Number(apartment.number)));
    for (let number = 1; number <= 51; number += 1) {
      if (!numbers.has(number)) normalized[building].push(freshDotationApartment(number));
    }
    normalized[building].sort((a, b) => Number(a.number) - Number(b.number));
  });
  return normalized;
}
function loadDotationData() {
  try { return normalizeDotationData(JSON.parse(localStorage.getItem(DOTATION_STORAGE_KEY))); }
  catch { return defaultDotationData(); }
}

let data = loadData();
let dotationData = loadDotationData();
let currentBuilding = 'building1';
let currentApartment = 0;
let currentDotationBuilding = 'building1';
let currentDotationApartment = 0;
let toastTimer;
let deferredInstallPrompt = null;
let monthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDateKey = '';
let currentPhoto = '';
let selectedApartmentPhotoSlot = 0;
let activeArea = 'situation';

const $ = selector => document.querySelector(selector);
const views = [...document.querySelectorAll('.view')];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
function save(showToast = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (showToast) showToastMessage('Cambio guardado');
}
function saveDotation(showToast = true) {
  localStorage.setItem(DOTATION_STORAGE_KEY, JSON.stringify(dotationData));
  if (showToast) showToastMessage('Dotación guardada');
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
function dotationStats(apartment) {
  const installed = DOTATION_ITEMS.filter(item => apartment.items?.[item.key]?.installed).length;
  return { installed, total: DOTATION_ITEMS.length, pending: DOTATION_ITEMS.length - installed, percent: Math.round((installed / DOTATION_ITEMS.length) * 100) };
}
function dotationBuildingPercent(key) {
  const apartments = dotationData[key];
  return apartments.length ? Math.round(apartments.reduce((sum, apt) => sum + dotationStats(apt).percent, 0) / apartments.length) : 0;
}
function newtonColorClass(building, apartmentNumber) {
  if (building !== 'building1') return '';
  return NEWTON_COLOR_GROUPS.find(group => group.floors.includes(Number(apartmentNumber)))?.className || '';
}
function apartmentDisplayName(building, apartmentNumber, short = false) {
  const number = Number(apartmentNumber);
  if (building === 'building1' && (number === 50 || number === 51)) return short ? `A${number}` : `Ático ${number}`;
  return short ? `P${number}` : `Piso ${number}`;
}

function renderHome() {
  $('#summaryCards').innerHTML = Object.entries(BUILDINGS).map(([key, name]) => {
    const ready = data[key].filter(apt => ['done', 'rented'].includes(overallLabel(apt))).length;
    return `<article class="summary-card"><div><h3>${name}</h3><p>${ready} de ${data[key].length} pisos listos</p></div><strong>${buildingPercent(key)}%</strong></article>`;
  }).join('');
}
function renderDotationHome() {
  $('#dotationSummaryCards').innerHTML = Object.entries(BUILDINGS).map(([key, name]) => {
    const complete = dotationData[key].filter(apt => dotationStats(apt).installed === DOTATION_ITEMS.length).length;
    return `<article class="summary-card summary-card--dotation"><div><h3>${name}</h3><p>${complete} de ${dotationData[key].length} pisos con dotación completa</p></div><strong>${dotationBuildingPercent(key)}%</strong></article>`;
  }).join('');
}
function openBuilding(key, apartmentIndex = 0) {
  activeArea = 'situation';
  currentBuilding = key;
  currentApartment = Math.min(apartmentIndex, Math.max(0, data[key].length - 1));
  $('#buildingTitle').textContent = BUILDINGS[key];
  renderBuilding();
  showView('buildingView');
}
function openDotationBuilding(key, apartmentIndex = 0) {
  activeArea = 'dotation';
  currentDotationBuilding = key;
  currentDotationApartment = Math.min(apartmentIndex, Math.max(0, dotationData[key].length - 1));
  $('#dotationBuildingTitle').textContent = BUILDINGS[key];
  renderDotationBuilding();
  showView('dotationBuildingView');
}
function renderTabs() {
  $('#apartmentTabs').innerHTML = data[currentBuilding].map((apt, index) => `<button class="tab ${newtonColorClass(currentBuilding, apt.number)} ${index === currentApartment ? 'active' : ''}" role="tab" aria-selected="${index === currentApartment}" data-apartment="${index}">${apartmentDisplayName(currentBuilding, apt.number)}</button>`).join('');
}
function renderDotationTabs() {
  $('#dotationApartmentTabs').innerHTML = dotationData[currentDotationBuilding].map((apt, index) => `<button class="tab tab--dotation ${newtonColorClass(currentDotationBuilding, apt.number)} ${index === currentDotationApartment ? 'active' : ''}" role="tab" aria-selected="${index === currentDotationApartment}" data-dotation-apartment="${index}">${apartmentDisplayName(currentDotationBuilding, apt.number)}</button>`).join('');
}
function renderBuilding() {
  const apartment = data[currentBuilding][currentApartment];
  renderTabs();
  $('#apartmentTitle').textContent = apartmentDisplayName(currentBuilding, apartment.number);
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
  renderApartmentPhotos();
  requestAnimationFrame(() => document.querySelector('.tab.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
}
function renderOverview() {
  const filter = $('#overviewBuilding').value;
  const keys = filter === 'all' ? Object.keys(BUILDINGS) : [filter];
  $('#overviewBody').innerHTML = keys.flatMap(key => data[key].map((apt, index) => {
    const progress = percent(apt);
    const cells = FIELDS.map(([field, label]) => `<td class="state-cell" title="${label}: ${STATUS[apt.statuses[field]].label}"><i class="${STATUS[apt.statuses[field]].color}"></i></td>`).join('');
    return `<tr class="${newtonColorClass(key, apt.number)}" data-building="${key}" data-apartment="${index}"><td>${BUILDINGS[key]}</td><td>${apartmentDisplayName(key, apt.number, true)}</td>${cells}<td><div class="mini-progress"><span>${progress}%</span><i style="--progress:${progress}%"></i></div></td></tr>`;
  })).join('');
}
function renderDotationBuilding() {
  const apartment = dotationData[currentDotationBuilding][currentDotationApartment];
  renderDotationTabs();
  $('#dotationApartmentTitle').textContent = apartmentDisplayName(currentDotationBuilding, apartment.number);
  const stats = dotationStats(apartment);
  $('#dotationBadge').textContent = `${stats.installed} de ${stats.total} instalados`;
  const progress = dotationBuildingPercent(currentDotationBuilding);
  $('#dotationProgress').style.background = `conic-gradient(#8b2cff ${progress}%, #eadcff 0)`;
  $('#dotationProgress strong').textContent = `${progress}%`;
  $('#dotationItemsBody').innerHTML = DOTATION_ITEMS.map(item => {
    const value = apartment.items[item.key];
    return `<tr data-dotation-item="${item.key}">
      <td class="dotation-name">${escapeHtml(item.label)}</td>
      <td><button class="dotation-check ${value.installed ? 'yes' : 'no'}" type="button" data-dotation-toggle="${item.key}">${value.installed ? 'Sí' : 'No'}</button></td>
      <td><textarea class="dotation-note" rows="2" data-dotation-note="${item.key}" placeholder="Observaciones…">${escapeHtml(value.notes)}</textarea></td>
    </tr>`;
  }).join('');
  requestAnimationFrame(() => document.querySelector('#dotationApartmentTabs .tab.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
}
function renderDotationOverview() {
  const filter = $('#dotationOverviewBuilding').value;
  const keys = filter === 'all' ? Object.keys(BUILDINGS) : [filter];
  $('#dotationOverviewBody').innerHTML = keys.flatMap(key => dotationData[key].map((apt, index) => {
    const stats = dotationStats(apt);
    return `<tr class="${newtonColorClass(key, apt.number)}" data-dotation-building="${key}" data-dotation-apartment="${index}"><td>${BUILDINGS[key]}</td><td>${apartmentDisplayName(key, apt.number, true)}</td><td>${stats.installed}</td><td>${stats.pending}</td><td><div class="mini-progress mini-progress--dotation"><span>${stats.percent}%</span><i style="--progress:${stats.percent}%"></i></div></td></tr>`;
  })).join('');
}

function openDiaryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIARY_DB, DIARY_DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('entries')) request.result.createObjectStore('entries', { keyPath: 'date' });
      if (!request.result.objectStoreNames.contains('apartmentPhotos')) request.result.createObjectStore('apartmentPhotos', { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains('savedProjects')) request.result.createObjectStore('savedProjects', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function diaryOperation(mode, operation, storeName = 'entries') {
  const database = await openDiaryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}
const getDiaryEntry = date => diaryOperation('readonly', store => store.get(date));
const putDiaryEntry = entry => diaryOperation('readwrite', store => store.put(entry));
const apartmentPhotoId = (building, apartmentNumber, slot) => `${building}-${apartmentNumber}-${slot}`;
const getApartmentPhoto = (building, apartmentNumber, slot) => diaryOperation('readonly', store => store.get(apartmentPhotoId(building, apartmentNumber, slot)), 'apartmentPhotos');
const putApartmentPhoto = photo => diaryOperation('readwrite', store => store.put(photo), 'apartmentPhotos');
const deleteApartmentPhoto = (building, apartmentNumber, slot) => diaryOperation('readwrite', store => store.delete(apartmentPhotoId(building, apartmentNumber, slot)), 'apartmentPhotos');
const getAllFromStore = storeName => diaryOperation('readonly', store => store.getAll(), storeName);
const putSavedProject = project => diaryOperation('readwrite', store => store.put(project), 'savedProjects');
async function replaceStore(storeName, records = []) {
  const database = await openDiaryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
    records.forEach(record => store.put(record));
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}
async function getMonthEntries(date) {
  const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const entries = await diaryOperation('readonly', store => store.getAll());
  return entries.filter(entry => entry.date.startsWith(prefix));
}
async function renderApartmentPhotos() {
  const building = currentBuilding;
  const apartment = data[currentBuilding][currentApartment];
  if (!apartment) return;
  const apartmentNumber = apartment.number;
  const photos = await Promise.all(Array.from({ length: APARTMENT_PHOTO_SLOTS }, (_, slot) => getApartmentPhoto(building, apartmentNumber, slot)));
  if (building !== currentBuilding || data[currentBuilding][currentApartment]?.number !== apartmentNumber) return;
  $('#apartmentPhotosGrid').innerHTML = photos.map((photo, slot) => `
    <div class="apartment-photo-slot ${photo?.photo ? 'has-photo' : ''}" data-photo-slot="${slot}">
      <button class="apartment-photo-preview" data-photo-action="${photo?.photo ? 'view' : 'load'}" type="button">
        ${photo?.photo ? `<img src="${photo.photo}" alt="Imagen ${slot + 1} del piso ${apartmentNumber}">` : `<span>Imagen ${slot + 1}</span>`}
      </button>
      <div class="apartment-photo-actions">
        <button type="button" data-photo-action="load">${photo?.photo ? 'Cambiar' : 'Cargar'}</button>
        <button type="button" data-photo-action="delete" ${photo?.photo ? '' : 'disabled'}>Eliminar</button>
      </div>
    </div>
  `).join('');
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
function populateApartmentSelect(select, includeAll = false, building = 'building1') {
  const options = includeAll ? '<option value="all">Todos los pisos</option>' : '';
  select.innerHTML = options + data[building].map(apartment => `<option value="${apartment.number}">${apartmentDisplayName(building, apartment.number)}</option>`).join('');
}

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
  const entry = await getDiaryEntry(key) || { date: key, tag: '', memo: '', photo: '', building: 'building1', apartmentNumber: 1 };
  currentPhoto = entry.photo || '';
  $('#dayTitle').textContent = prettyDate(key);
  $('#dayBuilding').value = entry.building || 'building1';
  populateApartmentSelect($('#dayApartment'), false, $('#dayBuilding').value);
  $('#dayApartment').value = String(entry.apartmentNumber || 1);
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
  await putDiaryEntry({ date: selectedDateKey, building: $('#dayBuilding').value, apartmentNumber: Number($('#dayApartment').value), tag: $('#dayTag').value.trim(), memo: $('#dayMemo').value.trim(), photo: currentPhoto, updatedAt: Date.now() });
  showToastMessage('Ficha diaria guardada');
  await renderCalendar();
}
async function renderJournalList() {
  $('#listMonth').textContent = monthTitle(monthCursor);
  const entries = await getMonthEntries(monthCursor);
  const entryMap = new Map(entries.map(entry => [entry.date, entry]));
  const buildingFilter = $('#journalBuildingFilter').value;
  const apartmentFilter = $('#journalApartmentFilter').value;
  const filtersActive = buildingFilter !== 'all' || apartmentFilter !== 'all';
  const rows = [];
  for (let day = 1; day <= daysInMonth(monthCursor); day += 1) {
    const key = dateKey(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    const entry = entryMap.get(key);
    const matchesBuilding = buildingFilter === 'all' || entry?.building === buildingFilter;
    const matchesApartment = apartmentFilter === 'all' || String(entry?.apartmentNumber) === apartmentFilter;
    if (filtersActive && (!entry || !matchesBuilding || !matchesApartment)) continue;
    const preview = entry?.memo ? `${entry.memo.slice(0, 130)}${entry.memo.length > 130 ? '…' : ''}` : 'Sin memoria';
    const location = entry?.building ? `${BUILDINGS[entry.building]} · ${apartmentDisplayName(entry.building, entry.apartmentNumber)}` : 'Sin asignar';
    rows.push(`<tr data-date="${key}"><td>${day} ${MONTHS[monthCursor.getMonth()]}</td><td>${escapeHtml(location)}</td><td><div class="journal-photo">${entry?.photo ? `<img src="${entry.photo}" alt="Foto del día ${day}">` : 'Sin foto'}</div></td><td><div class="journal-description"><strong>${escapeHtml(entry?.tag || 'Sin etiqueta')}</strong><span>${escapeHtml(preview)}</span></div></td></tr>`);
  }
  $('#journalListBody').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4">No hay fichas que coincidan con este filtro.</td></tr>';
}
async function openJournalList() {
  await renderJournalList();
  showView('journalListView');
}
async function openDownloadView() {
  await renderSavedProjects();
  showView('downloadView');
}
function openSituationHome() {
  activeArea = 'situation';
  renderHome();
  showView('homeView');
}
function openDotationHome() {
  activeArea = 'dotation';
  renderDotationHome();
  showView('dotationHomeView');
}
function openAreaHome() {
  if (activeArea === 'dotation') openDotationHome();
  else openSituationHome();
}
async function buildProjectBackup() {
  return {
    app: 'Edificios Lachar',
    version: 1,
    exportedAt: new Date().toISOString(),
    storageKey: STORAGE_KEY,
    diaryDatabase: DIARY_DB,
    data,
    dotationData,
    diaryEntries: await getAllFromStore('entries'),
    apartmentPhotos: await getAllFromStore('apartmentPhotos')
  };
}
function savedProjectDate(value) {
  try { return new Date(value).toLocaleString('es-ES'); }
  catch { return 'Fecha no disponible'; }
}
async function renderSavedProjects() {
  const list = $('#savedProjectsList');
  const projects = (await getAllFromStore('savedProjects')).sort((a, b) => Number(a.number) - Number(b.number));
  if (!projects.length) {
    list.innerHTML = '<p class="saved-projects-empty">Todavía no hay ningún proyecto guardado en este móvil.</p>';
    return;
  }
  list.innerHTML = projects.map(project => `
    <div class="saved-project-item" data-saved-project="${escapeHtml(project.id)}">
      <div>
        <strong>Proyecto guardado ${project.number}</strong>
        <span>Actualizado: ${escapeHtml(savedProjectDate(project.updatedAt || project.createdAt))}</span>
      </div>
      <button type="button" data-saved-project-action="modify">Modificar</button>
    </div>
  `).join('');
}
async function saveProjectSnapshot(existingProject = null) {
  const projects = await getAllFromStore('savedProjects');
  const backup = await buildProjectBackup();
  const now = new Date().toISOString();
  const project = existingProject || {
    id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    number: projects.reduce((max, item) => Math.max(max, Number(item.number) || 0), 0) + 1,
    createdAt: now
  };
  project.backup = backup;
  project.updatedAt = now;
  await putSavedProject(project);
  await renderSavedProjects();
  showToastMessage(existingProject ? 'Proyecto modificado' : 'Proyecto guardado');
}
async function saveNewProject() {
  try { await saveProjectSnapshot(); }
  catch { alert('No se ha podido guardar el proyecto en este dispositivo.'); }
}
async function modifySavedProject(id) {
  try {
    const projects = await getAllFromStore('savedProjects');
    const project = projects.find(item => item.id === id);
    if (!project) return;
    if (!confirm(`¿Modificar el Proyecto guardado ${project.number} con los datos actuales de la app?`)) return;
    await saveProjectSnapshot(project);
  } catch {
    alert('No se ha podido modificar este proyecto guardado.');
  }
}
function formatExportDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function statusLabel(value) {
  return STATUS[value]?.label || value || '';
}
function makeExcelBackupHtml(backup) {
  const apartmentRows = Object.entries(backup.data).flatMap(([building, apartments]) => apartments.map(apartment => {
    const statuses = FIELDS.map(([field]) => statusLabel(apartment.statuses?.[field]));
    return `<tr><td>${escapeHtml(BUILDINGS[building] || building)}</td><td>${escapeHtml(apartmentDisplayName(building, apartment.number))}</td>${statuses.map(status => `<td>${escapeHtml(status)}</td>`).join('')}<td>${escapeHtml(apartment.notes || '')}</td></tr>`;
  })).join('');
  const dotationRows = Object.entries(backup.dotationData || {}).flatMap(([building, apartments]) => apartments.flatMap(apartment => DOTATION_ITEMS.map(item => {
    const value = apartment.items?.[item.key] || {};
    return `<tr><td>${escapeHtml(BUILDINGS[building] || building)}</td><td>${escapeHtml(apartmentDisplayName(building, apartment.number))}</td><td>${escapeHtml(item.label)}</td><td>${value.installed ? 'Sí' : 'No'}</td><td>${escapeHtml(value.notes || '')}</td></tr>`;
  }))).join('');
  const diaryRows = backup.diaryEntries.map(entry => `<tr><td>${escapeHtml(entry.date || '')}</td><td>${escapeHtml(BUILDINGS[entry.building] || entry.building || '')}</td><td>${escapeHtml(entry.apartmentNumber ? apartmentDisplayName(entry.building, entry.apartmentNumber) : '')}</td><td>${escapeHtml(entry.tag || '')}</td><td>${escapeHtml(entry.memo || '')}</td><td>${entry.photo ? 'Sí' : 'No'}</td></tr>`).join('');
  const apartmentPhotoRows = backup.apartmentPhotos.map(photo => `<tr><td>${escapeHtml(BUILDINGS[photo.building] || photo.building || '')}</td><td>${escapeHtml(apartmentDisplayName(photo.building, photo.apartmentNumber))}</td><td>${Number(photo.slot) + 1}</td><td>${photo.photo ? 'Sí' : 'No'}</td></tr>`).join('');
  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; margin-bottom: 28px; }
    th { background: #4b2918; color: white; }
    th, td { border: 1px solid #b9a48e; padding: 6px 8px; vertical-align: top; }
    h1, h2 { color: #4b2918; }
    .backup-json { display: none; }
  </style>
</head>
<body>
  <h1>Edificios Lachar</h1>
  <p>Copia exportada el ${escapeHtml(new Date(backup.exportedAt).toLocaleString('es-ES'))}</p>
  <h2>Estados y observaciones</h2>
  <table>
    <thead><tr><th>Edificio</th><th>Piso</th>${FIELDS.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('')}<th>Notas u observaciones</th></tr></thead>
    <tbody>${apartmentRows}</tbody>
  </table>
  <h2>Dotación</h2>
  <table>
    <thead><tr><th>Edificio</th><th>Piso</th><th>Denominación</th><th>Instalado</th><th>Observaciones</th></tr></thead>
    <tbody>${dotationRows || '<tr><td colspan="5">Sin datos de dotación</td></tr>'}</tbody>
  </table>
  <h2>Diario</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Edificio</th><th>Piso</th><th>Etiqueta</th><th>Memoria</th><th>Foto</th></tr></thead>
    <tbody>${diaryRows || '<tr><td colspan="6">Sin fichas diarias</td></tr>'}</tbody>
  </table>
  <h2>Imágenes de pisos</h2>
  <table>
    <thead><tr><th>Edificio</th><th>Piso</th><th>Hueco</th><th>Imagen</th></tr></thead>
    <tbody>${apartmentPhotoRows || '<tr><td colspan="4">Sin imágenes de pisos</td></tr>'}</tbody>
  </table>
  <pre id="edificiosLacharBackupData" class="backup-json">${escapeHtml(JSON.stringify(backup))}</pre>
</body>
</html>`;
}
function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
async function exportProject() {
  try {
    const backup = await buildProjectBackup();
    const html = makeExcelBackupHtml(backup);
    downloadTextFile(`edificios-lachar-${formatExportDate()}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
    showToastMessage('Proyecto descargado');
  } catch {
    alert('No se ha podido descargar el proyecto. Inténtalo de nuevo.');
  }
}
function extractBackupFromFile(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const documentCopy = new DOMParser().parseFromString(text, 'text/html');
  const backupNode = documentCopy.querySelector('#edificiosLacharBackupData');
  if (!backupNode) throw new Error('Archivo no válido');
  return JSON.parse(backupNode.textContent);
}
async function importProjectFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const backup = extractBackupFromFile(text);
    if (backup?.app !== 'Edificios Lachar' || !backup.data) throw new Error('Archivo no válido');
    if (!confirm('Esto sustituirá los datos de este dispositivo por los del archivo elegido. ¿Quieres continuar?')) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.data));
    localStorage.setItem(DOTATION_STORAGE_KEY, JSON.stringify(backup.dotationData || defaultDotationData()));
    await replaceStore('entries', Array.isArray(backup.diaryEntries) ? backup.diaryEntries : []);
    await replaceStore('apartmentPhotos', Array.isArray(backup.apartmentPhotos) ? backup.apartmentPhotos : []);
    data = loadData();
    dotationData = loadDotationData();
    currentBuilding = 'building1';
    currentApartment = 0;
    currentDotationBuilding = 'building1';
    currentDotationApartment = 0;
    selectedDateKey = '';
    currentPhoto = '';
    renderHome();
    renderDotationHome();
    showView('launchView');
    showToastMessage('Proyecto cargado');
  } catch {
    alert('No se ha podido cargar este archivo. Elige un Excel descargado desde esta misma app.');
  } finally {
    event.target.value = '';
  }
}

$('#startSituationBtn').addEventListener('click', openSituationHome);
$('#startDotationBtn').addEventListener('click', openDotationHome);
document.querySelectorAll('[data-go-start]').forEach(button => button.addEventListener('click', () => showView('launchView')));
document.querySelectorAll('[data-go-dotation-home]').forEach(button => button.addEventListener('click', openDotationHome));
$('#buildingSelect').addEventListener('change', event => {
  if (event.target.value) { openBuilding(event.target.value); event.target.value = ''; }
});
$('#dotationBuildingSelect').addEventListener('change', event => {
  if (event.target.value) { openDotationBuilding(event.target.value); event.target.value = ''; }
});
$('#overviewBtn').addEventListener('click', () => { activeArea = 'situation'; $('#overviewBuilding').value = 'all'; renderOverview(); showView('overviewView'); });
$('#showBuildingOverview').addEventListener('click', () => { activeArea = 'situation'; $('#overviewBuilding').value = currentBuilding; renderOverview(); showView('overviewView'); });
$('#dotationOverviewBtn').addEventListener('click', () => { activeArea = 'dotation'; $('#dotationOverviewBuilding').value = 'all'; renderDotationOverview(); showView('dotationOverviewView'); });
$('#showDotationOverview').addEventListener('click', () => { activeArea = 'dotation'; $('#dotationOverviewBuilding').value = currentDotationBuilding; renderDotationOverview(); showView('dotationOverviewView'); });
$('#calendarBtn').addEventListener('click', () => { activeArea = 'situation'; openCalendar(); });
$('#dotationCalendarBtn').addEventListener('click', () => { activeArea = 'dotation'; openCalendar(); });
$('#downloadMenuBtn').addEventListener('click', () => { activeArea = 'situation'; openDownloadView(); });
$('#dotationDownloadBtn').addEventListener('click', () => { activeArea = 'dotation'; openDownloadView(); });
$('#saveProjectBtn').addEventListener('click', saveNewProject);
$('#exportProjectBtn').addEventListener('click', exportProject);
$('#importProjectInput').addEventListener('change', importProjectFile);
$('#savedProjectsList').addEventListener('click', event => {
  const button = event.target.closest('[data-saved-project-action]');
  const item = event.target.closest('[data-saved-project]');
  if (button && item) modifySavedProject(item.dataset.savedProject);
});
document.querySelectorAll('[data-go-home]').forEach(button => button.addEventListener('click', openAreaHome));
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
$('#dotationApartmentTabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-dotation-apartment]');
  if (!tab) return;
  currentDotationApartment = Number(tab.dataset.dotationApartment);
  renderDotationBuilding();
});
$('#dotationItemsBody').addEventListener('click', event => {
  const button = event.target.closest('[data-dotation-toggle]');
  if (!button) return;
  const itemKey = button.dataset.dotationToggle;
  const apartment = dotationData[currentDotationBuilding][currentDotationApartment];
  apartment.items[itemKey].installed = !apartment.items[itemKey].installed;
  saveDotation();
  renderDotationBuilding();
});
$('#dotationItemsBody').addEventListener('input', event => {
  const itemKey = event.target.dataset.dotationNote;
  if (!itemKey) return;
  dotationData[currentDotationBuilding][currentDotationApartment].items[itemKey].notes = event.target.value;
  saveDotation(false);
});
$('#dotationItemsBody').addEventListener('change', event => {
  if (event.target.dataset.dotationNote) saveDotation();
});
$('#apartmentNotes').addEventListener('input', event => { data[currentBuilding][currentApartment].notes = event.target.value; save(false); });
$('#apartmentNotes').addEventListener('change', () => save());
$('#apartmentPhotosGrid').addEventListener('click', async event => {
  const actionButton = event.target.closest('[data-photo-action]');
  const slotElement = event.target.closest('[data-photo-slot]');
  if (!actionButton || !slotElement) return;
  const slot = Number(slotElement.dataset.photoSlot);
  const apartment = data[currentBuilding][currentApartment];
  if (!apartment) return;
  const action = actionButton.dataset.photoAction;
  if (action === 'load') {
    selectedApartmentPhotoSlot = slot;
    $('#apartmentPhotoInput').click();
    return;
  }
  if (action === 'view') {
    const record = await getApartmentPhoto(currentBuilding, apartment.number, slot);
    if (!record?.photo) return;
    const viewer = window.open('', '_blank');
    if (viewer) viewer.document.write(`<title>Imagen piso ${apartment.number}</title><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="${record.photo}" alt="Imagen del piso">`);
    return;
  }
  if (action === 'delete') {
    if (!confirm(`¿Eliminar la imagen ${slot + 1} de ${apartmentDisplayName(currentBuilding, apartment.number)}?`)) return;
    await deleteApartmentPhoto(currentBuilding, apartment.number, slot);
    await renderApartmentPhotos();
    showToastMessage('Imagen eliminada');
  }
});
$('#apartmentPhotoInput').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const apartment = data[currentBuilding][currentApartment];
  try {
    const photo = await resizePhoto(file);
    await putApartmentPhoto({
      id: apartmentPhotoId(currentBuilding, apartment.number, selectedApartmentPhotoSlot),
      building: currentBuilding,
      apartmentNumber: apartment.number,
      slot: selectedApartmentPhotoSlot,
      photo,
      updatedAt: Date.now()
    });
    await renderApartmentPhotos();
    showToastMessage('Imagen guardada en el piso');
  } catch { alert('No se ha podido cargar esta imagen. Prueba con otra fotografía.'); }
  event.target.value = '';
});
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
  if (!confirm(`¿Eliminar ${apartmentDisplayName(currentBuilding, apartments[currentApartment].number)}?`)) return;
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
$('#dotationOverviewBuilding').addEventListener('change', renderDotationOverview);
$('#dotationOverviewBody').addEventListener('click', event => {
  const row = event.target.closest('tr[data-dotation-building]');
  if (row) openDotationBuilding(row.dataset.dotationBuilding, Number(row.dataset.dotationApartment));
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
$('#dayBuilding').addEventListener('change', event => populateApartmentSelect($('#dayApartment'), false, event.target.value));
async function deleteCurrentPhoto() {
  if (!currentPhoto || !confirm('¿Eliminar la fotografía de este día?')) return;
  currentPhoto = '';
  renderPhotoPreview();
  $('#photoOptions').hidden = true;
  await saveDayEntry();
}
$('#removePhoto').addEventListener('click', deleteCurrentPhoto);
$('#dayTag').addEventListener('input', event => { $('#tagCounter').textContent = `${event.target.value.length}/60`; });
$('#saveDay').addEventListener('click', saveDayEntry);

function openPhotoOptions() { if (currentPhoto) $('#photoOptions').hidden = false; }
function closePhotoOptions() { $('#photoOptions').hidden = true; }
$('#photoPreview').addEventListener('click', openPhotoOptions);
$('#photoPreview').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') openPhotoOptions(); });
$('#closePhotoOptions').addEventListener('click', closePhotoOptions);
$('#photoOptions').addEventListener('click', event => { if (event.target === $('#photoOptions')) closePhotoOptions(); });
$('#viewPhoto').addEventListener('click', () => {
  const viewer = window.open('', '_blank');
  if (viewer) viewer.document.write(`<title>Fotografía ${selectedDateKey}</title><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="${currentPhoto}" alt="Fotografía del día">`);
});
$('#takeAnotherPhoto').addEventListener('click', () => { closePhotoOptions(); $('#cameraInput').click(); });
$('#loadAnotherPhoto').addEventListener('click', () => { closePhotoOptions(); $('#galleryInput').click(); });
$('#downloadPhoto').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = currentPhoto;
  link.download = `manoli-${selectedDateKey}.jpg`;
  link.click();
  closePhotoOptions();
});
$('#deletePhotoOption').addEventListener('click', deleteCurrentPhoto);

populateApartmentSelect($('#journalApartmentFilter'), true);
$('#journalBuildingFilter').addEventListener('change', renderJournalList);
$('#journalApartmentFilter').addEventListener('change', renderJournalList);
$('#clearJournalFilters').addEventListener('click', () => {
  $('#journalBuildingFilter').value = 'all';
  $('#journalApartmentFilter').value = 'all';
  renderJournalList();
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
saveDotation(false);
renderHome();
renderDotationHome();
