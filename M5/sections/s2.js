// sections/s2.js
import { med, fmt$, C, showTip, hideTip } from "../utils.js";

export function initS2(groups) {
  const { all: rows } = groups;

  // ── Section 2 ──
  const s2 = [];
  for (let yr = 6; yr <= 10; yr++) {
    const m = med(rows.map((r) => r[`_EM${yr}`])),
      f = med(rows.map((r) => r[`_EF${yr}`]));
    if (!isNaN(m) && !isNaN(f)) s2.push({ yr, male: m, female: f });
  }
  if (s2.length) {
    const last = s2[s2.length - 1];
    const cents = ((last.female / last.male) * 100).toFixed(1);
    document.getElementById("callout2").textContent =
      `Female graduates earn approximately ${cents} cents for every dollar their male peers make. By ${last.yr} years out, women earn ${fmt$(last.female)} vs ${fmt$(last.male)} for men — a gap of ${fmt$(last.male - last.female)} annually.`;
  }
  drawS2(s2);
}

// ════════════════════════════════
// SECTION 2: Gender Earnings
// ════════════════════════════════
function drawS2(data) {
  if (!data.length) return;
  const W = 600,
    H = 360,
    M = { t: 24, r: 50, b: 44, l: 58 },
    w = W - M.l - M.r,
    h = H - M.t - M.b;
  const svg = d3
    .select("#vis-gender")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("overflow", "visible");
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.yr))
    .range([0, w]);
  const yA = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.male) * 1.15])
    .range([h, 0]);
  const ratioData = data.map((d) => ({ yr: d.yr, ratio: d.female / d.male }));
  const yR = d3.scaleLinear().domain([0, 1.1]).range([h, 0]);
  const xG = g.append("g").attr("transform", `translate(0,${h})`);
  const yG = g.append("g");
  const lG = g.append("g");

  function absolute() {
    xG.transition()
      .duration(400)
      .call(
        d3
          .axisBottom(x)
          .ticks(data.length)
          .tickFormat((d) => d + " yr"),
      );
    yG.transition()
      .duration(400)
      .call(
        d3
          .axisLeft(yA)
          .ticks(5)
          .tickFormat((d) => `$${d / 1000}K`),
      );
    [xG, yG].forEach((a) => {
      a.selectAll("text").attr("fill", "#666");
      a.select(".domain").attr("stroke", C.axis);
    });
    lG.selectAll("*").remove();
    const area = d3
      .area()
      .x((d) => x(d.yr))
      .y0((d) => yA(d.female))
      .y1((d) => yA(d.male))
      .curve(d3.curveMonotoneX);
    lG.append("path")
      .datum(data)
      .attr("d", area)
      .attr("fill", "rgba(179,51,51,.08)");
    lG.append("path")
      .datum(data)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.yr))
          .y((d) => yA(d.male))
          .curve(d3.curveMonotoneX),
      )
      .attr("fill", "none")
      .attr("stroke", C.blue)
      .attr("stroke-width", 2.5);
    lG.append("path")
      .datum(data)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.yr))
          .y((d) => yA(d.female))
          .curve(d3.curveMonotoneX),
      )
      .attr("fill", "none")
      .attr("stroke", C.red)
      .attr("stroke-width", 2.5);
    data.forEach((d) => {
      const tt = (e) =>
        showTip(
          e,
          `<b>${d.yr} Years Post-Entry</b><br>Men: ${fmt$(d.male)}<br>Women: ${fmt$(d.female)}<br>Gap: ${fmt$(d.male - d.female)}`,
        );
      lG.append("circle")
        .attr("cx", x(d.yr))
        .attr("cy", yA(d.male))
        .attr("r", 4)
        .attr("fill", C.blue)
        .attr("stroke", C.bg)
        .attr("stroke-width", 2)
        .on("mouseover", tt)
        .on("mouseout", hideTip);
      lG.append("circle")
        .attr("cx", x(d.yr))
        .attr("cy", yA(d.female))
        .attr("r", 4)
        .attr("fill", C.red)
        .attr("stroke", C.bg)
        .attr("stroke-width", 2)
        .on("mouseover", tt)
        .on("mouseout", hideTip);
    });
    const l = data[data.length - 1];
    lG.append("line")
      .attr("x1", x(l.yr) + 10)
      .attr("x2", x(l.yr) + 10)
      .attr("y1", yA(l.male))
      .attr("y2", yA(l.female))
      .attr("stroke", C.red)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    lG.append("text")
      .attr("x", x(l.yr) + 16)
      .attr("y", (yA(l.male) + yA(l.female)) / 2 + 4)
      .attr("fill", C.red)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(`${fmt$(l.male - l.female)} gap`);
    lG.append("text")
      .attr("x", w + 6)
      .attr("y", yA(l.male) + 4)
      .attr("fill", C.blue)
      .attr("font-size", "11px")
      .text("Men");
    lG.append("text")
      .attr("x", w + 6)
      .attr("y", yA(l.female) + 4)
      .attr("fill", C.red)
      .attr("font-size", "11px")
      .text("Women");
  }

  function ratioView() {
    xG.transition()
      .duration(400)
      .call(
        d3
          .axisBottom(x)
          .ticks(data.length)
          .tickFormat((d) => d + " yr"),
      );
    yG.transition()
      .duration(400)
      .call(
        d3
          .axisLeft(yR)
          .ticks(5)
          .tickFormat((d) => `$${d.toFixed(2)}`),
      );
    [xG, yG].forEach((a) => {
      a.selectAll("text").attr("fill", "#666");
      a.select(".domain").attr("stroke", C.axis);
    });
    lG.selectAll("*").remove();
    lG.append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", yR(1))
      .attr("y2", yR(1))
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "5,4");
    lG.append("text")
      .attr("x", w - 4)
      .attr("y", yR(1) - 7)
      .attr("text-anchor", "end")
      .attr("fill", "#999")
      .attr("font-size", "10px")
      .text("$1.00 = parity");
    lG.append("path")
      .datum(ratioData)
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.yr))
          .y((d) => yR(d.ratio))
          .curve(d3.curveMonotoneX),
      )
      .attr("fill", "none")
      .attr("stroke", C.gold)
      .attr("stroke-width", 2.5);
    ratioData.forEach((d) => {
      lG.append("circle")
        .attr("cx", x(d.yr))
        .attr("cy", yR(d.ratio))
        .attr("r", 5)
        .attr("fill", C.gold)
        .attr("stroke", C.bg)
        .attr("stroke-width", 2)
        .on("mouseover", (e) =>
          showTip(
            e,
            `<b>${d.yr} Yrs Post-Entry</b><br>Women earn $${d.ratio.toFixed(2)} per $1 men earn`,
          ),
        )
        .on("mouseout", hideTip);
    });
  }

  absolute();
  d3.select("#gender-controls")
    .selectAll("button")
    .on("click", function () {
      d3.select("#gender-controls")
        .selectAll("button")
        .classed("active", false);
      d3.select(this).classed("active", true);
      d3.select(this).attr("data-view") === "absolute"
        ? absolute()
        : ratioView();
    });
}
