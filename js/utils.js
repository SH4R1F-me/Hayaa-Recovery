/**
 * utils.js — Small, reusable helper functions.
 * No side-effects; no DOM access; no state access.
 */

'use strict';

/**
 * Zero-pads a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Converts a CSS hex colour to an rgba() string.
 * Falls back to the app's primary accent colour on malformed input.
 * @param {string} hex  e.g. "#4ecca3" or "4ecca3"
 * @param {number} a    Alpha value 0-1
 * @returns {string}    e.g. "rgba(78,204,163,0.4)"
 */
function hexToRgba(hex, a) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`
    : `rgba(78,204,163,${a})`;
}

/**
 * Returns a safely-escaped version of a string for inline HTML attributes.
 * Used when building HTML strings that contain user-supplied content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely queries a DOM element; logs a warning if not found.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[Hayaa] Element #${id} not found in DOM.`);
  return el;
}
