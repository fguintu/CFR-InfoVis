// sections/s1.js
import { med, fmt$, fmtPct, C, showTip, hideTip } from '../utils.js';

// Called from main.js after CSV loads, receives the parsed groups
export function initS1(groups) {
  const { cc, pub4, priv4, fp4, hbcus } = groups;

  // ── Section 1 ──
  const s1 = [
    { label: "Community College",  debt: med(cc.map(r => r._GRAD_DEBT_MDN)),    earn: med(cc.map(r => r._EP6)) },
    { label: "Public 4-Year",      debt: med(pub4.map(r => r._GRAD_DEBT_MDN)),  earn: med(pub4.map(r => r._EP6)) },
    { label: "Private Nonprofit",  debt: med(priv4.map(r => r._GRAD_DEBT_MDN)), earn: med(priv4.map(r => r._EP6)) },
    { label: "Private For-Profit", debt: med(fp4.map(r => r._GRAD_DEBT_MDN)),   earn: med(fp4.map(r => r._EP6)) },
    { label: "HBCU",               debt: med(hbcus.map(r => r._GRAD_DEBT_MDN)), earn: med(hbcus.map(r => r._EP6)) },
  ].filter(d => !isNaN(d.debt) && !isNaN(d.earn));

  const pv = s1.find(d => d.label === "Private Nonprofit"),
        pu = s1.find(d => d.label === "Public 4-Year"),
        hb = s1.find(d => d.label === "HBCU");
  if (pv && pu && hb)
    document.getElementById("callout1").textContent =
      `Community college graduates carry the least debt, but HBCU students take on ${fmt$(hb.debt)} — comparable to private nonprofits at ${fmt$(pv.debt)} — while earning ${fmt$(hb.earn)} vs ${fmt$(pv.earn)} six years out.`;

  drawS1(s1);
}

// ════════════════════════════════
// SECTION 1: Institution Type
// ════════════════════════════════
function drawS1(data) {
  const W = 600,
    H = 440,
    M = { t: 24, r: 24, b: 110, l: 58 },
    w = W - M.l - M.r,
    h = H - M.t - M.b;
  const svg = d3
    .select("#vis-institution")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("overflow", "visible");
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const x0 = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, w])
    .padding(0.3);
  const x1 = d3
    .scaleBand()
    .domain(["debt", "earn"])
    .range([0, x0.bandwidth()])
    .padding(0.1);
  const maxV = d3.max(data, (d) => Math.max(d.debt, d.earn)) * 1.15;
  const y = d3.scaleLinear().domain([0, maxV]).range([h, 0]);
  const xAx = g.append("g").attr("transform", `translate(0,${h})`);
  const yAx = g.append("g");

  function renderAxis() {
    xAx
      .call(d3.axisBottom(x0).tickSize(0))
      .select(".domain")
      .attr("stroke", C.axis);
    xAx
      .selectAll("text")
      .attr("fill", "#666")
      .style("font-size", "10px")
      .attr("dy", "1em");
  }

  function grouped() {
    y.domain([0, maxV]);
    yAx
      .transition()
      .duration(500)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `$${d / 1000}K`),
      );
    yAx.selectAll("text").attr("fill", "#666");
    yAx.select(".domain").attr("stroke", C.axis);
    renderAxis();
    g.selectAll(".rbar,.rlabel").remove();
    const grp = g.selectAll(".bg").data(data, (d) => d.label);
    const en = grp
      .enter()
      .append("g")
      .attr("class", "bg")
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);
    en.append("rect")
      .attr("class", "bd")
      .attr("x", x1("debt"))
      .attr("width", x1.bandwidth())
      .attr("rx", 2)
      .attr("fill", C.red)
      .attr("y", h)
      .attr("height", 0)
      .on("mouseover", (e, d) =>
        showTip(e, `<b>${d.label}</b><br>Median Grad Debt: ${fmt$(d.debt)}`),
      )
      .on("mouseout", hideTip);
    en.append("rect")
      .attr("class", "be")
      .attr("x", x1("earn"))
      .attr("width", x1.bandwidth())
      .attr("rx", 2)
      .attr("fill", C.blue)
      .attr("y", h)
      .attr("height", 0)
      .on("mouseover", (e, d) =>
        showTip(
          e,
          `<b>${d.label}</b><br>Median Earnings (6yr): ${fmt$(d.earn)}`,
        ),
      )
      .on("mouseout", hideTip);
    const mg = en.merge(grp);
    mg.select(".bd")
      .transition()
      .duration(600)
      .attr("y", (d) => y(d.debt))
      .attr("height", (d) => h - y(d.debt));
    mg.select(".be")
      .transition()
      .duration(600)
      .attr("y", (d) => y(d.earn))
      .attr("height", (d) => h - y(d.earn));
  }

  function ratio() {
    const rd = data.map((d) => ({ ...d, ratio: d.debt / d.earn }));
    const mx = d3.max(rd, (d) => d.ratio) * 1.2;
    y.domain([0, mx]);
    yAx
      .transition()
      .duration(500)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
    yAx.selectAll("text").attr("fill", "#666");
    g.selectAll(".bd,.be")
      .transition()
      .duration(300)
      .attr("height", 0)
      .attr("y", h);
    const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([mx, 0]);
    const bars = g.selectAll(".rbar").data(rd, (d) => d.label);
    bars
      .enter()
      .append("rect")
      .attr("class", "rbar")
      .attr("x", (d) => x0(d.label) + x0.bandwidth() * 0.15)
      .attr("width", x0.bandwidth() * 0.7)
      .attr("rx", 2)
      .attr("y", h)
      .attr("height", 0)
      .on("mouseover", (e, d) =>
        showTip(e, `<b>${d.label}</b><br>Debt/Earnings: ${fmtPct(d.ratio)}`),
      )
      .on("mouseout", hideTip)
      .merge(bars)
      .transition()
      .duration(600)
      .attr("y", (d) => y(d.ratio))
      .attr("height", (d) => h - y(d.ratio))
      .attr("fill", (d) => color(d.ratio));
    const lbl = g.selectAll(".rlabel").data(rd, (d) => d.label);
    lbl
      .enter()
      .append("text")
      .attr("class", "rlabel")
      .attr("x", (d) => x0(d.label) + x0.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "12px")
      .attr("font-weight", "700")
      .merge(lbl)
      .transition()
      .duration(600)
      .attr("y", (d) => y(d.ratio) - 6)
      .attr("opacity", 1)
      .tween("text", function (d) {
        const i = d3.interpolateNumber(0, d.ratio * 100);
        return (t) => {
          d3.select(this).text(i(t).toFixed(0) + "%");
        };
      });
  }

  grouped();
  d3.select("#inst-controls")
    .selectAll("button")
    .on("click", function () {
      d3.select("#inst-controls").selectAll("button").classed("active", false);
      d3.select(this).classed("active", true);
      d3.select(this).attr("data-view") === "grouped" ? grouped() : ratio();
    });
}