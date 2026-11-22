import fs from "node:fs";
import path from "node:path";

/**
 * Every name imported from lucide-react in lib/icons.ts must be exported by the installed package.
 * This runs after `pnpm install`, so a wrong icon name fails here, before the build.
 *
 * It is a text check on the package's typings: a name must appear in them as a whole word. A name
 * that is absent is always caught. A name that happens to appear in a comment would slip through,
 * so the typecheck remains the authority.
 */
const ROOT = process.cwd();
const iconsSource = fs.readFileSync(path.join(ROOT, "lib/icons.ts"), "utf8");
const importBlock = iconsSource.match(/import \{([\s\S]*?)\} from "lucide-react";/)?.[1] ?? "";
const names = importBlock.split(",").map((s) => s.trim()).filter(Boolean);

const distDir = path.join(ROOT, "node_modules/lucide-react/dist");
if (!fs.existsSync(distDir)) {
  console.log("lucide-react is not installed yet; skipping the icon export check.");
  process.exit(0);
}
const typings = fs
  .readdirSync(distDir)
  .filter((f) => /\.d\.m?ts$/.test(f))
  .map((f) => fs.readFileSync(path.join(distDir, f), "utf8"))
  .join("\n");
if (!typings) {
  console.error("lucide-react is installed but no typings were found in dist/. Check the installed version.");
  process.exit(1);
}

const missing = names.filter((n) => !new RegExp(`\\b${n}\\b`).test(typings));
if (missing.length > 0) {
  console.error(`lib/icons.ts imports ${missing.length} name(s) lucide-react does not export: ${missing.join(", ")}`);
  console.error("Pick the closest existing name in lib/icons.ts and re-run.");
  process.exit(1);
}
console.log(`${names.length} lucide-react imports in lib/icons.ts are all exported by the installed package.`);
