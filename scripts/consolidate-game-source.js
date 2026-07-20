"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const MANIFEST = path.join(SRC, "build-order.json");
const TEMP = path.join(ROOT, ".src-consolidated");
const MAX_MODULE_LINES = 520;

function lineCount(source) {
  return source.match(/.*(?:\n|$)/g)?.filter(Boolean).length || 0;
}

function canonicalBase(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^src\//, "");
  const parts = normalized.split("/");
  if (parts[0] === "bosses" && parts[1] === "mechanics") return "src/bosses/mechanics/runtime.js";
  if (parts.length >= 3) return `src/${parts[0]}/${parts[1]}.js`;
  return `src/${parts[0]}.js`;
}

function numberedPath(base, index) {
  if (index === 1) return base;
  return base.replace(/\.js$/, `-${String(index).padStart(2, "0")}.js`);
}

function sectionBlock(id, source) {
  return `/*__ECHO_SECTION:${id}__*/\n${source}/*__ECHO_SECTION_END:${id}__*/\n`;
}

function clearGeneratedTree() {
  for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
    if (["README.md", "main.js", "build-order.json"].includes(entry.name)) continue;
    fs.rmSync(path.join(SRC, entry.name), { recursive: true, force: true });
  }
}

function ensureBridge(relativePath, content) {
  const target = path.join(SRC, relativePath);
  if (fs.existsSync(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function main() {
  const order = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (!Array.isArray(order) || !order.every((entry) => typeof entry === "string")) {
    throw new Error("A consolidação espera o build-order de fragmentos da primeira migração.");
  }

  const sections = order.map((relativePath, index) => {
    const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
    return {
      id: String(index + 1).padStart(4, "0"),
      source,
      lines: lineCount(source),
      base: canonicalBase(relativePath)
    };
  });

  const buckets = new Map();
  const placements = new Map();
  for (const section of sections) {
    const files = buckets.get(section.base) || [];
    let file = files.at(-1);
    if (!file || file.lines + section.lines > MAX_MODULE_LINES) {
      file = { index: files.length + 1, lines: 0, sections: [] };
      files.push(file);
      buckets.set(section.base, files);
    }
    file.sections.push(section);
    file.lines += section.lines;
    placements.set(section.id, numberedPath(section.base, file.index));
  }

  fs.rmSync(TEMP, { recursive: true, force: true });
  fs.mkdirSync(TEMP, { recursive: true });
  for (const [base, files] of buckets) {
    for (const file of files) {
      const relativePath = numberedPath(base, file.index).replace(/^src\//, "");
      const target = path.join(TEMP, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const header = "/* ECHO source module. Sections are assembled by src/build-order.json. */\n";
      fs.writeFileSync(target, header + file.sections.map((section) => sectionBlock(section.id, section.source)).join(""));
    }
  }

  clearGeneratedTree();
  for (const entry of fs.readdirSync(TEMP, { withFileTypes: true })) {
    fs.cpSync(path.join(TEMP, entry.name), path.join(SRC, entry.name), { recursive: true });
  }
  fs.rmSync(TEMP, { recursive: true, force: true });

  const consolidatedOrder = sections.map((section) => ({
    path: placements.get(section.id),
    section: section.id
  }));
  fs.writeFileSync(MANIFEST, `${JSON.stringify(consolidatedOrder, null, 2)}\n`);
  fs.writeFileSync(path.join(SRC, "main.js"), `"use strict";\n\nconst buildOrder = require("./build-order.json");\nmodule.exports = Object.freeze(buildOrder.map((entry) => Object.freeze({ ...entry })));\n`);

  ensureBridge("core/random.js", `"use strict";\nmodule.exports = require("../../core/random.js");\n`);
  ensureBridge("core/events.js", `"use strict";\nmodule.exports = require("../../core/events.js");\n`);
  ensureBridge("enemies/phantom.js", `"use strict";\n// O comportamento do Espelho é montado pelas seções de enemy-ai.js até a extração de IA específica.\nmodule.exports = Object.freeze({ id: "phantom", source: "./enemy-ai.js" });\n`);
  ensureBridge("bosses/mechanics/index.js", `"use strict";\nmodule.exports = Object.freeze({ runtime: "./runtime.js" });\n`);
  ensureBridge("ui/boss-hud.js", `"use strict";\nmodule.exports = Object.freeze({ source: "./hud.js" });\n`);

  const moduleCount = [...buckets.values()].reduce((total, files) => total + files.length, 0);
  console.log(`Fonte consolidada em ${moduleCount} módulos canônicos, com limite de ${MAX_MODULE_LINES} linhas úteis.`);
}

main();
