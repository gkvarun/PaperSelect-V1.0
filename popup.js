const BASE =
  "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";

const subjectEl = document.getElementById("subject");
const yearEl = document.getElementById("year");
const seriesEl = document.getElementById("series");
const paperEl = document.getElementById("paper");
const variantEl = document.getElementById("variant");
const ptypeEl = document.getElementById("ptype");
const errorEl = document.getElementById("error");

// Populate the latest 10 years, newest first.
(function populateYears() {
  const current = new Date().getFullYear();
  for (let year = current; year >= current - 9; year--) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearEl.appendChild(option);
  }
  yearEl.value = String(current);
})();

function updateVariantOptions() {
  const previousValue = variantEl.value;
  variantEl.replaceChildren();

  // CAIE February/March papers use variant 2.
  const variants = seriesEl.value === "m" ? ["2"] : ["1", "2", "3"];
  variants.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `Variant ${value}`;
    variantEl.appendChild(option);
  });

  variantEl.value = variants.includes(previousValue) ? previousValue : variants[0];
}

updateVariantOptions();
seriesEl.addEventListener("change", updateVariantOptions);

function showError(message) {
  errorEl.textContent = message;
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
    showError("Please complete every field to find your PDF.");
    return null;
  }
  if (!/^\d{4}$/.test(subject)) {
    showError("Subject code must be 4 digits (for example, 9709).");
    return null;
  }

  const yearNum = Number.parseInt(year, 10);
  const current = new Date().getFullYear();
  if (!Number.isInteger(yearNum) || yearNum < current - 9 || yearNum > current) {
    showError("Choose a year from the latest 10 exam years.");
    return null;
  }
  if (!["m", "s", "w"].includes(series)) {
    showError("Choose a valid exam series.");
    return null;
  }

  const paperNum = Number.parseInt(paper, 10);
  const variantNum = Number.parseInt(variant, 10);
  if (!Number.isInteger(paperNum) || paperNum < 1 || paperNum > 9) {
    showError("Paper component must be a number from 1 to 9.");
    paperEl.focus();
    return null;
  }
  if (!Number.isInteger(variantNum) || !["1", "2", "3"].includes(variant)) {
    showError("Choose a valid paper variant.");
    return null;
  }
  if (series === "m" && variantNum !== 2) {
    showError("February/March papers use variant 2.");
    return null;
  }
  if (!["qp", "ms", "er"].includes(ptype)) {
    showError("Choose a valid resource type.");
    return null;
  }

  return { subject, yearNum, series, paperNum, variantNum, ptype };
}

document.getElementById("open").addEventListener("click", async () => {
  const data = validate();
  if (!data) return;

  const { subject, yearNum, series, paperNum, variantNum, ptype } = data;
  const yy = String(yearNum).slice(-2);
  const componentVariant = `${paperNum}${variantNum}`.padStart(2, "0");
  const filename = `${subject}_${series}${yy}_${ptype}_${componentVariant}.pdf`;
  const url = BASE + filename;

  clearError();
  try {
    await chrome.tabs.create({ url });
  } catch (error) {
    console.error("Could not open past paper:", error);
    showError("Could not open the PDF. Please try again.");
  }
});
