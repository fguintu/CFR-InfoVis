// sections/s5.js
import { fmt$, fmtPct, C, showTip, hideTip } from "../utils.js";

// ════════════════════════════════════════════
// SECTION 5: Beeswarm — All Institutions
// ════════════════════════════════════════════

export function initS5(groups) {
  const { all: rows } = groups;

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

  const nP = beeData.filter((d) => d.control === 1).length;
  const nN = beeData.filter((d) => d.control === 2).length;
  const nF = beeData.filter((d) => d.control === 3).length;
  const nH = beeData.filter((d) => d.hbcu === 1).length;

  document.getElementById("callout5").textContent =
    `Across ${beeData.length} institutions — ${nP} public, ${nN} private nonprofit, ` +
    `${nF} for-profit, and ${nH} HBCUs — the landscape of debt-to-earnings ratios ` +
    `reveals who the current system truly serves.`;

  drawS5(beeData);
}

// ── Chart ──

function drawS5(data) {
  if (!data.length) return;

  const W = 640,
    H = 380;
  const M = { t: 16, r: 16, b: 44, l: 16 };
  const w = W - M.l - M.r;
  const h = H - M.t - M.b;

  const visContainer = document.getElementById("vis-beeswarm");
  visContainer.innerHTML = ""; // Clear previous

  // ── Scale state ──
  let maxScale = 1;

  const svg = d3
    .select(visContainer)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%");

  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);

  // ── Init scales ──
  const x = d3.scaleLinear().domain([0, maxScale]).range([0, w]);

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

  const COLOR_MAP = { 1: C.blue, 2: C.gold, 3: C.red };
  const TYPE_LABEL = { 1: "Public", 2: "Private Nonprofit", 3: "For-Profit" };

  function getColor(d) {
    return d.hbcu === 1 ? C.purple : COLOR_MAP[d.control] || "#999";
  }
  function getLabel(d) {
    return d.hbcu === 1 ? "HBCU" : TYPE_LABEL[d.control] || "Unknown";
  }

  // ── Axis groups ──
  const xAxisG = g
    .append("g")
    .attr("transform", `translate(0,${h})`);

  g.append("g").select(".domain").attr("stroke", C.axis);

  // ── Scatter positions ──
  function positionData() {
    data.forEach((d) => {
      d.px = x(d.ratio);
      d.py = h / 2 + (Math.random() - 0.5) * h * 0.78;
      d.pr = r(d.ug);
    });
  }
  positionData();

  // ── Circles ──
  const circles = g
    .selectAll(".bee-circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "bee-circle")
    .attr("cx", (d) => d.px)
    .attr("cy", (d) => d.py)
    .attr("r", 0)
    .attr("fill", (d) => getColor(d))
    .attr("opacity", 0.55)
    .on("mouseover", function (e, d) {
      d3.select(this)
        .attr("opacity", 1)
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5);
      showTip(
        e,
        `<b>${d.name}</b><br>Type: ${getLabel(d)}<br>Debt/Earnings: ${fmtPct(d.ratio)}<br>` +
          `Debt: ${fmt$(d.debt)}<br>Earnings: ${fmt$(d.earn)}<br>Enrollment: ${Math.round(d.ug).toLocaleString()}`,
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 0.55).attr("stroke", "none");
      hideTip();
    });

  // ── Update axis ──
  function updateAxis() {
    xAxisG
      .transition()
      .duration(400)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".1f")))
      .selectAll("text")
      .attr("fill", "#666")
      .style("font-size", "11px");

    xAxisG.select(".domain").attr("stroke", C.axis);
  }

  updateAxis();

  // ── Update circles on scale change ──
  function updateVisualization() {
    positionData();
    circles
      .transition()
      .duration(350)
      .attr("cx", (d) => d.px);
  }

  // ── Animate on scroll into view ──
  let animated = false;

  const obs = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting || animated) return;
      animated = true;
      circles
        .transition()
        .duration(600)
        .delay(() => Math.random() * 400)
        .attr("r", (d) => d.pr);
    },
    { threshold: 0.25 },
  );

  obs.observe(document.getElementById("sec5"));

  // ── Filter controls ──
  d3.select("#bee-controls")
    .selectAll("button")
    .on("click", function () {
      d3.select("#bee-controls").selectAll("button").classed("active", false);
      d3.select(this).classed("active", true);

      const f = d3.select(this).attr("data-filter");

      function isActive(d) {
        if (f === "all") return true;
        if (f === "hbcu") return d.hbcu === 1;
        return d.control === +f;
      }

      circles
        .transition()
        .duration(350)
        .attr("opacity", (d) =>
          isActive(d) ? (f === "all" ? 0.55 : 0.7) : 0.04,
        )
        .attr("r", (d) => (isActive(d) ? d.pr : d.pr * 0.3));
    });

    // ── Scale adjustment controls ──
  const visParent = visContainer.parentElement;
  const scaleCtrlDiv = d3
    .select(visParent)
    .append("label")
    .attr("class", "s4-speed-label")
    .style("margin-top", "12px");

  scaleCtrlDiv.append("span").text("Scale:");
  const scaleLabel = scaleCtrlDiv.append("b").text("1x");

  scaleCtrlDiv
    .append("input")
    .attr("type", "range")
    .attr("min", 0.5)
    .attr("max", 2)
    .attr("step", 0.25)
    .attr("value", 1)
    .on("input", function () {
      maxScale = +this.value;
      x.domain([0, maxScale]);
      updateAxis();
      updateVisualization();
      scaleLabel.text(maxScale.toFixed(2) + "x");
    });
}