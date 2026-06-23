/* =========================================================================
   TYPEFLOW — APPLICATION LOGIC
   Sections:
   1. Paragraph banks
   2. DOM references
   3. State & local-storage keys
   4. Storage helpers
   5. Theme
   6. Sound effects (Web Audio API)
   7. Test lifecycle (setup, start, tick, finish)
   8. Input handling & highlighting
   9. Stats
   10. Achievements
   11. Leaderboard
   12. History chart (Canvas API)
   13. Keyboard heatmap
   14. UI helpers (segments, modal)
   15. Event wiring
   16. Init
   ========================================================================= */

/* ---------- 1. PARAGRAPH BANKS ---------- */
const PARAGRAPHS = {
  easy: [
    'The sun was warm and the sky was blue Birds sang in the trees It was a perfect day to go for a walk in the park',
    'She likes to read books at night Her cat sleeps next to her on the bed They are the best of friends',
    'We went to the store to buy milk and bread The line was long but we did not mind It was a calm afternoon',
    'My dog runs fast in the yard He loves to play with his ball I throw it and he brings it back to me',
    'The kids built a sandcastle on the beach Waves came and washed it away They laughed and started a new one'
  ],

  medium: [
    'Technology continues to reshape the way we communicate work and solve problems From smartphones to cloud computing innovation has become a constant force driving change across nearly every industry',
    'Learning a new skill requires patience practice and a willingness to make mistakes along the way The most successful people often treat failure as feedback rather than defeat',
    'Climate patterns around the world are shifting in ways that scientists are working hard to understand Rising temperatures and unpredictable seasons present new challenges for communities everywhere',
    'Good design is not just about how something looks but about how it works and how it makes people feel The best products quietly solve problems without drawing attention to themselves',
    'Markets tend to move in cycles shaped by a mix of investor sentiment economic data and global events Understanding these patterns can help but predicting them with certainty remains difficult'
  ],

  hard: [
    'Quantum computing leverages superposition and entanglement to process information in fundamentally different ways than classical machines potentially solving certain problems exponentially faster',
    'Despite the committees repeated assurances the audit revealed major discrepancies across several fiscal quarters investigators now suspect negligence though fraud has not been ruled out',
    'The novels unreliable narrator whose recollections grow increasingly fragmented forces readers to question not just what happened but whether truth is even a meaningful concept here',
    'According to a recent report global temperatures have risen since preindustrial levels with researchers warning that further increases could trigger irreversible feedback loops',
    'Negotiations stalled late at night when both parties citing irreconcilable differences over a contract clause refused to sign without amendments a follow up session was tentatively scheduled'
  ]
};

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const BADGE_THRESHOLDS = { beginner: 20, intermediate: 40, advanced: 60, expert: 80 };
const BADGE_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];
const BADGE_ICONS = { beginner: '🥉', intermediate: '🥈', advanced: '🥇', expert: '💎' };
const BADGE_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

/* ---------- 2. DOM REFERENCES ---------- */
const el = (id) => document.getElementById(id);

const playerNameInput = el('player-name');
const soundToggleBtn = el('sound-toggle');
const themeToggleBtn = el('theme-toggle');

const difficultySegmented = el('difficulty-segmented');
const timeSegmented = el('time-segmented');

const testCard = el('test-card');
const progressFill = el('progress-fill');
const textDisplayWrap = el('text-display-wrap');
const textDisplay = el('text-display');
const focusHint = el('focus-hint');
const inputEl = el('typing-input');

const statWpm = el('stat-wpm');
const statAccuracy = el('stat-accuracy');
const statErrors = el('stat-errors');
const statTime = el('stat-time');
const statChars = el('stat-chars');
const timeCard = el('time-card');

const restartBtn = el('restart-btn');

const resultsOverlay = el('results-overlay');
const resultsBadge = el('results-badge');
const resultsBadgeIcon = el('results-badge-icon');
const resultsBadgeName = el('results-badge-name');
const resultWpm = el('result-wpm');
const resultCpm = el('result-cpm');
const resultAccuracy = el('result-accuracy');
const resultErrors = el('result-errors');
const resultsBest = el('results-best');
const resultsRestartBtn = el('results-restart');
const resultsCloseBtn = el('results-close');

const badgesRow = el('badges-row');
const bestWpmDisplay = el('best-wpm-display');
const keyboardHeatmap = el('keyboard-heatmap');
const leaderboardList = el('leaderboard-list');
const historyChart = el('history-chart');

const customModal = el('custom-modal');
const customTextInput = el('custom-text-input');
const customCancelBtn = el('custom-cancel');
const customApplyBtn = el('custom-apply');

/* ---------- 3. STATE & STORAGE KEYS ---------- */
const LS_KEYS = {
  theme: 'typeflow_theme',
  sound: 'typeflow_sound_v2',
  name: 'typeflow_name',
  bestWpm: 'typeflow_best_wpm',
  leaderboard: 'typeflow_leaderboard',
  history: 'typeflow_history',
  badges: 'typeflow_badges'
};

const state = {
  difficulty: 'medium',
  duration: 30,
  timeLeft: 30,
  timerId: null,
  startTime: null,
  isRunning: false,
  isFinished: false,
  targetText: '',
  customText: '',
  totalTyped: 0,
  totalCorrect: 0,
  totalErrors: 0,
  heatmap: {},
  soundEnabled: true
};

let prevValue = ''; // tracks the previous textarea value to diff new keystrokes
let currentCharIndex = 0;
let charNodes = [];
let lastToneAt = 0;
const SOUND_MIN_GAP_MS = 80;

/* ---------- 4. STORAGE HELPERS ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* localStorage unavailable — fail silently, app still works this session */
  }
}
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function hexToRgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function normalizeTypingChar(char) {
  if (!char) return '';
  if (/\s/.test(char)) return ' ';
  if ("'`‘’".includes(char)) return "'";
  if ('"“”'.includes(char)) return '"';
  if ('-–—'.includes(char)) return '-';
  return char;
}

function isLetter(char) {
  return /^[a-z]$/i.test(char);
}

function isCorrectCharacter(typedChar, targetChar) {
  const typed = normalizeTypingChar(typedChar);
  const target = normalizeTypingChar(targetChar);

  if (isLetter(typed) && isLetter(target)) {
    return typed.toLowerCase() === target.toLowerCase();
  }
  return typed === target;
}

/* ---------- 5. THEME ---------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
  saveJSON(LS_KEYS.theme, theme);
  // chart colors depend on theme variables — redraw after the swap
  renderHistoryChart();
}
function toggleTheme() {
  const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

/* ---------- 6. SOUND EFFECTS ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playTone(correct) {
  if (!state.soundEnabled) return;
  const now = performance.now();
  if (now - lastToneAt < SOUND_MIN_GAP_MS) return;
  lastToneAt = now;

  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = correct ? 'sine' : 'square';
    osc.frequency.value = correct ? 640 : 180;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(correct ? 0.045 : 0.04, ctx.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    /* audio not available on this device/browser — ignore */
  }
}

/* ---------- 7. TEST LIFECYCLE ---------- */
function pickParagraph(difficulty) {
  if (difficulty === 'custom') return state.customText || PARAGRAPHS.medium[0];
  const bank = PARAGRAPHS[difficulty] || PARAGRAPHS.medium;
  return bank[Math.floor(Math.random() * bank.length)];
}

function setupTest() {
  clearInterval(state.timerId);
  state.timeLeft = state.duration;
  state.startTime = null;
  state.isRunning = false;
  state.isFinished = false;
  state.totalTyped = 0;
  state.totalCorrect = 0;
  state.totalErrors = 0;
  state.heatmap = {};
  prevValue = '';
  currentCharIndex = 0;
  lastToneAt = 0;

  state.targetText = pickParagraph(state.difficulty);
  renderTargetText(state.targetText);

  inputEl.value = '';
  inputEl.disabled = false;

  resultsOverlay.hidden = true;
  focusHint.classList.remove('hidden');
  progressFill.style.width = '100%';
  progressFill.classList.remove('urgent');
  timeCard.classList.remove('time-low');

  statWpm.textContent = '0';
  statAccuracy.innerHTML = '100<small>%</small>';
  statErrors.textContent = '0';
  statTime.innerHTML = `${state.duration}<small>s</small>`;
  statChars.textContent = '0';

  renderHeatmap();
}

function restartTest() {
  setupTest();
  inputEl.focus();
}

function startTest() {
  state.isRunning = true;
  state.startTime = Date.now();
  focusHint.classList.add('hidden');
  state.timerId = setInterval(tick, 1000);
}

function tick() {
  state.timeLeft -= 1;
  statTime.innerHTML = `${Math.max(state.timeLeft, 0)}<small>s</small>`;
  const pct = Math.max((state.timeLeft / state.duration) * 100, 0);
  progressFill.style.width = `${pct}%`;

  if (state.timeLeft <= 10) {
    progressFill.classList.add('urgent');
    timeCard.classList.add('time-low');
  }
  if (state.timeLeft <= 0) {
    finishTest('timeup');
  }
}

function finishTest(reason) {
  if (state.isFinished) return;
  state.isFinished = true;
  state.isRunning = false;
  clearInterval(state.timerId);
  inputEl.disabled = true;
  focusHint.classList.add('hidden');

  const elapsedMs = reason === 'completed' && state.startTime
    ? Date.now() - state.startTime
    : state.duration * 1000;
  const elapsedMin = Math.max(elapsedMs / 60000, 1 / 60); // guard against divide-by-zero

  const finalWpm = Math.round((state.totalCorrect / 5) / elapsedMin) || 0;
  const finalCpm = Math.round(state.totalCorrect / elapsedMin) || 0;
  const finalAccuracy = state.totalTyped > 0
    ? Math.round((state.totalCorrect / state.totalTyped) * 100)
    : 100;

  const prevBest = Number(localStorage.getItem(LS_KEYS.bestWpm) || 0);
  const isNewBest = finalWpm > prevBest;
  if (isNewBest) saveJSON(LS_KEYS.bestWpm, finalWpm);
  bestWpmDisplay.textContent = Math.max(finalWpm, prevBest);

  const badge = getBadgeForWpm(finalWpm);
  const unlocked = updateUnlockedBadges(finalWpm);
  renderBadges(unlocked);

  addToLeaderboard(finalWpm, finalAccuracy);
  addToHistory(finalWpm);
  renderLeaderboard();
  renderHistoryChart();
  renderHeatmap();

  showResultsOverlay({ wpm: finalWpm, cpm: finalCpm, accuracy: finalAccuracy, errors: state.totalErrors, badge, isNewBest });
}

/* ---------- 8. INPUT HANDLING & HIGHLIGHTING ---------- */
function renderTargetText(text) {
  textDisplay.innerHTML = '';
  currentCharIndex = 0;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < text.length; i += 1) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = text[i];
    frag.appendChild(span);
  }
  textDisplay.appendChild(frag);
  charNodes = Array.from(textDisplay.children);
  if (charNodes[0]) charNodes[0].classList.add('current');
}

function updateCharState(index, value) {
  const chars = charNodes;
  const span = chars[index];
  if (!span) return;

  span.classList.remove('correct', 'incorrect', 'current');
  if (index < value.length) {
    span.classList.add(isCorrectCharacter(value[index], state.targetText[index]) ? 'correct' : 'incorrect');
  }
}

function applyHighlighting(value, previousValue = '') {
  const chars = charNodes;
  if (chars[currentCharIndex]) chars[currentCharIndex].classList.remove('current');

  let start = 0;
  const sharedLength = Math.min(value.length, previousValue.length);
  while (start < sharedLength && value[start] === previousValue[start]) {
    start += 1;
  }

  const end = Math.min(Math.max(value.length, previousValue.length), chars.length);
  for (let i = start; i < end; i += 1) updateCharState(i, value);

  currentCharIndex = Math.min(value.length, Math.max(chars.length - 1, 0));
  if (value.length < chars.length) {
    chars[value.length].classList.add('current');
  }
}

function registerMistake(targetChar) {
  let key = null;
  if (/[a-zA-Z]/.test(targetChar)) key = targetChar.toUpperCase();
  else if (targetChar === ' ') key = 'SPACE';
  if (!key) return;
  state.heatmap[key] = (state.heatmap[key] || 0) + 1;
}

function handleInput() {
  if (state.isFinished) return;

  let value = inputEl.value;
  if (value.length > state.targetText.length) {
    value = value.slice(0, state.targetText.length);
    inputEl.value = value;
  }
  const previousValue = prevValue;

  if (!state.isRunning && value.length > 0) startTest();

  if (value === previousValue) return;

  if (value.length > previousValue.length) {
    for (let i = previousValue.length; i < value.length; i += 1) {
      const typedChar = value[i];
      const targetChar = state.targetText[i];
      state.totalTyped += 1;
      if (isCorrectCharacter(typedChar, targetChar)) {
        state.totalCorrect += 1;
        playTone(true);
      } else {
        state.totalErrors += 1;
        registerMistake(targetChar);
        playTone(false);
      }
    }
  }
  prevValue = value;

  applyHighlighting(value, previousValue);
  throttledStats();

  if (value.length === state.targetText.length) {
    finishTest('completed');
  }
}

let lastStatsUpdate = 0;
function throttledStats(){
 const now = performance.now();
 if(now - lastStatsUpdate < 100) return;
 lastStatsUpdate = now;
 updateLiveStats();
}

/* ---------- 9. STATS ---------- */
function updateLiveStats() {
  const elapsedMs = state.startTime ? Date.now() - state.startTime : 0;
  const elapsedMin = elapsedMs / 60000;
  const wpm = elapsedMin > 0 ? Math.round((state.totalCorrect / 5) / elapsedMin) : 0;
  const accuracy = state.totalTyped > 0 ? Math.round((state.totalCorrect / state.totalTyped) * 100) : 100;

  statWpm.textContent = wpm;
  statAccuracy.innerHTML = `${accuracy}<small>%</small>`;
  statErrors.textContent = state.totalErrors;
  statChars.textContent = state.totalTyped;
}

/* ---------- 10. ACHIEVEMENTS ---------- */
function getBadgeForWpm(wpm) {
  for (let i = BADGE_ORDER.length - 1; i >= 0; i -= 1) {
    const key = BADGE_ORDER[i];
    if (wpm >= BADGE_THRESHOLDS[key]) return key;
  }
  return null;
}

function updateUnlockedBadges(wpm) {
  const unlocked = loadJSON(LS_KEYS.badges, {});
  BADGE_ORDER.forEach((key) => {
    if (wpm >= BADGE_THRESHOLDS[key]) unlocked[key] = true;
  });
  saveJSON(LS_KEYS.badges, unlocked);
  return unlocked;
}

function renderBadges(unlocked) {
  BADGE_ORDER.forEach((key) => {
    const node = badgesRow.querySelector(`[data-badge="${key}"]`);
    if (node) node.classList.toggle('unlocked', Boolean(unlocked[key]));
  });
}

/* ---------- 11. LEADERBOARD ---------- */
function addToLeaderboard(wpm, accuracy) {
  const name = (playerNameInput.value || '').trim() || 'Guest';
  const list = loadJSON(LS_KEYS.leaderboard, []);
  list.push({
    name,
    wpm,
    accuracy,
    difficulty: state.difficulty,
    duration: state.duration,
    date: new Date().toLocaleDateString()
  });
  list.sort((a, b) => b.wpm - a.wpm);
  saveJSON(LS_KEYS.leaderboard, list.slice(0, 10));
}

function renderLeaderboard() {
  const list = loadJSON(LS_KEYS.leaderboard, []);
  leaderboardList.innerHTML = '';

  if (list.length === 0) {
    leaderboardList.innerHTML = '<li class="empty">No scores yet — be the first to set a record.</li>';
    return;
  }

  list.slice(0, 5).forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank">#${i + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-wpm">${entry.wpm} WPM</span>
      <span class="lb-acc">${entry.accuracy}%</span>
    `;
    leaderboardList.appendChild(li);
  });
}

/* ---------- 12. HISTORY CHART (CANVAS API) ---------- */
function addToHistory(wpm) {
  const hist = loadJSON(LS_KEYS.history, []);
  hist.push({ wpm, date: Date.now() });
  saveJSON(LS_KEYS.history, hist.slice(-20));
}

function renderHistoryChart() {
  const hist = loadJSON(LS_KEYS.history, []);
  const ctx = historyChart.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = historyChart.clientWidth || 380;
  const cssHeight = 200;

  historyChart.width = cssWidth * dpr;
  historyChart.height = cssHeight * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const mutedColor = getCssVar('--text-muted');
  const accentColor = getCssVar('--accent');
  const borderColor = getCssVar('--glass-border');

  if (hist.length === 0) {
    ctx.fillStyle = mutedColor;
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Complete a test to see your progress here', cssWidth / 2, cssHeight / 2);
    return;
  }

  const padding = 26;
  const maxWpm = Math.max(...hist.map((h) => h.wpm), 10);
  const stepX = hist.length > 1 ? (cssWidth - padding * 2) / (hist.length - 1) : 0;
  const baseY = cssHeight - padding;

  // baseline axis
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, baseY);
  ctx.lineTo(cssWidth - padding, baseY);
  ctx.stroke();

  const pointAt = (i) => {
    const x = padding + stepX * i;
    const y = baseY - (hist[i].wpm / maxWpm) * (cssHeight - padding * 2);
    return [x, y];
  };

  // gradient fill under the line
  ctx.beginPath();
  hist.forEach((h, i) => {
    const [x, y] = pointAt(i);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  const [lastX] = pointAt(hist.length - 1);
  ctx.lineTo(lastX, baseY);
  ctx.lineTo(padding, baseY);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, cssHeight);
  grad.addColorStop(0, hexToRgba(accentColor, 0.35));
  grad.addColorStop(1, hexToRgba(accentColor, 0));
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  hist.forEach((h, i) => {
    const [x, y] = pointAt(i);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // points
  ctx.fillStyle = accentColor;
  hist.forEach((h, i) => {
    const [x, y] = pointAt(i);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------- 13. KEYBOARD HEATMAP ---------- */
function renderHeatmap() {
  keyboardHeatmap.innerHTML = '';
  const values = Object.values(state.heatmap);
  const maxVal = values.length ? Math.max(...values) : 1;
  const errorColor = getCssVar('--error');

  KEYBOARD_ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';
    row.forEach((letter) => {
      const count = state.heatmap[letter] || 0;
      const keyEl = document.createElement('div');
      keyEl.className = 'key';
      keyEl.textContent = letter;
      keyEl.title = `${count} mistake${count === 1 ? '' : 's'}`;
      if (count > 0) {
        const intensity = count / maxVal;
        keyEl.style.background = hexToRgba(errorColor, 0.15 + intensity * 0.55);
        keyEl.style.borderColor = errorColor;
        keyEl.style.color = 'var(--text-primary)';
      }
      rowEl.appendChild(keyEl);
    });
    keyboardHeatmap.appendChild(rowEl);
  });

  const spaceRow = document.createElement('div');
  spaceRow.className = 'keyboard-row';
  const spaceCount = state.heatmap.SPACE || 0;
  const spaceKey = document.createElement('div');
  spaceKey.className = 'key space';
  spaceKey.textContent = 'SPACE';
  spaceKey.title = `${spaceCount} mistake${spaceCount === 1 ? '' : 's'}`;
  if (spaceCount > 0) {
    const intensity = spaceCount / maxVal;
    spaceKey.style.background = hexToRgba(errorColor, 0.15 + intensity * 0.55);
    spaceKey.style.borderColor = errorColor;
    spaceKey.style.color = 'var(--text-primary)';
  }
  spaceRow.appendChild(spaceKey);
  keyboardHeatmap.appendChild(spaceRow);
}

/* ---------- 14. UI HELPERS ---------- */
function setActiveSegment(container, attr, value) {
  container.querySelectorAll('.segment').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset[attr] === String(value));
  });
}

function showResultsOverlay({ wpm, cpm, accuracy, errors, badge, isNewBest }) {
  resultWpm.textContent = wpm;
  resultCpm.textContent = cpm;
  resultAccuracy.textContent = `${accuracy}%`;
  resultErrors.textContent = errors;

  if (badge) {
    resultsBadge.hidden = false;
    resultsBadgeIcon.textContent = BADGE_ICONS[badge];
    resultsBadgeName.textContent = `${BADGE_LABELS[badge]} typist`;
  } else {
    resultsBadge.hidden = true;
  }

  resultsBest.hidden = !isNewBest;
  resultsOverlay.hidden = false;
}

function openCustomModal() {
  customTextInput.value = state.customText || '';
  customModal.hidden = false;
  customTextInput.focus();
}
function closeCustomModal() {
  customModal.hidden = true;
}

/* ---------- 15. EVENT WIRING ---------- */
function bindEvents() {
  // Difficulty segmented control
  difficultySegmented.querySelectorAll('.segment').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.difficulty;
      if (value === 'custom') {
        openCustomModal();
        return;
      }
      state.difficulty = value;
      setActiveSegment(difficultySegmented, 'difficulty', value);
      setupTest();
    });
  });

  // Time segmented control
  timeSegmented.querySelectorAll('.segment').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.duration = Number(btn.dataset.time);
      setActiveSegment(timeSegmented, 'time', btn.dataset.time);
      setupTest();
    });
  });

  // Typing input
  let rafPending=false;
  inputEl.addEventListener('input',()=>{
    if(rafPending) return;
    rafPending=true;
    requestAnimationFrame(()=>{
      handleInput();
      rafPending=false;
    });
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault(); // paragraphs are single-line
  });
  inputEl.addEventListener('focus', () => focusHint.classList.add('hidden'));
  inputEl.addEventListener('blur', () => {
    if (inputEl.value.length === 0 && !state.isFinished) focusHint.classList.remove('hidden');
  });
  textDisplayWrap.addEventListener('click', () => {
    if (!inputEl.disabled) inputEl.focus();
  });

  // Restart
  restartBtn.addEventListener('click', restartTest);
  resultsRestartBtn.addEventListener('click', restartTest);
  resultsCloseBtn.addEventListener('click', () => { resultsOverlay.hidden = true; });

  // Sound toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggleBtn.textContent = state.soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';
    saveJSON(LS_KEYS.sound, state.soundEnabled);
  });

  // Theme toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Player name persistence
  playerNameInput.addEventListener('input', () => {
    saveJSON(LS_KEYS.name, playerNameInput.value);
  });

  // Custom text modal
  customApplyBtn.addEventListener('click', () => {
    const raw = customTextInput.value.replace(/\s+/g, ' ').trim();
    if (raw.length < 10) {
      customTextInput.classList.add('error-shake');
      setTimeout(() => customTextInput.classList.remove('error-shake'), 400);
      return;
    }
    state.customText = raw;
    state.difficulty = 'custom';
    setActiveSegment(difficultySegmented, 'difficulty', 'custom');
    closeCustomModal();
    setupTest();
  });
  customCancelBtn.addEventListener('click', closeCustomModal);
  customModal.addEventListener('click', (e) => {
    if (e.target === customModal) closeCustomModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !customModal.hidden) {
      closeCustomModal();
      return;
    }
    if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      restartTest();
    }
    if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Keep canvas chart crisp on resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderHistoryChart, 150);
  });
}

/* ---------- 16. INIT ---------- */
function init() {
  applyTheme(loadJSON(LS_KEYS.theme, 'dark'));

  state.soundEnabled = false; // forced off for maximum typing performance
  soundToggleBtn.textContent = state.soundEnabled ? '🔊 Sound: On' : '🔇 Sound: Off';

  playerNameInput.value = loadJSON(LS_KEYS.name, '');

  bestWpmDisplay.textContent = localStorage.getItem(LS_KEYS.bestWpm) || '0';
  renderBadges(loadJSON(LS_KEYS.badges, {}));
  renderLeaderboard();
  renderHistoryChart();

  setupTest();
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
