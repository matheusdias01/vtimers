'use strict';

// --- Segurança: escape para evitar XSS ao inserir nomes/strings no DOM ---
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// --- Debounce para evitar gravações excessivas no localStorage ---
let saveTimeout = null;
function saveStateToLocalStorageDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveStateToLocalStorage();
    saveTimeout = null;
  }, 300);
}

// Estado global
let timers = [];
let timerInterval = null;
let isLoopRunning = false;

// Função para salvar no localStorage
function saveStateToLocalStorage() {
  try {
    localStorage.setItem('timers', JSON.stringify(timers));
  } catch (e) {
    console.error('Erro ao salvar estado:', e);
  }
}

// Função para carregar do localStorage
function loadStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem('timers');
    if (saved) {
      timers = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao carregar estado:', e);
  }
}

// --- Lógica do loop principal ---
function startMainLoop() {
  if (!isLoopRunning) {
    isLoopRunning = true;
    timerInterval = setInterval(tick, 1000);
  }
}

function stopMainLoop() {
  isLoopRunning = false;
  try { clearInterval(timerInterval); } catch (e) {}
  timerInterval = null;
}

function tick() {
  const now = Date.now();

  timers.forEach(timer => {
    if (timer.isRunning) {
      const elapsed = Math.floor((now - timer.startTimestamp) / 1000);
      const remaining = Math.max(timer.totalSeconds - elapsed, 0);

      timer.remaining = remaining;

      if (remaining <= 0 && !timer.finished) {
        timer.finished = true;
        playAlarmSound();
        showNotification(timer.name);
      }
    }
  });

  renderTimers();
  saveStateToLocalStorageDebounced();
}

// --- Funções de Timer ---
function addTimer(name, seconds) {
  timers.push({
    id: Date.now(),
    name: name || 'Novo timer',
    totalSeconds: seconds || 60,
    remaining: seconds || 60,
    isRunning: false,
    finished: false,
    startTimestamp: null
  });
  saveStateToLocalStorageDebounced();
  renderTimers();
}

function startTimer(id) {
  const timer = timers.find(t => t.id === id);
  if (timer && !timer.isRunning && !timer.finished) {
    timer.isRunning = true;
    timer.startTimestamp = Date.now() - ((timer.totalSeconds - timer.remaining) * 1000);
    startMainLoop();
  }
}

function pauseTimer(id) {
  const timer = timers.find(t => t.id === id);
  if (timer && timer.isRunning) {
    timer.isRunning = false;
    timer.remaining = Math.max(timer.remaining, 0);
    saveStateToLocalStorageDebounced();
  }
}

function resetTimer(id) {
  const timer = timers.find(t => t.id === id);
  if (timer) {
    timer.isRunning = false;
    timer.remaining = timer.totalSeconds;
    timer.finished = false;
    timer.startTimestamp = null;
    saveStateToLocalStorageDebounced();
    renderTimers();
  }
}

// --- Renderização ---
function renderTimers() {
  const container = document.getElementById('timers');
  if (!container) return;

  container.innerHTML = '';

  timers.forEach(timer => {
    const el = document.createElement('div');
    el.className = 'timer-item';

    // Nome seguro
    const title = document.createElement('h2');
    title.className = 'text-xl font-semibold truncate';
    title.textContent = timer.name;
    el.appendChild(title);

    // Tempo restante
    const timeEl = document.createElement('p');
    timeEl.className = 'text-lg';
    timeEl.textContent = formatTime(timer.remaining);
    el.appendChild(timeEl);

    // Botões
    const controls = document.createElement('div');

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Iniciar';
    startBtn.onclick = () => startTimer(timer.id);

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pausar';
    pauseBtn.onclick = () => pauseTimer(timer.id);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Resetar';
    resetBtn.onclick = () => resetTimer(timer.id);

    controls.appendChild(startBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(resetBtn);

    el.appendChild(controls);
    container.appendChild(el);
  });
}

// --- Utilidades ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Som e notificações ---
function playAlarmSound() {
  try {
    const audio = document.getElementById('alarm-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  } catch (e) {
    console.error('Erro ao tocar som:', e);
  }
}

function showNotification(timerName) {
  if (Notification.permission === 'granted') {
    new Notification('Timer finalizado', { body: `${timerName} terminou!` });
  }
}

// --- Inicialização ---
window.addEventListener('load', () => {
  loadStateFromLocalStorage();
  renderTimers();

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
