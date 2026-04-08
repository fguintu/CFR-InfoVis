// sections/s1.js
import { med, fmt$, fmtPct, C, showTip, hideTip } from "../utils.js";

// ════════════════════════════════════════════
// SECTION 1: Debt / Income by Institution Type
// ════════════════════════════════════════════

export function initS1(groups) {
  const { cc, pub4, priv4, fp4, hbcus } = groups;

  const groupMap = [
    { id: "cc", label: "Community College", rows: cc },
    { id: "pub4", label: "Public 4-Year", rows: pub4 },
    { id: "priv4", label: "Private Nonprofit", rows: priv4 },
    { id: "fp4", label: "Private For-Profit", rows: fp4 },
    { id: "hbcu", label: "HBCU", rows: hbcus },
  ];

  const debtMetricEl = document.getElementById("s1-debtMetric");
  const earnYearEl = document.getElementById("s1-earnYear");
  const yearLabelEl = document.getElementById("s1-yearLabel");

  const state = {
    view: "grouped",
    debtMetric: debtMetricEl ? debtMetricEl.value : "grad",
    earnYear: earnYearEl ? +earnYearEl.value : 6,
    pinned: null,
  };

  // ── Helpers ──

  function debtAccessor(metric) {
    const map = {
      lo: (r) => r._LO_INC_DEBT_MDN,
      md: (r) => r._MD_INC_DEBT_MDN,
      hi: (r) => r._HI_INC_DEBT_MDN,
      firstgen: (r) => r._FIRSTGEN_DEBT_MDN,
    };
    return map[metric] || ((r) => r._GRAD_DEBT_MDN);
  }

  function debtMetricLabel(metric) {
    const labels = {
      lo: "low-income debt",
      md: "middle-income debt",
      hi: "high-income debt",
      firstgen: "first-gen debt",
    };
    return labels[metric] || "median grad debt";
  }

  function computeData() {
    const getDebt = debtAccessor(state.debtMetric);
    const earnKey = `_EP${state.earnYear}`;
    return groupMap
      .map((g) => ({
        id: g.id,
        label: g.label,
        debt: med(g.rows.map(getDebt)),
        earn: med(g.rows.map((r) => r[earnKey])),
      }))
      .filter(
        (d) => !isNaN(d.debt) && !isNaN(d.earn) && d.earn > 0 && d.debt >= 0,
      );
  }

  function updateCallout(data) {
    const el = document.getElementById("callout1");
    const pv = data.find((d) => d.label === "Private Nonprofit");
    const hb = data.find((d) => d.label === "HBCU");
    const ccD = data.find((d) => d.label === "Community College");

    if (!el || !pv || !hb || !ccD) return;

    const pinned = state.pinned && data.find((d) => d.label === state.pinned);
    const metric = debtMetricLabel(state.debtMetric);
    const yr = state.earnYear;

    if (pinned) {
      el.textContent =
        `${pinned.label} at year ${yr}: ${metric} is ${fmt$(pinned.debt)} and median earnings ` +
        `are ${fmt$(pinned.earn)}. Debt to earnings ratio is ${fmtPct(pinned.debt / pinned.earn)}. ` +
        `Selection is pinned from the chart.`;
      return;
    }

    el.textContent =
      `At year ${yr}, community college graduates show the lowest ${metric} at ${fmt$(ccD.debt)}. ` +
      `HBCU students carry ${fmt$(hb.debt)}, comparable to private nonprofits at ${fmt$(pv.debt)}, ` +
      `but earn ${fmt$(hb.earn)} versus ${fmt$(pv.earn)}.`;
  }

  // ── Legend visibility ──

  document.getElementById("btn-debt").addEventListener("click", () => {
    document.getElementById("part1-legend").style.opacity = "1";
  });

  document.getElementById("btn-ratio").addEventListener("click", () => {
    document.getElementById("part1-legend").style.opacity = "0";
  });

  // ── Init chart ──

  const api = drawS1(() => state, computeData);
  updateCallout(computeData());

  // ── Control wiring ──

  if (earnYearEl && yearLabelEl) {
    yearLabelEl.textContent = String(state.earnYear);
    earnYearEl.addEventListener("input", () => {
      state.earnYear = +earnYearEl.value;
      yearLabelEl.textContent = String(state.earnYear);
      api.update();
      updateCallout(computeData());
    });
  }

  if (debtMetricEl) {
    debtMetricEl.addEventListener("change", () => {
      state.debtMetric = debtMetricEl.value;
      api.update();
      updateCallout(computeData());
    });
  }

  d3.select("#inst-controls")
    .selectAll("button")
    .on("click", function () {
      d3.select("#inst-controls").selectAll("button").classed("active", false);
      d3.select(this).classed("active", true);
      state.view =
        d3.select(this).attr("data-view") === "grouped" ? "grouped" : "ratio";
      api.update();
    });

  api.onPin((label) => {
    state.pinned = label;
    updateCallout(computeData());
  });
}

// ── Chart ──

function drawS1(getState, getData) {
  const W = 600,
    H = 260;
  const M = { t: 16, r: 16, b: 44, l: 16 };
  const w = W - M.l - M.r;
  const h = H - M.t - M.b;

  const svg = d3
    .select("#vis-institution")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("overflow", "visible");

  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const x0 = d3.scaleBand().range([0, w]).padding(0.3);
  const x1 = d3
    .scaleBand()
    .domain(["debt", "earn"])
    .range([0, x0.bandwidth()])
    .padding(0.1);
  const y = d3.scaleLinear().range([h, 0]);
  const xAx = g.append("g").attr("transform", `translate(0,${h})`);
  const yAx = g.append("g");

  let pinned = null;
  let pinCb = () => {};

   // ── Subtle gridlines ──
  y.ticks(5).forEach((t) => {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", y(t))
      .attr("y2", y(t))
      .attr("stroke", "#e0dcd5")
      .attr("stroke-dasharray", "1,2")
      .attr("opacity", 0.6);
  });

  // ── Zero-line emphasis ──
  g.append("line")
    .attr("x1", 0)
    .attr("x2", w)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#c5bfb3")
    .attr("stroke-width", 1);

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

  function applyPinStyles() {
    const all = g.selectAll(".bg");
    all.classed("is-pinned", (d) => pinned && d.label === pinned);
    all.classed("is-dimmed", (d) => pinned && d.label !== pinned);
    all
      .selectAll("rect")
      .attr("opacity", (d) => (pinned ? (d.label === pinned ? 1 : 0.25) : 1));
    g.selectAll(".rbar").attr("opacity", (d) =>
      pinned ? (d.label === pinned ? 1 : 0.25) : 1,
    );
    g.selectAll(".rlabel").attr("opacity", (d) =>
      pinned ? (d.label === pinned ? 1 : 0.2) : 1,
    );
  }

  function grouped(data) {
    const maxV = d3.max(data, (d) => Math.max(d.debt, d.earn)) * 1.15;
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

    const tipHtml = (d) =>
      `<b>${d.label}</b><br>Debt: ${fmt$(d.debt)}<br>Earnings: ${fmt$(d.earn)}<br>Debt/Earnings: ${fmtPct(d.debt / d.earn)}`;

    const grp = g.selectAll(".bg").data(data, (d) => d.label);

    const en = grp
      .enter()
      .append("g")
      .attr("class", "bg")
      .attr("transform", (d) => `translate(${x0(d.label)},0)`)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        pinned = pinned === d.label ? null : d.label;
        applyPinStyles();
        pinCb(pinned);
      });

    en.append("rect")
      .attr("class", "bd")
      .attr("x", x1("debt"))
      .attr("width", x1.bandwidth())
      .attr("rx", 2)
      .attr("fill", C.red)
      .attr("y", h)
      .attr("height", 0)
      .on("mouseover", (e, d) => showTip(e, tipHtml(d)))
      .on("mouseout", hideTip);

    en.append("rect")
      .attr("class", "be")
      .attr("x", x1("earn"))
      .attr("width", x1.bandwidth())
      .attr("rx", 2)
      .attr("fill", C.blue)
      .attr("y", h)
      .attr("height", 0)
      .on("mouseover", (e, d) => showTip(e, tipHtml(d)))
      .on("mouseout", hideTip);

    const mg = en.merge(grp);
    mg.transition()
      .duration(350)
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);
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

    grp.exit().remove();
    applyPinStyles();
  }

  function ratio(data) {
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
      .style("cursor", "pointer")
      .on("mouseover", (e, d) =>
        showTip(
          e,
          `<b>${d.label}</b><br>Debt/Earnings: ${fmtPct(d.ratio)}<br>Debt: ${fmt$(d.debt)}<br>Earnings: ${fmt$(d.earn)}`,
        ),
      )
      .on("mouseout", hideTip)
      .on("click", (_, d) => {
        pinned = pinned === d.label ? null : d.label;
        applyPinStyles();
        pinCb(pinned);
      })
      .merge(bars)
      .transition()
      .duration(600)
      .attr("y", (d) => y(d.ratio))
      .attr("height", (d) => h - y(d.ratio))
      .attr("fill", (d) => color(d.ratio));

    bars.exit().remove();

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
        return (t) => d3.select(this).text(i(t).toFixed(0) + "%");
      });

    lbl.exit().remove();
    applyPinStyles();
  }

  function update() {
    const state = getState();
    const data = getData();
    x0.domain(data.map((d) => d.label));
    x1.range([0, x0.bandwidth()]);
    renderAxis();
    state.view === "grouped" ? grouped(data) : ratio(data);
  }

  function updatePin(label) {
    pinned = label;
    applyPinStyles();
  }

  function onPin(cb) {
    pinCb = typeof cb === "function" ? cb : () => {};
  }

  update();
  return { update, updatePin, onPin };
}
