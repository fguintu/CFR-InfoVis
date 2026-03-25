// sections/s3.js
import { med, fmtPct, C, showTip, hideTip } from "../utils.js";

const raceSpec = [
  { r: "White", k: "_C150_WHITE", c: C.blue },
  { r: "Black", k: "_C150_BLACK", c: C.red },
  { r: "Hispanic", k: "_C150_HISP", c: C.gold },
  { r: "Asian", k: "_C150_ASIAN", c: C.green },
  { r: "AIAN", k: "_C150_AIAN", c: C.orange },
  { r: "NHPI", k: "_C150_NHPI", c: C.teal },
  { r: "Two+", k: "_C150_2MOR", c: C.purple },
];

export function initS3(groups) {
  const { fy } = groups;

  const s3 = raceSpec
    .map((s) => ({ race: s.r, rate: med(fy.map((r) => r[s.k])), color: s.c }))
    .filter((d) => !isNaN(d.rate));

  if (s3.length >= 2) {
    const best = s3.reduce((a, b) => (a.rate > b.rate ? a : b)),
      worst = s3.reduce((a, b) => (a.rate < b.rate ? a : b));
    document.getElementById("callout3").textContent =
      `${best.race} students complete at ${fmtPct(best.rate)}, while ${worst.race} students complete at ${fmtPct(worst.rate)} — the same enrollment does not guarantee the same outcome.`;
  }
  drawS3(s3);
}

// ════════════════════════════════
// SECTION 3: Completion
// ════════════════════════════════
function drawS3(data) {
  if (!data.length) return;
  const W = 600,
    H = 380,
    M = { t: 16, r: 16, b: 44, l: 50 },
    w = W - M.l - M.r,
    h = H - M.t - M.b;
  const svg = d3
    .select("#vis-completion")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%");
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.race))
    .range([0, w])
    .padding(0.28);
  const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);
  g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll("text")
    .attr("fill", "#666")
    .style("font-size", "11px");
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
    .selectAll("text")
    .attr("fill", "#666");
  g.selectAll(".domain").attr("stroke", C.axis);
  y.ticks(5).forEach((t) => {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", y(t))
      .attr("y2", y(t))
      .attr("stroke", C.grid)
      .attr("stroke-dasharray", "2,3");
  });

  let animated = false;
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        g.selectAll(".cb")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "cb")
          .attr("x", (d) => x(d.race))
          .attr("width", x.bandwidth())
          .attr("y", h)
          .attr("height", 0)
          .attr("fill", (d) => d.color)
          .attr("rx", 2)
          .attr("opacity", 0.82)
          .on("mouseover", function (e, d) {
            d3.select(this).attr("opacity", 1);
            showTip(
              e,
              `<b>${d.race}</b><br>150% Completion: ${fmtPct(d.rate)}`,
            );
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", 0.82);
            hideTip();
          })
          .transition()
          .duration(700)
          .delay((_, i) => i * 80)
          .attr("y", (d) => y(d.rate))
          .attr("height", (d) => h - y(d.rate));
        g.selectAll(".cl")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "cl")
          .attr("x", (d) => x(d.race) + x.bandwidth() / 2)
          .attr("y", (d) => y(d.rate) - 6)
          .attr("text-anchor", "middle")
          .attr("fill", "#333")
          .attr("font-size", "12px")
          .attr("font-weight", "600")
          .attr("opacity", 0)
          .text((d) => fmtPct(d.rate))
          .transition()
          .duration(500)
          .delay((_, i) => i * 80 + 500)
          .attr("opacity", 1);
      }
    },
    { threshold: 0.3 },
  );
  obs.observe(document.getElementById("sec3"));
}
