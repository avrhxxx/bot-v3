import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(__dirname, '..', 'commands'); // folder, w którym są Twoje komendy
const outputFile = path.join(__dirname, '..', 'Imports.ts');

const files: string[] = [];

// Rekurencyjne zbieranie wszystkich .ts w folderze
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

// Tworzymy unikalne exporty
const exportsSet = new Set<string>();
const lines: string[] = [];

for (const file of files) {
  // Tworzymy względną ścieżkę względem folderu src
  const relativePath = './' + path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/').replace(/\.ts$/, '');

  // Nazwa modułu – użyjemy nazwy pliku bez rozszerzenia
  const moduleName = path.basename(file, '.ts');

  if (!exportsSet.has(moduleName)) {
    lines.push(`export * as ${moduleName} from '${relativePath}';`);
    exportsSet.add(moduleName);
  }
}

fs.writeFileSync(outputFile, lines.join('\n') + '\n');

console.log(`✅ Imports generated: ${outputFile}`);