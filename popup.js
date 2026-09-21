const BASE =
  "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";

const subjectEl = document.getElementById("subject");
const yearEl = document.getElementById("year");
const seriesEl = document.getElementById("series");
const paperEl = document.getElementById("paper");
const variantEl = document.getElementById("variant");
const ptypeEl = document.getElementById("ptype");
const errorEl = document.getElementById("error");

// Populate last 10 years, newest first
(function populateYears() {
  const current = new Date().getFullYear();
  const min = current - 9;
  for (let y = current; y >= min; y--) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearEl.appendChild(opt);
  }
  yearEl.value = String(current);
})();

// Helper to set variant options depending on series
function updateVariantOptions() {
  const series = seriesEl.value;

  // Clear existing options
  while (variantEl.firstChild) {
    variantEl.removeChild(variantEl.firstChild);
  }

  if (series === "m") {
    // March: only variant 2
    const opt = document.createElement("option");
    opt.value = "2";
    opt.textContent = "2";
    variantEl.appendChild(opt);
    variantEl.value = "2";
  } else {
    // s or w: variants 1, 2, 3
    ["1", "2", "3"].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      variantEl.appendChild(opt);
    });
    if (!["1", "2", "3"].includes(variantEl.value)) {
      variantEl.value = "1";
    }
  }
}

// Run once on load and whenever series changes
updateVariantOptions();
seriesEl.addEventListener("change", updateVariantOptions);

// Error helpers
function showError(msg) {
  errorEl.textContent = msg;
}
function clearError() {
  errorEl.textContent = "";
}

function validate() {
  clearError();

  const subject = subjectEl.value.trim();
  const year = yearEl.value.trim();
  const series = seriesEl.value.trim();
  const paper = paperEl.value.trim();
  const variant = variantEl.value.trim();
  const ptype = ptypeEl.value.trim();

  if (!subject || !year || !series || !paper || !variant || !ptype) {
    showError("All fields are required.");
    return null;
  }

  if (!/^\d{4}$/.test(subject)) {
    showError("Subject code must be 4 digits (e.g. 9709).");
    return null;
  }

  const yearNum = parseInt(year, 10);
  const current = new Date().getFullYear();
  if (isNaN(yearNum) || yearNum < current - 9 || yearNum > current) {
    showError("Year must be within the last 10 exam years.");
    return null;
  }

  if (!["m", "s", "w"].includes(series)) {
    showError("Series must be m (March), s (June), or w (Oct/Nov).");
    return null;
  }

  const paperNum = parseInt(paper, 10);
  const variantNum = parseInt(variant, 10);
  if (
    isNaN(paperNum) ||
    paperNum < 0 ||
    paperNum > 9 ||
    isNaN(variantNum) ||
    variantNum < 1 ||
    variantNum > 3
  ) {
    showError("Component 0–9; variant 1–3 (March is fixed to 2).");
    return null;
  }

  // Extra rule: for March, variant must be 2
  if (series === "m" && variantNum !== 2) {
    showError("For Feb/March, variant is always 2.");
    return null;
  }

  if (!["qp", "ms", "er"].includes(ptype)) {
    showError("Paper type must be qp, ms, or er.");
    return null;
  }

  return { subject, yearNum, series, paperNum, variantNum, ptype };
}

document.getElementById("open").addEventListener("click", async () => {
  const data = validate();
  if (!data) return;

  const { subject, yearNum, series, paperNum, variantNum, ptype } = data;

  const yy = String(yearNum).slice(2);
  const compVar = `${paperNum}${variantNum}`.padStart(2, "0");

  const filename = `${subject}_${series}${yy}_${ptype}_${compVar}.pdf`;
  const url = BASE + filename;

  console.log("Opening:", url);
  clearError();
  await chrome.tabs.create({ url });
});
