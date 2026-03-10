/**
 * api.js — AI-powered CBT thought reframing.
 *
 * ─────────────────────────────────────────────────────────────────
 * ARCHITECTURE NOTE (important for future developers):
 *
 * Calling the Anthropic API directly from the browser is NOT
 * recommended in production because it would expose your API key.
 *
 * The correct approach is:
 *   Browser → YOUR backend proxy (e.g. /api/cbt) → Anthropic API
 *
 * This file tries a local backend proxy endpoint first.
 * If that is not available (e.g. during development / static hosting),
 * it falls back to a rule-based offline CBT reframe so the feature
 * remains usable without a server.
 *
 * To wire up a real backend:
 *   1. Create a server endpoint at /api/cbt that accepts { thought: string }
 *   2. Have your server forward the request to Anthropic with your key
 *   3. The fallback will no longer be reached in production
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── Configuration ────────────────────────────────────────────────────────────
// Change this to your deployed backend URL in production.
const CBT_PROXY_ENDPOINT = '/api/cbt';

// ── Offline CBT Reframes ─────────────────────────────────────────────────────
// A set of rule-based, compassionate reframes used as a fallback.
const OFFLINE_REFRAMES = [
  thought =>
    `তুমি যা ভাবছ তা একটি অস্থায়ী অনুভূতি — এটি তোমার পরিচয় নয়। মস্তিষ্ক কঠিন মুহূর্তে ফাঁদ পাতে, কিন্তু তুমি এই চিন্তার বাইরে আরও শক্তিশালী। এই মুহূর্তটি কেটে যাবে। একটি গভীর শ্বাস নাও।`,
  thought =>
    `"${thought}" — এই চিন্তাটি সত্য মনে হলেও এটি শুধু একটি চিন্তা, বাস্তবতা নয়। তোমার মস্তিষ্ক অভ্যাসের কারণে এই পথে যাচ্ছে। তুমি এই মুহূর্তে একটি নতুন পথ বেছে নিতে পারো।`,
  thought =>
    `এই চিন্তার পেছনে হয়তো একাকীত্ব, ক্লান্তি বা চাপ আছে। নিজেকে প্রশ্ন করো: এই মুহূর্তে আমার আসল প্রয়োজন কী? বিশ্রাম? সংযোগ? সেই চাহিদা পূরণ করার স্বাস্থ্যকর উপায় খোঁজো।`,
  thought =>
    `গবেষণা বলে, ইচ্ছার তীব্রতা সর্বোচ্চ ৭ মিনিট স্থায়ী হয়। এই মুহূর্তে শুধু পরবর্তী ৭ মিনিট পার করো। তুমি প্রতিবার এটি করতে পারলে ধীরে ধীরে মস্তিষ্কের নিউরাল পাথওয়ে বদলে যাবে।`,
];

let _offlineIndex = 0;

/**
 * Gets an offline reframe for the given thought text.
 * Cycles through the reframes so each call feels fresh.
 * @param {string} thought
 * @returns {string}
 */
function getOfflineReframe(thought) {
  const fn = OFFLINE_REFRAMES[_offlineIndex % OFFLINE_REFRAMES.length];
  _offlineIndex++;
  return fn(thought);
}

// ── Main API Function ────────────────────────────────────────────────────────
/**
 * Runs CBT thought reframing.
 * Attempts the backend proxy; falls back gracefully to offline reframes.
 */
async function runCBT() {
  const input  = getEl('cbt-input');
  const btn    = getEl('cbt-btn');
  const result = getEl('cbt-result');
  const err    = getEl('cbt-error');

  if (!input || !input.value.trim()) return;

  const thought = input.value.trim();

  // ── Loading state ──
  btn.disabled    = true;
  btn.textContent = '⏳ বিশ্লেষণ হচ্ছে…';
  result.style.display = 'none';
  err.style.display    = 'none';

  try {
    const response = await fetch(CBT_PROXY_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ thought }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const text = data.result || data.text || '';
    if (!text) throw new Error('Empty response from server');

    result.textContent   = text;
    result.style.display = 'block';

  } catch (e) {
    // ── Graceful offline fallback ──
    console.info('[Hayaa] CBT proxy unavailable, using offline reframe:', e.message);

    result.textContent   = getOfflineReframe(thought);
    result.style.display = 'block';

    // Show a subtle, non-alarming notice (not an error)
    err.textContent   = '💡 অফলাইন মোডে চলছে — AI সংযোগের জন্য একটি ব্যাকএন্ড প্রক্সি প্রয়োজন।';
    err.style.display = 'block';
    err.style.color   = 'var(--muted)';
  }

  // ── Reset loading state ──
  btn.disabled    = false;
  btn.textContent = '🔄 চিন্তা পুনর্গঠন করো';
}
