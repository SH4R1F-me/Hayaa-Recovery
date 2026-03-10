/**
 * handlers.js — All user-facing event handlers.
 *
 * These functions are called directly from inline HTML onclick attributes.
 * They mutate ST, call saveState(), and trigger re-renders.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!ST.earnedAchievements.includes(a.id) && a.check(ST)) {
      ST.earnedAchievements.push(a.id);
      saveState();
      _showAchievementToast(a);
    }
  });
}

function _showAchievementToast(a) {
  const toast = getEl('achievement-toast');
  if (!toast) return;
  const icon  = getEl('toast-icon');
  const title = getEl('toast-title');
  const desc  = getEl('toast-desc');
  if (icon)  icon.textContent  = a.icon;
  if (title) title.textContent = a.title;
  if (desc)  desc.textContent  = a.desc;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 4000);
}

// ═══════════════════════════════════════════════════════════════
// MOOD
// ═══════════════════════════════════════════════════════════════

function logMood(v) {
  ST.todayMood     = v;
  const nl         = [...ST.moodLog];
  nl[6]            = v;
  ST.moodLog       = nl;
  saveState();
  renderDashboard();
}

// ═══════════════════════════════════════════════════════════════
// MORNING PLEDGE MODAL
// ═══════════════════════════════════════════════════════════════

function checkMorningPledge() {
  if (!ST.pledgeDoneToday && !ST.morningPledgeShown) {
    ST.morningPledgeShown = true;
    saveState();
    setTimeout(() => {
      const islamicNote = getEl('pledge-modal-islamic');
      if (islamicNote) islamicNote.style.display = ST.islamicMode ? 'block' : 'none';
      const modal = getEl('pledge-modal');
      if (modal) modal.style.display = 'flex';
    }, 1400);
  }
}

function acceptPledge() {
  ST.pledgeDoneToday = true;
  ST.pledgeCount++;
  saveState();
  checkAchievements();
  const modal = getEl('pledge-modal');
  if (modal) modal.style.display = 'none';
  renderDashboard();
}

function closePledgeModal() {
  const modal = getEl('pledge-modal');
  if (modal) modal.style.display = 'none';
}

/** Called when the user clicks the pledge checkbox directly on the dashboard */
function togglePledge() {
  if (!ST.pledgeDoneToday) acceptPledge();
}

// ═══════════════════════════════════════════════════════════════
// LETTER TO FUTURE SELF
// ═══════════════════════════════════════════════════════════════

function openLetterModal() {
  const textarea = getEl('letter-textarea');
  if (textarea) textarea.value = ST.letterToSelf || '';
  const modal = getEl('letter-modal');
  if (modal) modal.style.display = 'flex';
}

function closeLetterModal() {
  const modal = getEl('letter-modal');
  if (modal) modal.style.display = 'none';
}

function saveLetter() {
  const textarea = getEl('letter-textarea');
  if (textarea) {
    ST.letterToSelf = textarea.value.trim();
    saveState();
  }
  closeLetterModal();
  renderDashboard();
}

// ═══════════════════════════════════════════════════════════════
// EMERGENCY MODAL
// ═══════════════════════════════════════════════════════════════

function openEmergency() {
  const letterSection = getEl('emergency-letter-section');
  const letterText    = getEl('emergency-letter-text');
  const islamicEl     = getEl('emergency-islamic');

  if (ST.letterToSelf && ST.letterToSelf.trim()) {
    if (letterText)    letterText.textContent  = ST.letterToSelf;
    if (letterSection) letterSection.style.display = 'block';
  } else {
    if (letterSection) letterSection.style.display = 'none';
  }

  if (islamicEl) islamicEl.style.display = ST.islamicMode ? 'block' : 'none';
  const modal = getEl('emergency-modal');
  if (modal) modal.style.display = 'flex';
}

function closeEmergencyModal() {
  const modal = getEl('emergency-modal');
  if (modal) modal.style.display = 'none';
}

function closeEmergencyAndGoUrge() {
  closeEmergencyModal();
  switchTab('urge');
}

// ═══════════════════════════════════════════════════════════════
// RELAPSE MODAL
// ═══════════════════════════════════════════════════════════════

function openRelapseModal() {
  const confirm  = getEl('relapse-step-confirm');
  const trigger  = getEl('relapse-step-trigger');
  const islamicNote = getEl('relapse-islamic-note');

  if (confirm)     confirm.style.display     = 'block';
  if (trigger)     trigger.style.display     = 'none';
  if (islamicNote) islamicNote.style.display = ST.islamicMode ? 'block' : 'none';

  const modal = getEl('relapse-modal');
  if (modal) modal.style.display = 'flex';
}

function closeRelapseModal() {
  const modal = getEl('relapse-modal');
  if (modal) modal.style.display = 'none';
}

function relapseGoToTrigger() {
  const confirm = getEl('relapse-step-confirm');
  const trigger = getEl('relapse-step-trigger');
  const box     = getEl('relapse-trigger-box');

  if (confirm) confirm.style.display = 'none';
  if (trigger) trigger.style.display = 'block';
  if (box)     box.innerHTML         = buildTriggerSelector('রিল্যাপসের কারণ বেছে নাও', 'confirmRelapse');
}

function confirmRelapse(trigger) {
  ST.streak = 0;
  ST.relapseCount++;
  ST.triggerLog.unshift({ date: todayStr(), type: 'relapse', trigger: trigger || '' });
  if (ST.triggerLog.length > 50) ST.triggerLog.pop();
  saveState();
  checkAchievements();
  closeRelapseModal();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
// URGE WIN & TRIGGER LOGGING
// ═══════════════════════════════════════════════════════════════

function showUrgeTrigger() {
  const box = getEl('urge-trigger-box');
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML     = buildTriggerSelector('কারণ কী ছিল?', 'urgeWin');
}

function urgeWin(trigger) {
  ST.urgeCount++;
  ST.triggerLog.unshift({ date: todayStr(), type: 'urge', trigger: trigger || 'অজানা' });
  if (ST.triggerLog.length > 50) ST.triggerLog.pop();
  saveState();
  checkAchievements();

  // Hide trigger box
  const box = getEl('urge-trigger-box');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }

  // Update counters
  const winCount  = getEl('urge-win-count');
  const totalLbl  = getEl('urge-total-lbl');
  const dashUrges = getEl('dash-urges');
  if (winCount)  winCount.textContent  = ST.urgeCount;
  if (totalLbl)  totalLbl.textContent  = ST.urgeCount;
  if (dashUrges) dashUrges.textContent = ST.urgeCount;

  // Show win banner briefly
  const banner = getEl('urge-win-banner');
  if (banner) {
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 3000);
  }

  renderTriggerLog();
}

// ═══════════════════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════════════════

function toggleHabit(id) {
  const idx = ST.completedHabits.indexOf(id);
  if (idx >= 0)
    ST.completedHabits.splice(idx, 1);
  else
    ST.completedHabits.push(id);

  if (ST.completedHabits.length === HABITS.length) ST.allHabitsDay++;
  saveState();
  checkAchievements();
  renderHabits();
  renderDashboard();
}

function saveQuranProgress() {
  ST.quranSurah = (document.getElementById('qt-surah')?.value || '').trim();
  ST.quranAyah  = (document.getElementById('qt-ayah')?.value  || '').trim();
  ST.quranNote  = (document.getElementById('qt-note')?.value  || '').trim();
  ST.quranDate  = todayStr();
  saveState();
  renderQuranSaved();
}

// ═══════════════════════════════════════════════════════════════
// TASBIH
// ═══════════════════════════════════════════════════════════════

function tasbihClick(e) {
  const btn = getEl('tasbih-btn');
  if (!btn) return;

  // Ripple effect
  const rect   = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size   = Math.max(rect.width, rect.height);
  ripple.className = 'tasbih-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);

  // Update state
  ST.tasbihCount++;
  ST.tasbihTodayCount++;
  ST.tasbihTotal++;

  const target = TASBIH_TARGETS[(ST.tasbihSet - 1) % 3];
  if (ST.tasbihCount >= target) {
    ST.tasbihCount = 0;
    ST.tasbihSet   = ST.tasbihSet < 3 ? ST.tasbihSet + 1 : 1;
  }

  saveState();
  checkAchievements();
  updateTasbihUI();
}

function updateTasbihUI() {
  const countEl = getEl('tasbih-count');
  const dhikrEl = getEl('tasbih-dhikr-label');
  const setEl   = getEl('tasbih-set');
  const todayEl = getEl('tasbih-today');
  if (countEl) countEl.textContent = ST.tasbihCount;
  if (dhikrEl) dhikrEl.textContent = TASBIH_DHIKR[(ST.tasbihSet - 1) % 3];
  if (setEl)   setEl.textContent   = ST.tasbihSet;
  if (todayEl) todayEl.textContent = ST.tasbihTodayCount;
}

function resetTasbih() {
  ST.tasbihCount = 0;
  ST.tasbihSet   = 1;
  saveState();
  updateTasbihUI();
}

// ═══════════════════════════════════════════════════════════════
// DOPAMINE MENU
// ═══════════════════════════════════════════════════════════════

function getDopasuggestion() {
  const el = getEl('dopa-suggestion');
  if (el) el.textContent = DOPAMINE_MENU[Math.floor(Math.random() * DOPAMINE_MENU.length)];
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNTABILITY PARTNER
// ═══════════════════════════════════════════════════════════════

function openPartnerWA(e) {
  e.preventDefault();
  if (!ST.partnerPhone) { openPartnerModal(); return; }
  const msg = encodeURIComponent('ভাই, আমার এখন সাহায্য দরকার। আমি একটু কঠিন মুহূর্তে আছি। দোয়া করো। 🤲');
  window.open(`https://wa.me/${ST.partnerPhone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
}

function openPartnerMail(e) {
  e.preventDefault();
  if (!ST.partnerEmail) { openPartnerModal(); return; }
  const subject = encodeURIComponent('আমার এখন সাহায্য দরকার');
  const body    = encodeURIComponent('ভাই,\n\nআমি এখন একটু কঠিন মুহূর্তে আছি। দোয়া করো।\n\nজাযাকাল্লাহ খাইরান।');
  window.location.href = `mailto:${ST.partnerEmail}?subject=${subject}&body=${body}`;
}

function openPartnerModal() {
  _setValue('pm-phone', ST.partnerPhone || '');
  _setValue('pm-email', ST.partnerEmail || '');
  const modal = getEl('partner-modal');
  if (modal) modal.style.display = 'flex';
}

function savePartnerInfo() {
  ST.partnerPhone = (document.getElementById('partner-phone')?.value || '').trim();
  ST.partnerEmail = (document.getElementById('partner-email')?.value || '').trim();
  saveState();
  const msg = getEl('partner-saved-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
}

function savePartnerFromModal() {
  ST.partnerPhone = (document.getElementById('pm-phone')?.value || '').trim();
  ST.partnerEmail = (document.getElementById('pm-email')?.value || '').trim();
  saveState();
  const modal = getEl('partner-modal');
  if (modal) modal.style.display = 'none';
  // Sync settings tab inputs
  _setValue('partner-phone', ST.partnerPhone);
  _setValue('partner-email', ST.partnerEmail);
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS TOGGLES
// ═══════════════════════════════════════════════════════════════

function toggleIslamic() {
  ST.islamicMode = !ST.islamicMode;
  saveState();
  renderAll();
}

function toggleNotif() {
  ST.notifications = !ST.notifications;
  saveState();
  renderSettings();
}

function resetData() {
  if (confirm('সমস্ত তথ্য মুছে ফেলতে চাও? এটি ফেরত আসবে না।')) {
    localStorage.removeItem(LS_KEY);
    location.reload();
  }
}

// ── Private shorthand (mirrors render.js private helpers) ──────────────────
function _setValue(id, value) {
  const el = getEl(id);
  if (el) el.value = value;
}
