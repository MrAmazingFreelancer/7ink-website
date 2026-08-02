import { rmSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const outDirName = ".cf-assets";
const outDir = join(rootDir, outDirName);

rmSync(outDir, { recursive: true, force: true });
console.log(`Static deployment uses the repository root; no ${outDirName} build artifact is generated.`);
