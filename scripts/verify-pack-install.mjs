import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tgz = path.join(root, "pixelproof-cli-0.1.0-rc.1.tgz");
const fixtures = path.join(root, "tests", "fixtures");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed (${r.status})\n${r.stdout}\n${r.stderr}`,
    );
  }
  return r;
}

if (!existsSync(tgz)) {
  throw new Error(`missing tarball: ${tgz}`);
}

const tmp = mkdtempSync(path.join(tmpdir(), "pixelproof-rc-"));
console.log("TMP=" + tmp);

try {
  run("npm", ["install", tgz], { cwd: tmp });
  run("npx", ["playwright", "install", "chromium"], { cwd: tmp });

  const help = run("npx", ["pixelproof", "--help"], { cwd: tmp });
  console.log(help.stdout.trim().split("\n")[0]);
  const ver = run("npx", ["pixelproof", "--version"], { cwd: tmp });
  const version = ver.stdout.trim();
  console.log("VERSION=" + version);
  if (version !== "0.1.0-rc.1") {
    throw new Error(`expected CLI version 0.1.0-rc.1, got ${version}`);
  }

  const imgOut = path.join(tmp, "out-img");
  run(
    "npx",
    [
      "pixelproof",
      "compare",
      "--target",
      path.join(fixtures, "diff-a.png"),
      "--actual",
      path.join(fixtures, "diff-b.png"),
      "--out",
      imgOut,
    ],
    { cwd: tmp },
  );
  for (const f of [
    "index.html",
    "result.json",
    "fix-instructions.md",
    "diff.png",
  ]) {
    if (!existsSync(path.join(imgOut, f))) throw new Error("missing " + f);
  }
  console.log("IMAGE_COMPARE=ok");

  // Independent loopback server for URL mode
  const html =
    "<!doctype html><html><body style='margin:0;background:#fff'><div style='width:120px;height:80px;background:#0af'></div></body></html>";
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  // Create a matching-size target from existing fixture via sharp in installed package tree
  const sharpPath = path.join(tmp, "node_modules", "sharp");
  const sharp = (await import("file://" + sharpPath + "/lib/index.js")).default;
  const targetPath = path.join(tmp, "target-url.png");
  await sharp({
    create: {
      width: 120,
      height: 80,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toFile(targetPath);

  const urlOut = path.join(tmp, "out-url");
  const urlProc = spawn(
    "npx",
    [
      "pixelproof",
      "compare",
      "--target",
      targetPath,
      "--url",
      `http://127.0.0.1:${port}`,
      "--viewport",
      "120x80",
      "--out",
      urlOut,
    ],
    { cwd: tmp, shell: process.platform === "win32" },
  );
  let stdout = "";
  let stderr = "";
  urlProc.stdout.on("data", (d) => {
    stdout += d;
  });
  urlProc.stderr.on("data", (d) => {
    stderr += d;
  });
  const urlCode = await new Promise((resolve) =>
    urlProc.on("close", resolve),
  );
  server.close();
  if (![0, 10].includes(urlCode)) {
    throw new Error(`URL compare failed (${urlCode})\n${stdout}\n${stderr}`);
  }
  if (!existsSync(path.join(urlOut, "index.html"))) {
    throw new Error("url missing index.html");
  }
  console.log("URL_COMPARE=ok exit=" + urlCode);
  console.log("ISOLATED_INSTALL=ok");
  writeFileSync(
    path.join(root, "scripts", ".last-pack-verify.json"),
    JSON.stringify({ tmp, urlCode, version: ver.stdout.trim() }, null, 2),
  );
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  // Keep tmp for inspection on failure; remove on success
  if (process.exitCode !== 1) {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
