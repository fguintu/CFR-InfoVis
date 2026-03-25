// sections/s4.js
import { med, fmt$, C, showTip, hideTip } from "../utils.js";

export function initS4(groups) {
  const { all: rows } = groups;

  // ── Section 4 ──
  const ep6All = med(rows.map((r) => r._EP6));
  function estYr(col) {
    const d = med(rows.map((r) => r[col]));
    return !isNaN(d) && !isNaN(ep6All) && ep6All > 0 ? d / (ep6All * 0.1) : NaN;
  }
  const s4 = [
    {
      id: "A",
      label: "High Income",
      color: C.blue,
      debt: med(rows.map((r) => r._HI_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYr("_HI_INC_DEBT_MDN"),
    },
    {
      id: "B",
      label: "Middle Income",
      color: C.gold,
      debt: med(rows.map((r) => r._MD_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYr("_MD_INC_DEBT_MDN"),
    },
    {
      id: "C",
      label: "Low Income",
      color: C.red,
      debt: med(rows.map((r) => r._LO_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYr("_LO_INC_DEBT_MDN"),
    },
    {
      id: "D",
      label: "First-Gen",
      color: C.purple,
      debt: med(rows.map((r) => r._FIRSTGEN_DEBT_MDN)),
      earn: ep6All,
      years: estYr("_FIRSTGEN_DEBT_MDN"),
    },
  ].filter((d) => !isNaN(d.years));

  if (s4.length) {
    const fast = s4.reduce((a, b) => (a.years < b.years ? a : b)),
      slow = s4.reduce((a, b) => (a.years > b.years ? a : b));
    document.getElementById("callout4").textContent =
      `${fast.label} graduates could be debt-free in ~${fast.years.toFixed(0)} years. ${slow.label} borrowers face ~${slow.years.toFixed(0)} years — delaying homeownership, retirement savings, and wealth-building for over a decade longer.`;
  }
  drawS4(s4);
}

// ════════════════════════════════
// SECTION 4: Racetrack (WIP)
// ════════════════════════════════
function drawS4(data) {
  if (!data.length) return;
  const W = 600,
    H = 440,
    cx = W / 2,
    cy = H / 2;
  const svg = d3
    .select("#vis-racetrack")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%");
  const maxY = d3.max(data, (d) => d.years) * 1.3;
  const ts = d3.scaleLinear().domain([0, maxY]).range([55, 190]);

  svg
    .append("text")
    .attr("x", cx)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("fill", "#ccc")
    .attr("font-size", "10px")
    .attr("font-family", "Helvetica,Arial,sans-serif")
    .attr("letter-spacing", "2px")
    .text("PLACEHOLDER — HAND-DRAWN VERSION IN PROGRESS");

  for (let i = 0; i <= maxY; i += 4) {
    svg
      .append("ellipse")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("rx", ts(i) * 1.4)
      .attr("ry", ts(i))
      .attr("fill", "none")
      .attr("stroke", "#e5e0d8")
      .attr("stroke-width", 1);
  }
  svg
    .append("line")
    .attr("x1", cx)
    .attr("x2", cx)
    .attr("y1", cy - 50)
    .attr("y2", cy + 50)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5,4");
  svg
    .append("text")
    .attr("x", cx)
    .attr("y", cy - 56)
    .attr("text-anchor", "middle")
    .attr("fill", "#999")
    .attr("font-size", "9px")
    .attr("font-family", "Helvetica,Arial,sans-serif")
    .attr("letter-spacing", "1px")
    .text("FINISH: DEBT FREE");

  const angles = data.map((_, i) => -0.3 - i * 0.85);
  data.forEach((d, i) => {
    const rx = ts(d.years) * 1.4,
      ry = ts(d.years),
      a = angles[i];
    const px = cx + rx * Math.cos(a),
      py = cy + ry * Math.sin(a);
    const car = svg
      .append("g")
      .attr("class", "car-group")
      .attr("transform", `translate(${px},${py})`)
      .on("mouseover", (e) =>
        showTip(
          e,
          `<b>${d.label}</b><br>Median Debt: ${fmt$(d.debt)}<br>Median Earnings (6yr): ${fmt$(d.earn)}<br>Est. Years to Repay: ~${d.years.toFixed(1)}`,
        ),
      )
      .on("mouseout", hideTip);
    car
      .append("rect")
      .attr("class", "car-body")
      .attr("x", -16)
      .attr("y", -9)
      .attr("width", 32)
      .attr("height", 18)
      .attr("rx", 7)
      .attr("fill", d.color)
      .attr("opacity", 0.85);
    car
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 4)
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .text(d.id);
    const lY = py < cy ? -22 : 26;
    car
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", lY)
      .attr("fill", d.color)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text(d.label);
    car
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", lY + 13)
      .attr("fill", "#999")
      .attr("font-size", "9px")
      .text(`~${d.years.toFixed(0)} yrs`);
  });
  svg
    .append("text")
    .attr("x", cx)
    .attr("y", cy + 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#bbb")
    .attr("font-size", "9px")
    .text("Closer = Faster");
}
