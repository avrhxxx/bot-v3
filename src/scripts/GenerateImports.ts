// src/scripts/GenerateImports.ts
import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(__dirname, "../");
const OUTPUT_FILE = path.resolve(SRC_DIR, "Imports.ts");
const EXCLUDE_FOLDERS = ["blueprintsreadonlyitsrealtruthofrules", "node_modules", ".git"];
const EXCLUDE_FILES = ["GenerateImports.ts"]; // sam siebie pomijamy

function isExcluded(filePath: string): boolean {
  return EXCLUDE_FOLDERS.some(folder => filePath.includes(folder));
}

function scanDir(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (isExcluded(fullPath)) continue;

    if (entry.isDirectory()) {
      files = files.concat(scanDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !EXCLUDE_FILES.includes(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatImport(filePath: string): string {
  // Tworzymy ścieżkę względną od src/
  let relativePath = "./" + path.relative(SRC_DIR, filePath).replace(/\\/g, "/");
  if (relativePath.endsWith(".ts")) relativePath = relativePath.slice(0, -3);

  // Tworzymy unikalną nazwę zmiennej
  const varName = relativePath
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/^_+/, "");

  return `import * as ${varName} from "${relativePath}";`;
}

function generateImports() {
  const files = scanDir(SRC_DIR);
  const imports = files.map(formatImport).join("\n");

  const content = `// AUTO-GENERATED IMPORTS - DO NOT EDIT MANUALLY\n${imports}\n`;

  fs.writeFileSync(OUTPUT_FILE, content, { encoding: "utf-8" });
  console.log(`✅ Imports generated: ${OUTPUT_FILE}`);
}

// Uruchomienie generatora
generateImports();