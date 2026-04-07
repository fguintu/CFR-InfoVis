import {
  safeNum,
  med,
  fmt$,
  fmtPct,
  initTooltip,
  initReveal,
} from "./utils.js";
import { initS1 } from "./sections/s1.js";
import { initS2 } from "./sections/s2.js";
import { initS3 } from "./sections/s3.js";
import { initS4 } from "./sections/s4.js";
import { initS5 } from "./sections/s5.js";

// ════════════════════════════════
// Load CSV & Initialize
// ════════════════════════════════
Papa.parse("../data/filtered_data.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
  error: function (err) {
    console.error("CSV load error:", err);
    document.getElementById("loading").innerHTML =
      '<p style="color:#b33">Error loading data. Check console.</p>';
  },
  complete: function (res) {
    console.log(
      "CSV loaded:",
      res.data.length,
      "rows,",
      Object.keys(res.data[0] || {}).length,
      "columns",
    );
    console.log("First row:", res.data[0]);
    const rows = res.data.map((r) => {
      const o = { ...r };
      o._PREDDEG = safeNum(r.PREDDEG);
      o._CONTROL = safeNum(r.CONTROL);
      o._HBCU = safeNum(r.HBCU);
      o._UGDS = safeNum(r.UGDS);
      o._GRAD_DEBT_MDN = safeNum(r.GRAD_DEBT_MDN);
      o._LO_INC_DEBT_MDN = safeNum(r.LO_INC_DEBT_MDN);
      o._MD_INC_DEBT_MDN = safeNum(r.MD_INC_DEBT_MDN);
      o._HI_INC_DEBT_MDN = safeNum(r.HI_INC_DEBT_MDN);
      o._FIRSTGEN_DEBT_MDN = safeNum(r.FIRSTGEN_DEBT_MDN);
      for (let yr = 6; yr <= 10; yr++) {
        o[`_EP${yr}`] = safeNum(r[`MD_EARN_WNE_P${yr}`]);
        o[`_EM${yr}`] = safeNum(r[`MD_EARN_WNE_MALE1_P${yr}`]);
        o[`_EF${yr}`] = safeNum(r[`MD_EARN_WNE_MALE0_P${yr}`]);
      }
      o._C150_WHITE = safeNum(r.C150_4_WHITE);
      o._C150_BLACK = safeNum(r.C150_4_BLACK);
      o._C150_HISP = safeNum(r.C150_4_HISP);
      o._C150_ASIAN = safeNum(r.C150_4_ASIAN);
      o._C150_AIAN = safeNum(r.C150_4_AIAN);
      o._C150_NHPI = safeNum(r.C150_4_NHPI);
      o._C150_2MOR = safeNum(r.C150_4_2MOR);
      return o;
    });

    // Parse into groups
    const groups = {
      all: rows,
      cc: rows.filter((r) => r._PREDDEG === 2),
      fy: rows.filter((r) => r._PREDDEG === 3),
      pub4: rows.filter((r) => r._CONTROL === 1 && r._PREDDEG === 3),
      priv4: rows.filter((r) => r._CONTROL === 2 && r._PREDDEG === 3),
      fp4: rows.filter((r) => r._CONTROL === 3 && r._PREDDEG === 3),
      hbcus: rows.filter((r) => r._HBCU === 1),
    };

    // Hide loading screen
    document.getElementById("loading").classList.add("done");

    // Initialize utilities
    initTooltip();
    initReveal();

    // Initialize sections
    initS1(groups);
    initS2(groups);
    initS3(groups);
    initS4(groups);
    initS5(groups);
  },
});
