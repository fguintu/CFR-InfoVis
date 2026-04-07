// sections/s2.js
import { med, fmt$, C, showTip, hideTip } from "../utils.js";

// ════════════════════════════════════════════
// SECTION 2: Gender Earnings Gap
// ════════════════════════════════════════════

export function initS2(groups) {
  const { all: rows } = groups;

  // ── Wire up guess-input formatting (deferred to here, after DOM is ready) ──
  const gapInput = document.getElementById("gap-guess");
  gapInput.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    e.target.value = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  });

  // ── Build year-over-year earnings data ──
  const s2 = [];
  for (let yr = 6; yr <= 10; yr++) {
    const male = med(rows.map((r) => r[`_EM${yr}`]));
    const female = med(rows.map((r) => r[`_EF${yr}`]));
    if (!isNaN(male) && !isNaN(female)) s2.push({ yr, male, female });
  }

  if (!s2.length) return;

  const last = s2[s2.length - 1];
  const actualGap = Math.round(last.male - last.female);
  const cents = ((last.female / last.male) * 100).toFixed(1);

  // ── Callout (values blurred until reveal) ──
  document.getElementById("callout2").innerHTML =
    `Female graduates earn approximately <span class="blur-text secret-val">${cents}</span> cents for every dollar their male peers make. ` +
    `By ${last.yr} years out, women earn <span class="blur-text secret-val">${fmt$(last.female)}</span> vs ` +
    `<span class="blur-text secret-val">${fmt$(last.male)}</span> for men — ` +
    `a gap of <span class="blur-text secret-val">${fmt$(actualGap)}</span> annually.`;

  // ── Show game, hide chart ──
  document.getElementById("gender-game-overlay").style.display = "block";
  document.getElementById("gender-vis-wrapper").style.display = "none";

  // ── Game state ──
  let lastDiff = null;

  function revealChart() {
    document.getElementById("gender-game-overlay").style.display = "none";
    document.getElementById("gender-vis-wrapper").style.display = "block";
    document
      .querySelectorAll(".secret-val")
      .forEach((el) => el.classList.add("unblurred"));
    drawS2(s2);
  }

  function flashFeedback(text, color) {
    const fb = document.getElementById("game-feedback");
    fb.textContent = text;
    fb.style.color = color;
    fb.classList.remove("new-feedback");
    void fb.offsetWidth; // force reflow to restart animation
    fb.classList.add("new-feedback");
  }

  // ── Guess button ──
  document.getElementById("btn-guess").addEventListener("click", () => {
    const raw = gapInput.value.replace(/,/g, "");
    const guess = parseInt(raw, 10);

    if (isNaN(guess) || guess < 0) {
      flashFeedback("Please enter a valid number.", "#b33");
      return;
    }

    if (guess === actualGap) {
      flashFeedback("Correct!", "#b33");
      setTimeout(revealChart, 1200);
      return;
    }

    const currentDiff = Math.abs(guess - actualGap);

    if (lastDiff === null) {
      flashFeedback(
        currentDiff <= 500 ? "Right direction!" : "Way off!",
        "#b33",
      );
    } else if (currentDiff < lastDiff) {
      flashFeedback("🔥 Hotter!", "#d9534f");
    } else if (currentDiff > lastDiff) {
      flashFeedback("❄️ Colder", "#5bc0de");
    } else {
      flashFeedback("Same distance", "#666");
    }

    lastDiff = currentDiff;
  });

  // ── Reveal button ──
  document.getElementById("btn-reveal").addEventListener("click", revealChart);

  // ── Enter key shortcut ──
  gapInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("btn-guess").click();
  });
}

// ── Chart ──

function drawS2(data) {
  if (!data.length) return;

  const W = 600,
    H = 360;
  const M = { t: 24, r: 50, b: 44, l: 58 };
  const w = W - M.l - M.r;
  const h = H - M.t - M.b;

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

  function styleAxes(...axes) {
    axes.forEach((a) => {
      a.selectAll("text").attr("fill", "#666");
      a.select(".domain").attr("stroke", C.axis);
    });
  }

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
    styleAxes(xG, yG);

    lG.selectAll("*").remove();

    // Gap fill
    lG.append("path")
      .datum(data)
      .attr(
        "d",
        d3
          .area()
          .x((d) => x(d.yr))
          .y0((d) => yA(d.female))
          .y1((d) => yA(d.male))
          .curve(d3.curveMonotoneX),
      )
      .attr("fill", "rgba(179,51,51,.08)");

    // Lines
    [
      { key: "male", color: C.blue },
      { key: "female", color: C.red },
    ].forEach(({ key, color }) => {
      lG.append("path")
        .datum(data)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.yr))
            .y((d) => yA(d[key]))
            .curve(d3.curveMonotoneX),
        )
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5);
    });

    // Dots
    data.forEach((d) => {
      const tipHtml = `<b>${d.yr} Years Post-Entry</b><br>Men: ${fmt$(d.male)}<br>Women: ${fmt$(d.female)}<br>Gap: ${fmt$(d.male - d.female)}`;

      [
        { key: "male", color: C.blue },
        { key: "female", color: C.red },
      ].forEach(({ key, color }) => {
        lG.append("circle")
          .attr("cx", x(d.yr))
          .attr("cy", yA(d[key]))
          .attr("r", 4)
          .attr("fill", color)
          .attr("stroke", C.bg)
          .attr("stroke-width", 2)
          .on("mouseover", (e) => showTip(e, tipHtml))
          .on("mouseout", hideTip);
      });
    });

    // Gap annotation
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

    // End labels
    [
      { key: "male", color: C.blue, label: "Men" },
      { key: "female", color: C.red, label: "Women" },
    ].forEach(({ key, color, label }) => {
      lG.append("text")
        .attr("x", w + 6)
        .attr("y", yA(l[key]) + 4)
        .attr("fill", color)
        .attr("font-size", "11px")
        .text(label);
    });
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
    styleAxes(xG, yG);

    lG.selectAll("*").remove();

    // Parity line
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
