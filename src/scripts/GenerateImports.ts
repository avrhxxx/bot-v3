// File: src/scripts/GenerateImports.ts
// ============================================
// PURPOSE:
// - Automatyczne generowanie centralnego pliku importów dla komend
// - Zachowanie unikalnych nazw modułów
// - Kompatybilne z patch feel stosowanym w repo
// ============================================

import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(__dirname, '..', 'commands'); // folder, w którym są komendy
const outputFile = path.join(__dirname, '..', 'Imports.ts');

const files: string[] = [];

// ----------------- REKURENCYJNE ZBIERANIE -----------------
function walkDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'Imports.ts') {
      files.push(fullPath);
    }
  }
}

walkDir(srcDir);

// ----------------- GENEROWANIE UNIKALNYCH EXPORTÓW -----------------
const exportsSet = new Set<string>();
const lines: string[] = [];

for (const file of files) {
  // Tworzymy względną ścieżkę względem folderu src
  const relativePath = './' + path.relative(path.join(__dirname, '..'), file)
    .replace(/\\/g, '/')
    .replace(/\.ts$/, '');

  // Nazwa modułu – nazwa pliku bez rozszerzenia
  const moduleName = path.basename(file, '.ts');

  if (!exportsSet.has(moduleName)) {
    lines.push(`export * as ${moduleName} from '${relativePath}';`);
    exportsSet.add(moduleName);
  }
}

// ----------------- ZAPIS DO PLIKU -----------------
fs.writeFileSync(outputFile, lines.join('\n') + '\n');

console.log(`✅ Imports generated with patch feel: ${outputFile}`);