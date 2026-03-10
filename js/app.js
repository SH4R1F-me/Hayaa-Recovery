/**
 * app.js — Application entry point.
 *
 * Responsibilities:
 *  1. Tab navigation (switchTab / renderAll)
 *  2. App initialisation (runs once on page load)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════

let currentTab = 'dashboard';

/**
 * Switches the visible tab panel and updates the bottom nav.
 * Triggers lazy rendering for tabs that need it.
 * @param {string} tab  One of: dashboard | urge | habits | progress | settings
 */
function switchTab(tab) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  // Deactivate all nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  // Activate the selected panel (with re-triggered fade animation)
  const panel = getEl(`tab-${tab}`);
  if (panel) {
    panel.classList.add('active');
    panel.classList.remove('fadeUp');
    void panel.offsetWidth; // force reflow to restart animation
    panel.classList.add('fadeUp');
  }

  // Activate the selected nav button
  const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');

  currentTab = tab;

  // Lazy-render tabs on first visit / each visit
  if (tab === 'progress') renderProgress();
  if (tab === 'habits')   renderHabits();
  if (tab === 'urge')     renderUrgeTab();
}

// ═══════════════════════════════════════════════════════════════
// FULL RE-RENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Re-renders all visible UI. Called after state changes that affect
 * multiple tabs simultaneously (e.g. toggling Islamic mode, relapse).
 */
function renderAll() {
  renderHeader();
  renderDashboard();
  renderSettings();

  // Only re-render the currently visible tab's content
  if (currentTab === 'habits')   renderHabits();
  if (currentTab === 'progress') renderProgress();
  if (currentTab === 'urge')     renderUrgeTab();

  updateTasbihUI();
}

// ═══════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════

(function init() {
  // 1. Run daily reset (may update streak, clear daily fields)
  doDailyReset();

  // 2. Render the full initial UI
  renderAll();

  // 3. Navigate to the default tab
  switchTab('dashboard');

  // 4. Kick off async operations
  fetchPrayerTimes();
  checkMorningPledge();
  getDopasuggestion();
})();
