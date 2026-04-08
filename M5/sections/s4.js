// sections/s4.js
import { med, fmt$, C, showTip, hideTip } from "../utils.js";

// ════════════════════════════════════════════
// SECTION 4: Animated Racetrack
// ════════════════════════════════════════════

let _timer = null; // module-level so it can be stopped on re-init
let _observer = null;

export function initS4(groups) {
  const { all: rows } = groups;

  const ep6All = med(rows.map((r) => r._EP6));

  // Income-appropriate repayment shares (higher earners can devote more)
  const repayShare = { hi: 0.15, md: 0.1, lo: 0.06, fg: 0.05 };

  function estYears(col, share) {
    const d = med(rows.map((r) => r[col]));
    return !isNaN(d) && !isNaN(ep6All) && ep6All > 0
      ? d / (ep6All * share)
      : NaN;
  }

  const s4 = [
    {
      id: "A",
      label: "High Income",
      color: C.blue,
      debt: med(rows.map((r) => r._HI_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYears("_HI_INC_DEBT_MDN", repayShare.hi),
    },
    {
      id: "B",
      label: "Middle Income",
      color: C.gold,
      debt: med(rows.map((r) => r._MD_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYears("_MD_INC_DEBT_MDN", repayShare.md),
    },
    {
      id: "C",
      label: "Low Income",
      color: C.red,
      debt: med(rows.map((r) => r._LO_INC_DEBT_MDN)),
      earn: ep6All,
      years: estYears("_LO_INC_DEBT_MDN", repayShare.lo),
    },
    {
      id: "D",
      label: "First-Gen",
      color: C.purple,
      debt: med(rows.map((r) => r._FIRSTGEN_DEBT_MDN)),
      earn: ep6All,
      years: estYears("_FIRSTGEN_DEBT_MDN", repayShare.fg),
    },
  ].filter((d) => !isNaN(d.years));

  if (s4.length) {
    const fast = s4.reduce((a, b) => (a.years < b.years ? a : b));
    const slow = s4.reduce((a, b) => (a.years > b.years ? a : b));
    document.getElementById("callout4").textContent =
      `${fast.label} graduates could be debt-free in ~${fast.years.toFixed(0)} years. ` +
      `${slow.label} borrowers face ~${slow.years.toFixed(0)} years — delaying homeownership, ` +
      `retirement savings, and wealth-building for over a decade longer.`;
  }

  drawS4(s4);
}

// ── Chart ──

function drawS4(data) {
  if (!data.length) return;

  // ── Cleanup previous instance ──
  if (_timer) {
    _timer.stop();
    _timer = null;
  }
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }

  const container = d3.select("#vis-racetrack-controls");
  container.selectAll("*").remove();

  // ── Dimensions ──
  const W = 600,
    H = 440;
  const cx = W / 2,
    cy = H / 2;
  const RX = 230,
    RY = 150;

  // ── SVG ──
  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .style("overflow", "visible");

  // ── Controls ──
  const ctrlDiv = container.append("div").attr("class", "s4-controls");

  let paused = true;
  let started = false;

  const playBtn = ctrlDiv
    .append("button")
    .text("Play")
    .on("click", () => {
      if (!started) {
        startRace();
        return;
      }
      paused = !paused;
      playBtn.text(paused ? "Play" : "Pause");
    });

  ctrlDiv.append("button").text("Reset").on("click", resetRace);

  let speedMul = 1;
  const speedWrap = ctrlDiv.append("label").attr("class", "s4-speed-label");
  speedWrap.append("span").text("Speed:");
  const speedVal = speedWrap.append("b").text("1x");
  speedWrap
    .append("input")
    .attr("type", "range")
    .attr("min", 0.25)
    .attr("max", 3)
    .attr("step", 0.25)
    .attr("value", 1)
    .on("input", function () {
      speedMul = +this.value;
      speedVal.text(speedMul + "x");
    });

  // ── Microcopy ──
  container
    .append("div")
    .attr("class", "microcopy")
    .html(
      "Each car\u2019s speed reflects how quickly that group can become debt-free. " +
        "Faster cars represent borrowers who can devote more income to repayment. " +
        "Watch the lap counter \u2014 the growing gap shows how financial inequality compounds over time.",
    );

  // ── Build oval track path ──
  const N_PTS = 80;
  const trackPts = [];
  for (let i = 0; i < N_PTS; i++) {
    const a = (2 * Math.PI * i) / N_PTS - Math.PI / 2;
    trackPts.push([cx + RX * Math.cos(a), cy + RY * Math.sin(a)]);
  }

  const lineGen = d3.line().curve(d3.curveCardinalClosed.tension(0.85));
  const trackD = lineGen(trackPts);
  const laneW = 28;

  // ── Track layers ──
  svg
    .append("path")
    .attr("d", trackD)
    .attr("fill", "none")
    .attr("stroke", "#e5e0d8")
    .attr("stroke-width", laneW * 2 + 2);

  const innerPts = [];
  for (let i = 0; i < N_PTS; i++) {
    const a = (2 * Math.PI * i) / N_PTS - Math.PI / 2;
    innerPts.push([
      cx + (RX - laneW) * Math.cos(a),
      cy + (RY - laneW) * Math.sin(a),
    ]);
  }
  svg
    .append("path")
    .attr("d", lineGen(innerPts))
    .attr("fill", "#faf8f4")
    .attr("stroke", "none");
  svg
    .append("path")
    .attr("d", trackD)
    .attr("fill", "none")
    .attr("stroke", "#ece8e0")
    .attr("stroke-width", laneW * 2);
  svg
    .append("path")
    .attr("d", trackD)
    .attr("fill", "none")
    .attr("stroke", "#d5d0c8")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "8,6");

  // ── Hidden path for getPointAtLength ──
  const trackPath = svg
    .append("path")
    .attr("d", trackD)
    .attr("fill", "none")
    .attr("stroke", "none");
  const pathNode = trackPath.node();
  const trackLen = pathNode.getTotalLength();

  // ── Start/lap line ──
  const finPt = pathNode.getPointAtLength(0);
  svg
    .append("line")
    .attr("x1", finPt.x)
    .attr("y1", finPt.y - laneW)
    .attr("x2", finPt.x)
    .attr("y2", finPt.y + laneW)
    .attr("stroke", "#8b2500")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,3");
  svg
    .append("text")
    .attr("x", finPt.x)
    .attr("y", finPt.y - laneW - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#8b2500")
    .attr("font-size", "9px")
    .attr("font-family", "Helvetica,Arial,sans-serif")
    .attr("letter-spacing", "1.5px")
    .attr("font-weight", "700")
    .text("START / LAP LINE");

  // ── Car state ──
  // Speed = trackLen / years: fewer years → faster car
  const cars = data.map((d) => ({
    ...d,
    dist: 0,
    speed: trackLen / d.years,
    lap: 0,
    pinned: false,
  }));

  // Stagger starts slightly so cars don't overlap
  cars.forEach((c, i) => {
    c.dist = i * 50;
  });

  // ── Scoreboard ──
  const scoreG = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  scoreG
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -50)
    .attr("fill", "#999")
    .attr("font-size", "8px")
    .attr("font-family", "Helvetica,Arial,sans-serif")
    .attr("letter-spacing", "1.5px")
    .text("DEBTS PAID OFF");

  const scoreRows = scoreG
    .selectAll(".score-row")
    .data(cars)
    .enter()
    .append("g")
    .attr("class", "score-row")
    .attr("transform", (_, i) => `translate(0,${-30 + i * 22})`);

  scoreRows
    .append("rect")
    .attr("x", -8)
    .attr("y", -7)
    .attr("width", 16)
    .attr("height", 14)
    .attr("rx", 3)
    .attr("fill", (d) => d.color)
    .attr("opacity", 0.8);
  scoreRows
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", 4)
    .attr("fill", "#fff")
    .attr("font-size", "8px")
    .attr("font-weight", "700")
    .text((d) => d.id);
  scoreRows
    .append("text")
    .attr("class", "score-laps")
    .attr("x", 16)
    .attr("y", 4)
    .attr("fill", (d) => d.color)
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .text("0");
  scoreRows
    .append("text")
    .attr("class", "score-label")
    .attr("x", 42)
    .attr("y", 4)
    .attr("fill", "#999")
    .attr("font-size", "8px")
    .text((d) => d.label);

  // ── Car groups ──
  const carGs = svg
    .selectAll(".car-group")
    .data(cars)
    .enter()
    .append("g")
    .attr("class", "car-group")
    .style("cursor", "pointer");

  carGs
    .append("circle")
    .attr("class", "car-ring")
    .attr("r", 22)
    .attr("fill", "none")
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 2.5)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0);

  carGs
    .append("rect")
    .attr("x", -16)
    .attr("y", -9)
    .attr("width", 32)
    .attr("height", 18)
    .attr("rx", 7)
    .attr("fill", (d) => d.color)
    .attr("opacity", 0.9);

  carGs
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", 4)
    .attr("fill", "#fff")
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .text((d) => d.id);

  carGs
    .append("text")
    .attr("class", "car-name-label")
    .attr("text-anchor", "middle")
    .attr("y", -16)
    .attr("fill", (d) => d.color)
    .attr("font-size", "8px")
    .attr("font-weight", "600")
    .text((d) => d.label);

  // ── Tooltip ──
  const tipHtml = (d) =>
    `<b>${d.label}</b><br>Median Debt: ${fmt$(d.debt)}<br>` +
    `Median Earnings (6yr): ${fmt$(d.earn)}<br>` +
    `Est. Years to Repay: ~${d.years.toFixed(1)}<br>` +
    `Laps: ${d.lap}`;

  carGs
    .on("mouseover", (e, d) => {
      if (!d.pinned) showTip(e, tipHtml(d));
    })
    .on("mousemove", (e, d) => {
      if (!d.pinned) showTip(e, tipHtml(d));
    })
    .on("mouseout", (e, d) => {
      if (!d.pinned) hideTip();
    });

  // ── Pin / detail panel ──
  let pinnedCar = null;

  const panelDiv = container
    .append("div")
    .attr("class", "s4-detail-panel")
    .style("display", "none")
    .style("position", "absolute");

  function unpin() {
    if (pinnedCar) {
      pinnedCar.pinned = false;
      pinnedCar = null;
    }
    carGs.select(".car-ring").attr("opacity", 0);
    panelDiv.style("display", "none");
    hideTip();
  }

  function pinCar(d) {
    unpin();
    d.pinned = true;
    pinnedCar = d;
    carGs.select(".car-ring").attr("opacity", (c) => (c === d ? 1 : 0));

    const fastest = cars.reduce((a, b) => (a.years < b.years ? a : b));
    const diff = d.years - fastest.years;
    const sentence =
      diff < 0.5
        ? `${d.label} borrowers repay fastest among these groups.`
        : `${d.label} borrowers take ~${diff.toFixed(0)} more years than ${fastest.label} graduates — years of delayed savings and wealth-building.`;

    panelDiv
      .html(
        `<span class="panel-close">&times;</span>` +
          `<b style="color:${d.color}">${d.label}</b><br>` +
          `Median Debt: ${fmt$(d.debt)}<br>` +
          `Median Earnings (6yr): ${fmt$(d.earn)}<br>` +
          `Years to Repay: ~${d.years.toFixed(1)}<br>` +
          `<div class="panel-sentence">${sentence}</div>`,
      )
      .style("display", "block")
      .style("left", "10px")
      .style("bottom", "10px");

    panelDiv.select(".panel-close").on("click", () => unpin());
    hideTip();
  }

  carGs.on("click", (e, d) => {
    e.stopPropagation();
    d.pinned ? unpin() : pinCar(d);
  });
  svg.on("click", () => unpin());

  // ── Position helper ──
  function positionCar(sel, car) {
    const len = ((car.dist % trackLen) + trackLen) % trackLen;
    const pt = pathNode.getPointAtLength(len);
    const aheadLen = (((len + 4) % trackLen) + trackLen) % trackLen;
    const ahead = pathNode.getPointAtLength(aheadLen);
    const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
    sel.attr("transform", `translate(${pt.x},${pt.y}) rotate(${angle})`);
  }

  // ── Reset ──
  function resetRace() {
    if (_timer) {
      _timer.stop();
      _timer = null;
    }
    cars.forEach((c, i) => {
      c.dist = i * 50;
      c.lap = 0;
    });
    carGs.each(function (d) {
      positionCar(d3.select(this), d);
      d3.select(this).select(".car-name-label").text(d.label);
    });
    scoreG.selectAll(".score-laps").text("0");
    paused = true;
    started = false;
    playBtn.text("Play");
    startRace();
  }

  // ── Start (continuous loop) ──
  function startRace() {
    if (started) return;
    started = true;
    paused = false;
    playBtn.text("Pause");
    let lastT = null;

    _timer = d3.timer((elapsed) => {
      if (lastT === null) {
        lastT = elapsed;
      }
      if (paused) {
        lastT = elapsed;
        return;
      }

      const dt = (elapsed - lastT) / 1000;
      lastT = elapsed;
      if (dt <= 0) return;

      cars.forEach((c) => {
        c.dist += c.speed * dt * speedMul;
        c.lap = Math.floor(c.dist / trackLen);
      });

      carGs.each(function (d) {
        positionCar(d3.select(this), d);
      });
      scoreG.selectAll(".score-laps").text((d) => d.lap);
    });
  }

  // ── Set initial positions ──
  carGs.each(function (d) {
    positionCar(d3.select(this), d);
  });

  // ── Auto-start on scroll into view ──
  _observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) startRace();
      });
    },
    { threshold: 0.3 },
  );
  _observer.observe(document.getElementById("sec4"));
}
