/**
 * tools.js — Urge Tools: Timer, Breathing, Urge Surfing, CBT, 5-Senses.
 *
 * Each tool is rendered into a collapsible panel inside #tool-list.
 * Tool state (timer, breath animation, etc.) lives here as module-level
 * variables to avoid polluting the global scope further.
 */

'use strict';

// ── Tool Panel State ──────────────────────────────────────────────────────────
let _activeToolId       = null;

// Timer
const  TIMER_TOTAL      = 300; // seconds
const  TIMER_CIRC       = 2 * Math.PI * 44; // SVG circle circumference
let    _timerSecs       = TIMER_TOTAL;
let    _timerRunning    = false;
let    _timerDone       = false;
let    _timerInterval   = null;

// Breathing
let    _breathRunning   = false;
let    _breathFrameId   = null;
let    _breathStartTime = null;
let    _breathCycles    = 0;

// Urge Surfing
let    _surfStep        = 0;

// 5-Senses Grounding
let    _senseDone       = new Set();

// ═══════════════════════════════════════════════════════════════
// TOOL LIST RENDERER
// ═══════════════════════════════════════════════════════════════

function renderToolList() {
  const list = getEl('tool-list');
  if (!list) return;
  list.innerHTML = '';

  TOOLS.forEach(tool => {
    const isActive  = _activeToolId === tool.id;
    const wrapper   = document.createElement('div');

    // Toggle button
    const btn = document.createElement('button');
    btn.className  = 'tool-card-btn';
    btn.style.background = isActive ? hexToRgba(tool.color, .1) : 'var(--surface)';
    btn.style.border     = `1px solid ${isActive ? tool.color + '55' : 'var(--border)'}`;
    btn.innerHTML = `
      <span style="font-size:26px;">${tool.icon}</span>
      <div style="flex:1;text-align:left;">
        <div style="font-size:14px;font-weight:600;color:var(--text);font-family:'Hind Siliguri',sans-serif;">${tool.title}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:1px;">${tool.desc}</div>
      </div>
      <span style="color:${tool.color};font-size:16px;">${isActive ? '▲' : '▼'}</span>`;

    btn.onclick = () => {
      _activeToolId = isActive ? null : tool.id;
      renderToolList();
    };
    wrapper.appendChild(btn);

    // Expanded panel
    if (isActive) {
      const panel = document.createElement('div');
      panel.className = 'tool-panel';
      panel.innerHTML = _buildToolPanel(tool.id);
      wrapper.appendChild(panel);
      // Initialise tool-specific state after the DOM is ready
      setTimeout(() => _initToolPanel(tool.id), 0);
    }

    list.appendChild(wrapper);
  });
}

// ═══════════════════════════════════════════════════════════════
// PANEL BUILDERS
// ═══════════════════════════════════════════════════════════════

function _buildToolPanel(id) {
  switch (id) {
    case 'timer':     return _buildTimerPanel();
    case 'breathing': return _buildBreathingPanel();
    case 'surf':      return _buildSurfPanel();
    case 'cbt':       return _buildCBTPanel();
    case 'senses':    return _buildSensesPanel();
    default:          return '';
  }
}

function _buildTimerPanel() {
  return `
    <div class="card fadeUp" style="text-align:center;">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:16px;">⏱️ আর্জ টাইমার</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px;line-height:1.6;">গবেষণা বলে, তীব্র ইচ্ছা ৩-৭ মিনিটে কমে আসে। ৫ মিনিট শুধু অপেক্ষা করো।</div>
      <svg id="timer-svg" width="120" height="120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="var(--surface2)" stroke-width="6"/>
        <circle id="timer-arc" cx="60" cy="60" r="44" fill="none" stroke="var(--accent)"
          stroke-width="6" stroke-dasharray="${TIMER_CIRC.toFixed(2)}" stroke-dashoffset="0"
          stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset .9s linear;"/>
        <text id="timer-text" x="60" y="65" text-anchor="middle" fill="var(--accent)"
          font-family="'Hind Siliguri',sans-serif" font-size="20" font-weight="700">05:00</text>
      </svg>
      <div id="timer-done-msg" style="display:none;color:var(--accent2);font-size:15px;font-weight:700;margin-top:12px;">
        🎉 তুমি ৫ মিনিট পার করেছ! ইচ্ছাটি কি কমেছে?
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <button id="timer-start-btn" class="btn btn-primary" style="padding:9px 20px;font-size:14px;" onclick="timerToggle()">▶ শুরু</button>
        <button id="timer-reset-btn" class="btn btn-secondary" style="font-size:13px;display:none;" onclick="timerReset()">রিসেট</button>
      </div>
    </div>`;
}

function _buildBreathingPanel() {
  return `
    <div class="card fadeUp" style="text-align:center;padding:24px 18px;">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;">🌬️ ৪-৭-৮ শ্বাস-প্রশ্বাস</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:18px;">এই পদ্ধতি parasympathetic nervous system সক্রিয় করে কর্টিসল কমায়।</div>
      <div id="breath-circle">প্রস্তুত?</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">
        চক্র সম্পন্ন: <span id="breath-cycles" style="color:var(--accent);font-weight:700;">0</span>
      </div>
      <button id="breath-btn" class="btn btn-primary" onclick="breathToggle()">▶ শুরু করো</button>
    </div>`;
}

function _buildSurfPanel() {
  const bars = SURF_STEPS.map((_, i) =>
    `<div class="surf-step-dot${i <= _surfStep ? ' active' : ''}"></div>`
  ).join('');

  const step    = SURF_STEPS[_surfStep];
  const hasPrev = _surfStep > 0;
  const hasNext = _surfStep < SURF_STEPS.length - 1;

  return `
    <div class="card fadeUp">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px;">🏄 আর্জ সার্ফিং</div>
      <div class="surf-progress">${bars}</div>
      <div class="surf-content">
        <div class="surf-q">${step.q}</div>
        <div class="surf-hint">${step.hint}</div>
      </div>
      <div style="display:flex;gap:8px;">
        ${hasPrev ? `<button class="btn btn-secondary" onclick="surfNav(-1)">← আগে</button>` : ''}
        ${hasNext
          ? `<button class="btn btn-primary" onclick="surfNav(1)">পরবর্তী →</button>`
          : `<div style="padding:10px 14px;background:rgba(78,204,163,.12);border-radius:10px;color:var(--accent);font-size:13px;font-weight:600;">✅ তরঙ্গ পার করেছ!</div>`}
      </div>
    </div>`;
}

function _buildCBTPanel() {
  return `
    <div class="card fadeUp">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;">🧠 চিন্তা পুনর্গঠন (CBT + AI)</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.6;">এই মুহূর্তে যে নেতিবাচক বা প্ররোচিত চিন্তা আসছে সেটি লিখো।</div>
      <textarea id="cbt-input" class="cbt-textarea" placeholder="যেমন: 'একবার দেখলে কিছু হবে না...'"></textarea>
      <button id="cbt-btn" class="btn btn-primary" style="margin-top:10px;width:100%;font-size:14px;" onclick="runCBT()">
        🔄 চিন্তা পুনর্গঠন করো
      </button>
      <div id="cbt-result" class="cbt-result"></div>
      <div id="cbt-error"  class="cbt-error"></div>
    </div>`;
}

function _buildSensesPanel() {
  const ITEMS = [
    { n: 5, icon: '👁️', q: '৫টি জিনিস নাম করো যা এখন দেখতে পাচ্ছ' },
    { n: 4, icon: '✋', q: '৪টি জিনিস যা তুমি স্পর্শ করতে পারছ' },
    { n: 3, icon: '👂', q: '৩টি শব্দ যা এখন শুনতে পাচ্ছ' },
    { n: 2, icon: '👃', q: '২টি গন্ধ এই মুহূর্তে অনুভব করো' },
    { n: 1, icon: '👅', q: '১টি স্বাদ এখন অনুভব করতে পারছ?' },
  ];
  const items = ITEMS.map(s => {
    const done = _senseDone.has(s.n);
    return `
      <div class="sense-item${done ? ' done' : ''}" onclick="toggleSense(${s.n})">
        <span style="font-size:20px;">${s.icon}</span>
        <span style="flex:1;font-size:13px;color:var(--text);font-family:'Hind Siliguri',sans-serif;margin-left:10px;">${s.q}</span>
        <span class="sense-check">${done ? '✅' : '○'}</span>
      </div>`;
  }).join('');

  const allDone = _senseDone.size === 5
    ? `<div style="margin-top:12px;text-align:center;color:var(--accent);font-size:14px;font-weight:700;">🎉 দারুণ! তুমি বর্তমানে ফিরে এসেছ।</div>`
    : '';

  return `<div class="card fadeUp"><div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px;">✋ ৫-৪-৩-২-১ গ্রাউন্ডিং</div>${items}${allDone}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// TOOL INIT (runs after panel is inserted into DOM)
// ═══════════════════════════════════════════════════════════════

function _initToolPanel(id) {
  switch (id) {
    case 'timer':
      _timerSecs    = TIMER_TOTAL;
      _timerRunning = false;
      _timerDone    = false;
      if (_timerInterval) clearInterval(_timerInterval);
      _updateTimerDisplay();
      break;
    case 'breathing':
      _breathRunning = false;
      _breathCycles  = 0;
      if (_breathFrameId) cancelAnimationFrame(_breathFrameId);
      break;
    case 'surf':
      _surfStep = 0;
      break;
    case 'senses':
      _senseDone = new Set();
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════════════════════

function timerToggle() {
  if (_timerDone) { timerReset(); return; }
  _timerRunning = !_timerRunning;
  if (_timerRunning) {
    _timerInterval = setInterval(() => {
      _timerSecs--;
      if (_timerSecs <= 0) {
        _timerSecs    = 0;
        _timerRunning = false;
        _timerDone    = true;
        clearInterval(_timerInterval);
      }
      _updateTimerDisplay();
    }, 1000);
  } else {
    clearInterval(_timerInterval);
  }
  _updateTimerDisplay();
}

function timerReset() {
  clearInterval(_timerInterval);
  _timerSecs    = TIMER_TOTAL;
  _timerRunning = false;
  _timerDone    = false;
  _updateTimerDisplay();
}

function _updateTimerDisplay() {
  const arc     = getEl('timer-arc');
  const txt     = getEl('timer-text');
  const startBtn = getEl('timer-start-btn');
  const resetBtn = getEl('timer-reset-btn');
  const doneMsg  = getEl('timer-done-msg');
  if (!arc) return;

  const offset = TIMER_CIRC * (1 - _timerSecs / TIMER_TOTAL);
  arc.setAttribute('stroke-dashoffset', offset);
  arc.style.stroke = _timerDone ? '#f6c90e' : 'var(--accent)';

  txt.textContent = _timerDone
    ? '✓'
    : `${pad(Math.floor(_timerSecs / 60))}:${pad(_timerSecs % 60)}`;
  txt.setAttribute('fill', _timerDone ? '#f6c90e' : 'var(--accent)');

  if (startBtn) startBtn.textContent = _timerRunning ? '⏸ বিরতি' : (_timerDone ? '↺ আবার' : '▶ শুরু');
  if (doneMsg)  doneMsg.style.display  = _timerDone ? 'block' : 'none';
  if (resetBtn) resetBtn.style.display = (_timerRunning || _timerDone || _timerSecs < TIMER_TOTAL) ? 'inline-flex' : 'none';
}

// ═══════════════════════════════════════════════════════════════
// BREATHING
// ═══════════════════════════════════════════════════════════════

function breathToggle() {
  _breathRunning = !_breathRunning;
  const btn = getEl('breath-btn');
  if (btn) btn.textContent = _breathRunning ? '⏸ বিরতি' : '▶ শুরু করো';
  if (_breathRunning) {
    _breathCycles    = 0;
    _breathStartTime = null;
    requestAnimationFrame(_breathFrame);
  } else {
    cancelAnimationFrame(_breathFrameId);
    const circle = getEl('breath-circle');
    if (circle) {
      circle.textContent      = 'প্রস্তুত?';
      circle.style.transform  = 'scale(1)';
      circle.style.background = 'rgba(78,204,163,.1)';
    }
  }
}

function _breathFrame(ts) {
  if (!_breathRunning) return;
  if (!_breathStartTime) _breathStartTime = ts;

  const elapsed    = (ts - _breathStartTime) / 1000;
  const totalCycle = BREATH_STEPS.reduce((s, x) => s + x.dur, 0);
  const cycleT     = elapsed % totalCycle;

  let acc = 0, stepIdx = 0;
  for (let i = 0; i < BREATH_STEPS.length; i++) {
    acc += BREATH_STEPS[i].dur;
    if (cycleT < acc) { stepIdx = i; break; }
  }

  _breathCycles = Math.floor(elapsed / totalCycle);
  const step    = BREATH_STEPS[stepIdx];
  const circle  = getEl('breath-circle');
  const cycleEl = getEl('breath-cycles');

  if (circle) {
    circle.textContent      = step.text;
    circle.style.background = step.bg;
    circle.style.transform  = `scale(${step.scale})`;
    circle.style.transition = `transform ${step.dur}s ease, background ${step.dur}s ease`;
  }
  if (cycleEl) cycleEl.textContent = _breathCycles;

  _breathFrameId = requestAnimationFrame(_breathFrame);
}

// ═══════════════════════════════════════════════════════════════
// URGE SURFING
// ═══════════════════════════════════════════════════════════════

function surfNav(dir) {
  _surfStep = Math.max(0, Math.min(SURF_STEPS.length - 1, _surfStep + dir));
  // Re-render just the surf panel in-place
  const panel = document.querySelector('#tool-list .tool-panel');
  if (panel) panel.innerHTML = _buildSurfPanel();
}

// ═══════════════════════════════════════════════════════════════
// 5-SENSES GROUNDING
// ═══════════════════════════════════════════════════════════════

function toggleSense(n) {
  _senseDone.has(n) ? _senseDone.delete(n) : _senseDone.add(n);
  const panel = document.querySelector('#tool-list .tool-panel');
  if (panel) panel.innerHTML = _buildSensesPanel();
}
