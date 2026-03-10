/**
 * prayer.js — Fetches prayer times from the Aladhan API
 * and renders them in the prayer card.
 *
 * Uses the browser Geolocation API when available;
 * falls back to Dhaka, Bangladesh.
 */

'use strict';

// ── Public Entry Point ───────────────────────────────────────────────────────
/**
 * Called once on app init. Requests geolocation and fetches prayer times.
 */
function fetchPrayerTimes() {
  const statusEl = getEl('location-status');

  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = 'Geolocation সমর্থিত নয়। ঢাকার সময় দেখানো হচ্ছে।';
    _fetchByCity('Dhaka', 'Bangladesh');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => _onLocationSuccess(pos),
    ()  => _onLocationError(),
    { timeout: 8000 },
  );
}

// ── Private Helpers ──────────────────────────────────────────────────────────
function _onLocationSuccess(pos) {
  const statusEl = getEl('location-status');

  ST.userLat = pos.coords.latitude;
  ST.userLng = pos.coords.longitude;
  saveState();

  if (statusEl) {
    statusEl.textContent = `📍 অবস্থান পাওয়া গেছে: ${ST.userLat.toFixed(3)}, ${ST.userLng.toFixed(3)}`;
  }

  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${ST.userLat}&longitude=${ST.userLng}&method=1`;

  fetch(url)
    .then(r => r.json())
    .then(d => { if (d.code === 200) renderPrayerTimes(d.data.timings); })
    .catch(() => _fetchByCity('Dhaka', 'Bangladesh'));
}

function _onLocationError() {
  const statusEl = getEl('location-status');
  if (statusEl) statusEl.textContent = 'অবস্থান অ্যাক্সেস অস্বীকৃত। ঢাকার সময় দেখানো হচ্ছে।';
  _fetchByCity('Dhaka', 'Bangladesh');
}

function _fetchByCity(city, country) {
  const today   = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const url     = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=1`;

  fetch(url)
    .then(r => r.json())
    .then(d => { if (d.code === 200) renderPrayerTimes(d.data.timings); })
    .catch(() => { /* Silently fail — prayer card stays hidden or shows placeholder */ });
}

// ── Render ───────────────────────────────────────────────────────────────────
/**
 * Renders prayer times into the prayer card on the Dashboard tab.
 * @param {Object} timings  e.g. { Fajr: "05:12", Dhuhr: "12:30", ... }
 */
function renderPrayerTimes(timings) {
  const contentEl = getEl('prayer-content');
  const ntagEl    = getEl('next-prayer-tag');
  if (!contentEl) return;

  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Determine the next prayer (excluding Sunrise for notification purposes)
  let next = null;
  for (const key of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    const [h, m] = (timings[key] || '00:00').split(':').map(Number);
    if (h * 60 + m > nowMins) {
      next = { name: PRAYER_NAMES[key], time: timings[key] };
      break;
    }
  }
  // After Isha → wrap to Fajr
  if (!next) next = { name: PRAYER_NAMES['Fajr'], time: timings['Fajr'] };

  if (ntagEl) ntagEl.textContent = `পরবর্তী: ${next.name} ${next.time}`;

  // Build the prayer grid
  const cells = PRAYER_KEYS.map(key => {
    const isNext = PRAYER_NAMES[key] === next.name;
    return `
      <div class="prayer-cell${isNext ? ' next-prayer' : ''}">
        <div class="prayer-name">${PRAYER_NAMES[key] || key}</div>
        <div class="prayer-time">${timings[key] || '--:--'}</div>
      </div>`;
  }).join('');

  contentEl.innerHTML = `<div class="prayer-grid">${cells}</div>`;
}
