// File: src/scripts/GenerateImports.ts
import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(__dirname, "../");
const OUTPUT_FILE = path.join(SRC_DIR, "Imports.ts");
const EXCLUDE_FOLDERS = ["blueprintsreadonlyitsrealtruthofrules", "dist", "node_modules"];

interface ExportedSymbol {
  name: string;
  source: string;
}

function isDirectory(filePath: string) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (EXCLUDE_FOLDERS.some(f => filePath.includes(f))) return;
    if (isDirectory(filePath)) {
      results = results.concat(getAllFiles(filePath));
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      results.push(filePath);
    }
  });
  return results;
}

function extractExports(filePath: string): ExportedSymbol[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const exportRegex = /export\s+(?:class|const|interface|enum|function|type)\s+(\w+)/g;
  const symbols: ExportedSymbol[] = [];
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1];
    symbols.push({
      name,
      source: filePath,
    });
  }
  return symbols;
}

function relativeImport(from: string, to: string) {
  let rel = path.relative(path.dirname(from), to).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel.replace(/\.ts$/, "");
}

// ---------------- GENERATE ----------------
const allFiles = getAllFiles(SRC_DIR);
const exportedSymbols: ExportedSymbol[] = [];

allFiles.forEach(file => {
  exportedSymbols.push(...extractExports(file));
});

// Usunięcie duplikatów po nazwie symbolu
const uniqueExports = exportedSymbols.reduce<Record<string, string>>((acc, sym) => {
  if (!acc[sym.name]) {
    acc[sym.name] = sym.source;
  }
  return acc;
}, {});

let importsContent = "// THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.\n\n";

for (const [name, source] of Object.entries(uniqueExports)) {
  importsContent += `export { ${name} } from "${relativeImport(OUTPUT_FILE, source)}";\n`;
}

fs.writeFileSync(OUTPUT_FILE, importsContent, "utf-8");
console.log(`✅ Imports generated: ${OUTPUT_FILE}`);