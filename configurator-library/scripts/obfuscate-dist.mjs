import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const sourceDir = path.resolve('dist');
const outputDir = path.resolve('dist-obfuscated');

await rm(outputDir, { recursive: true, force: true });
await cp(sourceDir, outputDir, { recursive: true });

const files = await readdir(outputDir);
const bundleFiles = files.filter(
  (file) =>
    /^three-configurator\.(?:es|cjs|umd)\.js$/.test(file),
);

if (bundleFiles.length === 0) {
  throw new Error(`No three-configurator bundles found in ${outputDir}`);
}

await Promise.all(
  bundleFiles.map(async (file) => {
    const filePath = path.join(outputDir, file);
    const source = await readFile(filePath, 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(source, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      selfDefending: false,
      stringArray: false,
      transformObjectKeys: false,
    });

    await writeFile(filePath, obfuscated.getObfuscatedCode(), 'utf8');
    console.log(`Obfuscated ${path.relative(process.cwd(), filePath)}`);
  }),
);
