// /scripts/offline-contract.mjs
import fs from "node:fs";
import path from "node:path";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function existsAny(paths) {
  return paths.find((p) => fs.existsSync(p)) ?? null;
}

function mustInclude(haystack, needle, contextLabel, failures) {
  if (!haystack.includes(needle)) {
    failures.push(`${contextLabel}: missing '${needle}'`);
  }
}

function mustMatch(haystack, re, contextLabel, failures, message) {
  if (!re.test(haystack)) {
    failures.push(`${contextLabel}: ${message}`);
  }
}

function tryParseJson(filePath, failures) {
  try {
    const raw = readText(filePath);
    return JSON.parse(raw);
  } catch (e) {
    failures.push(`${path.basename(filePath)}: invalid JSON (${String(e?.message ?? e)})`);
    return null;
  }
}

export function checkOfflineContracts({ rootDir = process.cwd() } = {}) {
  const failures = [];

  const indexPath = path.join(rootDir, "index.html");
  const stylePath = path.join(rootDir, "style.css");
  const scriptPath = path.join(rootDir, "script.js");

  for (const p of [indexPath, stylePath, scriptPath]) {
    if (!fs.existsSync(p)) failures.push(`missing required file: ${path.relative(rootDir, p)}`);
  }

  if (failures.length > 0) return failures;

  const html = readText(indexPath);
  const css = readText(stylePath);
  const js = readText(scriptPath);

  // ---- HTML invariants (IDs/classes are API) ----
  mustInclude(html, "id=\"intro-overlay\"", "index.html", failures);
  mustInclude(html, "id=\"skip-button\"", "index.html", failures);
  mustInclude(html, "id=\"start-journey-button\"", "index.html", failures);
  mustInclude(html, "id=\"journey-modal\"", "index.html", failures);
  mustInclude(html, "id=\"modal-text\"", "index.html", failures);
  mustInclude(html, "id=\"modal-actions\"", "index.html", failures);
  mustInclude(html, "id=\"journey-close-button\"", "index.html", failures);
  mustInclude(html, "class=\"gallery\"", "index.html", failures);
  mustMatch(html, /class=\"image-container\"/g, "index.html", failures, "missing .image-container (expect at least 1)");
  mustInclude(html, "<main id=\"main-content\"", "index.html", failures);

  // ---- JS invariants (selector strings are API) ----
  // Intro
  mustInclude(js, "getElementById(\"intro-overlay\")", "script.js", failures);
  mustInclude(js, "getElementById(\"skip-button\")", "script.js", failures);
  // Modal
  mustInclude(js, "getElementById(\"journey-modal\")", "script.js", failures);
  mustInclude(js, "getElementById(\"modal-actions\")", "script.js", failures);
  mustInclude(js, "getElementById(\"journey-close-button\")", "script.js", failures);
  // Feel / logos
  mustInclude(js, "getElementById(\"logo-u-grid\")", "script.js", failures);

  // ---- CSS sanity checks ----
  // We only check a few anchors to detect accidental deletion/overwrite.
  mustInclude(css, "body", "style.css", failures);
  mustInclude(css, "#about.content-section", "style.css", failures);

  // ---- Data files (either root or /data) ----
  const modalStepsPath = existsAny([
    path.join(rootDir, "data", "modal-steps.json"),
    path.join(rootDir, "modal-steps.json")
  ]);

  const logosPath = existsAny([
    path.join(rootDir, "data", "logos.json"),
    path.join(rootDir, "logos.json")
  ]);

  if (!modalStepsPath) {
    failures.push("missing modal-steps.json (expected at repo root or data/modal-steps.json)");
  } else {
    const steps = tryParseJson(modalStepsPath, failures);
    if (Array.isArray(steps)) {
      if (steps.length === 0) failures.push("modal-steps.json: steps array is empty");
      // Light schema check
      for (let i = 0; i < Math.min(steps.length, 3); i += 1) {
        const s = steps[i];
        if (typeof s !== "object" || s === null) failures.push(`modal-steps.json: step[${i}] is not an object`);
      }
    } else if (steps !== null) {
      failures.push("modal-steps.json: expected JSON array");
    }
  }

  if (!logosPath) {
    failures.push("missing logos.json (expected at repo root or data/logos.json)");
  } else {
    const logos = tryParseJson(logosPath, failures);
    if (Array.isArray(logos)) {
      if (logos.length === 0) failures.push("logos.json: logos array is empty");
      const first = logos[0];
      if (first && typeof first === "object") {
        for (const k of ["id", "author", "description", "imageSrc"]) {
          if (!(k in first)) failures.push(`logos.json: first item missing key '${k}'`);
        }
      }
    } else if (logos !== null) {
      failures.push("logos.json: expected JSON array");
    }
  }

  return failures;
}
