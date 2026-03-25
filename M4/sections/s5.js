// sections/s4.js
import { fmt$, C, showTip, hideTip } from "../utils.js";

export function initS5(groups) {
  const { all: rows } = groups;

  // ── Section 5 ──
  const beeRaw = rows
    .filter(
      (r) =>
        !isNaN(r._GRAD_DEBT_MDN) &&
        !isNaN(r._EP6) &&
        r._EP6 > 0 &&
        !isNaN(r._UGDS) &&
        r._UGDS > 0,
    )
    .map((r) => ({
      name: r.INSTNM || "Unknown",
      control: r._CONTROL,
      hbcu: r._HBCU,
      ratio: r._GRAD_DEBT_MDN / r._EP6,
      ug: r._UGDS,
      debt: r._GRAD_DEBT_MDN,
      earn: r._EP6,
    }));
  const beeData = beeRaw.filter((d) => d.ratio > 0 && d.ratio < 3);
  const nP = beeData.filter((d) => d.control === 1).length,
    nN = beeData.filter((d) => d.control === 2).length,
    nF = beeData.filter((d) => d.control === 3).length,
    nH = beeData.filter((d) => d.hbcu === 1).length;
  document.getElementById("callout5").textContent =
    `Across ${beeData.length} institutions — ${nP} public, ${nN} private nonprofit, ${nF} for-profit, and ${nH} HBCUs — the landscape of debt-to-earnings ratios reveals who the current system truly serves.`;
  drawS5(beeData);
}

// ════════════════════════════════
// SECTION 5: Beeswarm
// ════════════════════════════════
function drawS5(data) {
  if (!data.length) return;
  const W = 640,
    H = 380,
    M = { t: 16, r: 16, b: 44, l: 16 },
    w = W - M.l - M.r,
    h = H - M.t - M.b;
  const svg = d3
    .select("#vis-beeswarm")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%");
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const xMax =
    d3.quantile(
      data.map((d) => d.ratio).sort((a, b) => a - b),
      0.95,
    ) || 1.5;
  const x = d3.scaleLinear().domain([0, xMax]).range([0, w]);
  const r = d3
    .scaleSqrt()
    .domain([
      0,
      d3.quantile(
        data.map((d) => d.ug).sort((a, b) => a - b),
        0.95,
      ) || 30000,
    ])
    .range([1.5, 8])
    .clamp(true);
  const colors = { 1: C.blue, 2: C.gold, 3: C.red };
  const typeL = { 1: "Public", 2: "Private Nonprofit", 3: "For-Profit" };

  g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".0%")))
    .selectAll("text")
    .attr("fill", "#666");
  g.select(".domain").attr("stroke", C.axis);
  g.append("text")
    .attr("x", w / 2)
    .attr("y", h + 36)
    .attr("text-anchor", "middle")
    .attr("fill", "#999")
    .attr("font-size", "10px")
    .text("Debt-to-Earnings Ratio");

  data.forEach((d) => {
    d.px = x(Math.min(d.ratio, xMax));
    d.py = h / 2 + (Math.random() - 0.5) * h * 0.78;
    d.pr = r(d.ug);
  });
  function gc(d) {
    return d.hbcu === 1 ? C.purple : colors[d.control] || "#999";
  }
  function gl(d) {
    return d.hbcu === 1 ? "HBCU" : typeL[d.control] || "Unknown";
  }

  const circles = g
    .selectAll(".bee-circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "bee-circle")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", 0)
    .attr("fill", (d) => gc(d))
    .attr("opacity", 0.55)
    .on("mouseover", function (e, d) {
      d3.select(this)
        .attr("opacity", 1)
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5);
      showTip(
        e,
        `<b>${d.name}</b><br>Type: ${gl(d)}<br>Debt/Earnings: ${fmtPct(d.ratio)}<br>Debt: ${fmt$(d.debt)}<br>Earnings: ${fmt$(d.earn)}<br>Enrollment: ${Math.round(d.ug).toLocaleString()}`,
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 0.55).attr("stroke", "none");
      hideTip();
    });

  let animated = false;
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        circles
          .transition()
          .duration(600)
          .delay(() => Math.random() * 400)
          .attr("r", (d) => d.pr);
      }
    },
    { threshold: 0.25 },
  );
  obs.observe(document.getElementById("sec5"));

  d3.select("#bee-controls")
    .selectAll("button")
    .on("click", function () {
      d3.select("#bee-controls").selectAll("button").classed("active", false);
      d3.select(this).classed("active", true);
      const f = d3.select(this).attr("data-filter");
      circles
        .transition()
        .duration(350)
        .attr("opacity", (d) => {
          if (f === "all") return 0.55;
          if (f === "hbcu") return d.hbcu === 1 ? 0.7 : 0.04;
          return d.control === +f ? 0.7 : 0.04;
        })
        .attr("r", (d) => {
          if (f === "all") return d.pr;
          if (f === "hbcu") return d.hbcu === 1 ? d.pr : d.pr * 0.3;
          return d.control === +f ? d.pr : d.pr * 0.3;
        });
    });
}
