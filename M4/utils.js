// ════════════════════════════════════════════════════════════
// utils.js
// Shared constants, number helpers, tooltip, and scroll-reveal.
// ════════════════════════════════════════════════════════════

// ── Color palette ────────────────────────────────────────────
// One place to change any color and have it update across all charts.
export const C = {
  red: "#b33",
  blue: "#2a6496",
  gold: "#b8860b",
  green: "#3a7d44",
  orange: "#c4651a",
  teal: "#2a7b7b",
  purple: "#6a3d9a",
  slate: "#5a5a5a",
  axis: "#bbb",
  grid: "#e8e4dc",
  bg: "#faf8f4",
};

// ── Number helpers ────────────────────────────────────────────
// safeNum: converts a CSV cell to a number, or NaN if missing/suppressed.
export function safeNum(v) {
  if (
    v == null ||
    v === "" ||
    v === "PS" ||
    v === "PrivacySuppressed" ||
    v === "NULL"
  )
    return NaN;
  const n = +v;
  return isNaN(n) ? NaN : n;
}

// med: median of an array, ignoring NaN values.
export function med(arr) {
  const s = arr.filter((v) => !isNaN(v)).sort((a, b) => a - b);
  if (!s.length) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// fmt$: format a number as a dollar amount. e.g. 32000 → "$32,000"
export function fmt$(v) {
  return "$" + Math.round(v).toLocaleString();
}

// fmtPct: format a 0–1 ratio as a percentage. e.g. 0.654 → "65.4%"
export function fmtPct(v) {
  return (v * 100).toFixed(1) + "%";
}

// ── Tooltip ───────────────────────────────────────────────────
// One floating tooltip div shared by all charts.
let _tip = null;

export function initTooltip() {
  _tip = document.getElementById("tooltip");
}

export function showTip(evt, html) {
  if (!_tip) return;
  _tip.innerHTML = html;
  _tip.style.opacity = "1";
  _tip.style.left = evt.clientX + 12 + "px";
  _tip.style.top = evt.clientY - 8 + "px";
}

export function hideTip() {
  if (_tip) _tip.style.opacity = "0";
}

// ── Scroll-reveal ─────────────────────────────────────────────
// Watches all .reveal elements; adds .visible when they scroll into view.
export function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
}
