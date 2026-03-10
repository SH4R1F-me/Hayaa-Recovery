/**
 * render.js — Pure UI rendering functions.
 *
 * Every function here reads from the global state (ST) and the DOM,
 * but never modifies ST directly. State changes happen in handlers.js.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════

function renderHeader() {
  const streakValEl = getEl('streak-val');
  const islamicBtn  = getEl('islamic-btn');
  const banner      = getEl('islamic-banner');

  if (streakValEl) streakValEl.textContent = ST.streak;

  // Islamic mode button styling
  if (islamicBtn) {
    islamicBtn.style.background = ST.islamicMode ? 'rgba(201,168,76,.15)' : 'var(--surface2)';
    islamicBtn.style.border     = `1px solid ${ST.islamicMode ? 'rgba(201,168,76,.5)' : 'var(--border)'}`;
    islamicBtn.style.color      = ST.islamicMode ? 'var(--islamic)' : 'var(--muted)';
  }

  // Islamic banner
  if (ST.islamicMode && banner) {
    const v = ISLAMIC_VERSES[ST.verseIdx];
    const arEl  = getEl('banner-ar');
    const bnEl  = getEl('banner-bn');
    const refEl = getEl('banner-ref');
    if (arEl)  arEl.textContent  = v.ar;
    if (bnEl)  bnEl.textContent  = v.bn;
    if (refEl) refEl.textContent = v.ref;
    banner.style.display = 'block';
  } else if (banner) {
    banner.style.display = 'none';
  }

  renderDateDisplay();
}

function renderDateDisplay() {
  const hijriEl = getEl('hijri-date-display');
  const subEl   = getEl('header-date-sub');

  try {
    const gregShort = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short' }).format(new Date());
    if (subEl) subEl.textContent = `${gregShort} — পরিশুদ্ধির পথে`;
  } catch (_) {}

  if (!hijriEl) return;
  if (!ST.islamicMode) { hijriEl.style.display = 'none'; return; }

  try {
    const hijri = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const greg  = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    hijriEl.textContent    = `☪️ ${hijri} | ${greg}`;
    hijriEl.style.display  = 'block';
  } catch (_) {
    hijriEl.textContent   = '☪️ হিজরি তারিখ';
    hijriEl.style.display = 'block';
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

function renderDashboard() {
  const pts = _getTodayPoints();
  const pct = Math.round(ST.completedHabits.length / HABITS.length * 100);

  // Streak hero
  _setText('dash-streak',  ST.streak);
  _setText('dash-longest', ST.longestStreak);
  _setText('dash-total',   ST.totalDays);
  _setText('dash-urges',   ST.urgeCount);

  // Phase tag
  const phaseTag = getEl('phase-tag');
  if (phaseTag) {
    const { label, color } = _getPhase(ST.streak);
    phaseTag.textContent = label;
    phaseTag.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
  }

  // Habit summary
  _setText('dash-points-tag',  `⭐ ${pts} পয়েন্ট`);
  _setText('dash-habit-count', `${ST.completedHabits.length}/8 সম্পন্ন`);
  _setText('dash-habit-pct',   `${pct}%`);
  const pbar = getEl('dash-pbar');
  if (pbar) pbar.style.width = `${pct}%`;

  // Quote
  _setText('daily-quote', `"${MOTIVATIONAL[ST.quoteIdx]}"`);

  // Science tip
  const tip = getEl('science-tip');
  if (tip) {
    if (ST.streak < 7)
      tip.textContent = 'শুরুর ৭ দিন সবচেয়ে কঠিন। ডোপামিন রিসেপ্টর এই সময়ে পুনর্সংযুক্ত হতে শুরু করে।';
    else if (ST.streak < 30)
      tip.textContent = `${ST.streak} দিন পার করেছ! নিউরাল পাথওয়ে পুনর্গঠন শুরু হয়েছে।`;
    else
      tip.textContent = `অসাধারণ! ${ST.streak} দিনে তোমার মস্তিষ্কে স্থায়ী ইতিবাচক পরিবর্তন হচ্ছে।`;
  }

  // Mood grid
  const moods = [
    { v: 1, icon: '😔', label: 'কঠিন'  },
    { v: 2, icon: '😕', label: 'ক্লান্ত' },
    { v: 3, icon: '😐', label: 'ঠিকঠাক' },
    { v: 4, icon: '🙂', label: 'ভালো'   },
    { v: 5, icon: '😊', label: 'দারুণ'  },
  ];
  const moodGrid = getEl('mood-grid');
  if (moodGrid) {
    moodGrid.innerHTML = moods.map(m => `
      <button class="mood-btn${ST.todayMood === m.v ? ' selected' : ''}" onclick="logMood(${m.v})">
        <span class="mood-emoji">${m.icon}</span>
        <span class="mood-lbl">${m.label}</span>
      </button>`).join('');
  }

  const savedLbl = getEl('mood-saved-lbl');
  if (savedLbl) savedLbl.style.display = ST.todayMood ? 'inline' : 'none';

  // Mood verse (Islamic mode)
  renderMoodVerse();

  // Prayer card visibility
  const prayerCard = getEl('prayer-card');
  if (prayerCard) prayerCard.style.display = ST.islamicMode ? 'block' : 'none';

  // Pledge
  const pledgeCheck = getEl('pledge-check');
  if (pledgeCheck) {
    pledgeCheck.classList.toggle('checked', ST.pledgeDoneToday);
    pledgeCheck.textContent = ST.pledgeDoneToday ? '✓' : '';
  }
  const pledgeDoneMsg = getEl('pledge-done-msg');
  if (pledgeDoneMsg) pledgeDoneMsg.style.display = ST.pledgeDoneToday ? 'block' : 'none';

  // Letter preview
  const letterPreviewCard  = getEl('letter-preview-card');
  const letterWritePrompt  = getEl('letter-write-prompt');
  const letterPreviewText  = getEl('letter-preview-text');
  const hasLetter = ST.letterToSelf && ST.letterToSelf.trim();
  if (letterPreviewCard) letterPreviewCard.style.display  = hasLetter ? 'block' : 'none';
  if (letterWritePrompt) letterWritePrompt.style.display  = hasLetter ? 'none'  : 'block';
  if (hasLetter && letterPreviewText) letterPreviewText.textContent = ST.letterToSelf;

  renderDateDisplay();
}

function renderMoodVerse() {
  const card = getEl('mood-verse-card');
  if (!card) return;
  if (!ST.islamicMode || !ST.todayMood) { card.style.display = 'none'; return; }
  const v = MOOD_VERSES[ST.todayMood];
  if (!v) { card.style.display = 'none'; return; }

  const labels = { 1: 'কঠিন মুহূর্তে', 2: 'ক্লান্ত থাকলে', 3: 'সাধারণ দিনে', 4: 'ভালো সময়ে', 5: 'কৃতজ্ঞতার জন্য' };
  _setText('mood-verse-label', `☪️ ${labels[ST.todayMood]}`);
  _setText('mood-verse-ar',    v.ar);
  _setText('mood-verse-bn',    v.bn + (v.hadith ? `\n\n📜 ${v.hadith}` : ''));
  _setText('mood-verse-ref',   v.ref);
  card.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════════════════

function renderHabits() {
  const pts = _getTodayPoints();
  _setText('habit-points',     pts);
  _setText('habit-done-count', ST.completedHabits.length);

  const list = getEl('habit-list');
  if (list) {
    list.innerHTML = '';
    HABITS.forEach(h => {
      const isDone     = ST.completedHabits.includes(h.id);
      const isIslamic  = h.islamic && ST.islamicMode;
      const card       = document.createElement('div');

      card.className = `card habit-card${isDone ? (isIslamic ? ' done done-islamic' : ' done') : ''}`;
      if (isDone) {
        card.style.background   = isIslamic ? 'rgba(201,168,76,.08)' : 'rgba(78,204,163,.07)';
        card.style.borderColor  = isIslamic ? 'rgba(201,168,76,.28)' : 'rgba(78,204,163,.28)';
      }
      const itag = isIslamic
        ? `<span class="tag" style="background:rgba(201,168,76,.1);color:var(--islamic);font-size:9px;margin-left:4px;">☪️</span>`
        : '';
      card.innerHTML = `
        <div class="habit-icon">${h.icon}</div>
        <div class="habit-info">
          <div class="habit-title">${h.title}${itag}</div>
          <div class="habit-pts">+${h.pts} পয়েন্ট</div>
        </div>
        <div class="habit-check">${isDone ? '✓' : ''}</div>`;
      card.onclick = () => toggleHabit(h.id);
      list.appendChild(card);
    });
  }

  // Quran tracker visibility
  const qts = getEl('quran-tracker-section');
  if (qts) {
    qts.style.display = ST.islamicMode ? 'block' : 'none';
    if (ST.islamicMode) {
      _setValue('qt-surah', ST.quranSurah || '');
      _setValue('qt-ayah',  ST.quranAyah  || '');
      _setValue('qt-note',  ST.quranNote  || '');
      renderQuranSaved();
    }
  }
}

function renderQuranSaved() {
  const d = getEl('qt-saved-display');
  if (!d) return;
  if (!ST.quranSurah && !ST.quranAyah) { d.style.display = 'none'; return; }
  _setText('qt-saved-text', `${ST.quranSurah || '?'} — আয়াত ${ST.quranAyah || '?'}`);
  _setText('qt-saved-note', ST.quranNote || '');
  _setText('qt-saved-date', ST.quranDate ? `সেভ: ${ST.quranDate}` : '');
  d.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// URGE TAB
// ═══════════════════════════════════════════════════════════════

function renderUrgeTab() {
  _setText('urge-total-lbl', ST.urgeCount);
  _setText('urge-win-count', ST.urgeCount);

  const urgeIslamicEl   = getEl('urge-islamic');
  const tasbihSectionEl = getEl('tasbih-section');
  if (urgeIslamicEl)   urgeIslamicEl.style.display   = ST.islamicMode ? 'block' : 'none';
  if (tasbihSectionEl) tasbihSectionEl.style.display  = ST.islamicMode ? 'block' : 'none';
  if (ST.islamicMode) updateTasbihUI();

  renderTriggerLog();
  renderToolList();
  getDopasuggestion();
}

function renderTriggerLog() {
  const card = getEl('trigger-log-card');
  const list = getEl('trigger-log-list');
  if (!card || !list) return;

  if (!ST.triggerLog.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = ST.triggerLog.slice(0, 5).map(t => `
    <div class="trigger-log-item">
      <span style="font-size:16px;">${t.type === 'relapse' ? '🔴' : '🟡'}</span>
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text);">${escapeHtml(t.trigger || 'কারণ নির্দিষ্ট নয়')}</div>
        <div style="font-size:10px;color:var(--muted);">${t.date} · ${t.type === 'relapse' ? 'রিল্যাপস' : 'ইচ্ছা'}</div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS TAB
// ═══════════════════════════════════════════════════════════════

function renderProgress() {
  // Stats grid
  const rate = (ST.totalDays + ST.relapseCount * 3) > 0
    ? Math.round(ST.totalDays / (ST.totalDays + ST.relapseCount * 3) * 100)
    : 100;

  const stats = [
    { label: 'বর্তমান স্ট্রিক', value: ST.streak,        unit: 'দিন',  color: 'var(--accent)',  icon: '🔥' },
    { label: 'সর্বোচ্চ স্ট্রিক', value: ST.longestStreak, unit: 'দিন',  color: '#b57bee',        icon: '🏆' },
    { label: 'পরিষ্কার দিন',     value: ST.totalDays,     unit: 'মোট',  color: '#6ba8f7',        icon: '📅' },
    { label: 'ইচ্ছা জয়',        value: ST.urgeCount,     unit: 'বার',  color: 'var(--accent2)', icon: '💪' },
    { label: 'রিল্যাপস',         value: ST.relapseCount,  unit: 'বার',  color: 'var(--accent3)', icon: '🔄' },
    { label: 'সাফল্যের হার',     value: rate,             unit: '%',    color: 'var(--accent)',  icon: '📈' },
  ];
  const statsGrid = getEl('stats-grid');
  if (statsGrid) {
    statsGrid.innerHTML = stats.map(s => `
      <div class="card stat-card">
        <div style="font-size:22px;">${s.icon}</div>
        <div class="stat-card-val" style="color:${s.color};">${s.value}</div>
        <div class="stat-card-lbl">${s.unit} ${s.label}</div>
      </div>`).join('');
  }

  // Mood chart
  const moodChart = getEl('mood-chart');
  if (moodChart) {
    moodChart.innerHTML = (ST.moodLog || []).map((v, i) => {
      if (v != null) {
        return `
          <div class="mood-bar-col">
            <div class="mood-bar" style="height:${v * 12}px;background:rgba(78,204,163,${0.1 + v * 0.15});"></div>
            <div class="mood-day">${WEEK_DAYS[i]}</div>
          </div>`;
      }
      return `
        <div class="mood-bar-col">
          <div style="width:100%;height:4px;background:var(--surface2);border-radius:2px;"></div>
          <div class="mood-day">${WEEK_DAYS[i]}</div>
        </div>`;
    }).join('');
  }

  // Achievements
  const achieveGrid = getEl('achieve-grid');
  if (achieveGrid) {
    achieveGrid.innerHTML = ACHIEVEMENTS.map(a => {
      const earned = ST.earnedAchievements.includes(a.id);
      return `
        <div class="achieve-card${earned ? ' earned' : ''}">
          <div class="achieve-icon">${a.icon}</div>
          <div class="achieve-title">${a.title}</div>
          <div class="achieve-desc">${a.desc}</div>
          ${earned ? '<div class="achieve-badge">✅ অর্জিত</div>' : ''}
        </div>`;
    }).join('');
  }

  // Trigger summary
  renderTriggerSummary();

  // Flatline indicator
  const fl = getEl('flatline-indicator');
  if (fl) {
    if (ST.streak >= 14 && ST.streak <= 56) {
      fl.textContent = `⚠️ সম্ভাব্য ফ্ল্যাটলাইন পর্যায় (${ST.streak} দিন)`;
      fl.style.cssText = 'background:rgba(107,168,247,.1);color:#6ba8f7;border:1px solid rgba(107,168,247,.25);padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;';
    } else if (ST.streak > 0) {
      fl.textContent = '✅ ফ্ল্যাটলাইন পর্যায় নয়';
      fl.style.cssText = 'background:rgba(78,204,163,.1);color:var(--accent);border:1px solid rgba(78,204,163,.25);padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;';
    } else {
      fl.textContent = '';
    }
  }

  // Recovery timeline
  const recoveryEl = getEl('recovery-timeline');
  if (recoveryEl) {
    recoveryEl.innerHTML = RECOVERY_TIMELINE.map(r => {
      const reached = ST.streak >= r.days;
      return `
        <div class="timeline-item">
          <div class="timeline-dot${reached ? ' reached' : ''}">${reached ? '✓' : r.days}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:${reached ? 'var(--text)' : 'var(--muted)'};">
              ${r.label}${reached ? '<span style="margin-left:6px;color:var(--accent);font-size:11px;">✅</span>' : ''}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:1px;">${r.desc}</div>
          </div>
        </div>`;
    }).join('');
  }
}

function renderTriggerSummary() {
  const el = getEl('trigger-summary-content');
  if (!el) return;

  if (!ST.triggerLog.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:8px 0;">এখনো কোনো ট্রিগার লগ নেই।</div>';
    return;
  }

  const freq = {};
  ST.triggerLog.forEach(t => { if (t.trigger) freq[t.trigger] = (freq[t.trigger] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max    = sorted[0] ? sorted[0][1] : 1;

  if (!sorted.length) { el.innerHTML = '<div style="font-size:13px;color:var(--muted);">পর্যাপ্ত তথ্য নেই।</div>'; return; }

  el.innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">সবচেয়ে বেশি দেখা ট্রিগার:</div>
    ${sorted.map(([t, c]) => `
      <div class="trigger-bar-row">
        <div class="trigger-bar-label">${escapeHtml(t)}</div>
        <div class="trigger-bar-track"><div class="trigger-bar-fill" style="width:${Math.round(c / max * 100)}%;"></div></div>
        <div class="trigger-bar-count">${c}</div>
      </div>`).join('')}
    <div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.6;">
      💡 সবচেয়ে বড় ট্রিগার: <strong style="color:var(--text);">${escapeHtml(sorted[0][0])}</strong>। এই পরিস্থিতি এড়ানোর পরিকল্পনা তৈরি করো।
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

function renderSettings() {
  const toggleIslamic = getEl('toggle-islamic');
  const toggleNotif   = getEl('toggle-notif');
  if (toggleIslamic) toggleIslamic.className = `toggle-switch ${ST.islamicMode ? 'on-islamic' : ''}`;
  if (toggleNotif)   toggleNotif.className   = `toggle-switch ${ST.notifications ? 'on' : ''}`;

  _setValue('partner-phone', ST.partnerPhone || '');
  _setValue('partner-email', ST.partnerEmail || '');
}

// ═══════════════════════════════════════════════════════════════
// SHARED UTILITIES (render-layer helpers)
// ═══════════════════════════════════════════════════════════════

/**
 * Builds the trigger selector HTML used by both the Urge tab and Relapse modal.
 * @param {string} label     Heading text
 * @param {string} callback  Name of the JS callback function (string, called inline)
 * @returns {string} HTML string
 */
function buildTriggerSelector(label, callback) {
  const triggerBtns = TRIGGERS
    .map(t => `<button class="btn btn-secondary trigger-btn" onclick="${callback}('${escapeHtml(t)}')">${escapeHtml(t)}</button>`)
    .join('');

  const customId = `custom-trigger-${callback}`;
  return `
    <div class="card fadeUp" style="border-color:rgba(246,201,14,.25);">
      <div style="font-size:13px;font-weight:600;color:var(--accent2);margin-bottom:10px;">📌 ${label}</div>
      <div class="trigger-grid">${triggerBtns}</div>
      <div style="display:flex;gap:8px;">
        <input id="${customId}" placeholder="নিজে লিখুন..."
          style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;font-family:'Hind Siliguri',sans-serif;"/>
        <button class="btn btn-primary" style="padding:8px 14px;font-size:13px;"
          onclick="${callback}(document.getElementById('${customId}').value||'অন্যান্য')">দাখিল</button>
      </div>
      <button onclick="${callback}('')"
        style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:12px;margin-top:8px;font-family:'Hind Siliguri',sans-serif;">এড়িয়ে যাও →</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// Private helpers
// ═══════════════════════════════════════════════════════════════

function _getTodayPoints() {
  return ST.completedHabits.reduce((sum, id) => {
    const h = HABITS.find(h => h.id === id);
    return sum + (h ? h.pts : 0);
  }, 0);
}

function _getPhase(streak) {
  if (streak < 7)  return { label: 'প্রাথমিক পর্যায়', color: '#e05c5c' };
  if (streak < 30) return { label: 'নিরাময় পর্যায়',   color: '#f6c90e' };
  if (streak < 90) return { label: 'সুদৃঢ় পর্যায়',    color: '#4ecca3' };
  return               { label: 'মুক্তি পর্যায়',       color: '#b57bee' };
}

/** Shorthand: set textContent of element by id */
function _setText(id, value) {
  const el = getEl(id);
  if (el) el.textContent = value;
}

/** Shorthand: set value of input element by id */
function _setValue(id, value) {
  const el = getEl(id);
  if (el) el.value = value;
}
