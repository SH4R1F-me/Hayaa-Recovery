/**
 * state.js — Single source of truth for all app state.
 * Handles persistence via localStorage and the daily reset logic.
 *
 * Exports (via global): ST, loadState, saveState, doDailyReset, todayStr
 */

'use strict';

// ── Default State Factory ──────────────────────────────────────────────────
function defaultState() {
  return {
    // Streak tracking
    streak:             0,
    longestStreak:      0,
    totalDays:          0,
    relapseCount:       0,
    lastActiveDate:     null,

    // Daily flags (reset each day)
    pledgeDoneToday:    false,
    morningPledgeShown: false,
    completedHabits:    [],
    todayMood:          null,
    tasbihCount:        0,
    tasbihSet:          1,
    tasbihTodayCount:   0,

    // Cumulative counters
    urgeCount:          0,
    allHabitsDay:       0,
    pledgeCount:        0,
    tasbihTotal:        0,

    // Weekly mood log (7 entries, index 0 = oldest)
    moodLog: [null, null, null, null, null, null, null],

    // Settings
    islamicMode:        false,
    notifications:      true,

    // User data
    triggerLog:         [],        // [{date, type, trigger}]
    earnedAchievements: [],

    // Rotating content indices
    quoteIdx:           Math.floor(Math.random() * MOTIVATIONAL.length),
    verseIdx:           Math.floor(Math.random() * ISLAMIC_VERSES.length),

    // Personal content
    letterToSelf:       '',

    // Quran tracker
    quranSurah:         '',
    quranAyah:          '',
    quranNote:          '',
    quranDate:          '',

    // Accountability partner
    partnerPhone:       '',
    partnerEmail:       '',

    // Geolocation (for prayer times)
    userLat:            null,
    userLng:            null,
  };
}

// ── Persistence ─────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    // Merge saved data onto defaults so new fields always exist
    return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
  } catch (e) {
    console.warn('[Hayaa] Could not load state from localStorage:', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ST));
  } catch (e) {
    console.warn('[Hayaa] Could not save state to localStorage:', e);
  }
}

// ── Date Utilities ───────────────────────────────────────────────────────────
/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Daily Reset ──────────────────────────────────────────────────────────────
/**
 * Called once on app load. If the stored lastActiveDate is not today,
 * runs the new-day logic: updates streak, resets daily fields.
 */
function doDailyReset() {
  const today     = todayStr();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Already ran today — nothing to do
  if (ST.lastActiveDate === today) return;

  // Update streak
  if (ST.lastActiveDate === yesterday) {
    ST.streak += 1;
  } else if (ST.lastActiveDate) {
    // Missed at least one day — reset streak
    ST.streak = 0;
  }
  // (If lastActiveDate is null this is a brand-new user — keep streak as-is)

  ST.longestStreak = Math.max(ST.longestStreak, ST.streak);

  // Only increment totalDays after at least one real day has passed
  if (ST.lastActiveDate) ST.totalDays++;

  ST.lastActiveDate = today;

  // ── Reset per-day fields ──
  ST.completedHabits    = [];
  ST.todayMood          = null;
  ST.pledgeDoneToday    = false;
  ST.morningPledgeShown = false;
  ST.tasbihCount        = 0;
  ST.tasbihSet          = 1;
  ST.tasbihTodayCount   = 0;

  // Shift mood log: drop oldest entry, push null for today
  const newLog = [...(ST.moodLog || [null, null, null, null, null, null, null])];
  newLog.shift();
  newLog.push(null);
  ST.moodLog = newLog;

  saveState();
}

// ── Initialise Global State ──────────────────────────────────────────────────
// Declared as `let` so it can be mutated in place throughout the app.
// eslint-disable-next-line no-var
let ST = loadState();
