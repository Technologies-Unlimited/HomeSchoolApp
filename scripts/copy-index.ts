import { mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const sourcePath = path.join(projectRoot, "index.html");
const targetPath = path.join(distDir, "index.html");

await mkdir(distDir, { recursive: true });
const contents = await Bun.file(sourcePath).text();
await Bun.write(targetPath, contents);
