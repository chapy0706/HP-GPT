// /scripts/static-server.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    args.set(key.slice(2), value);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const port = Number(args.get("port") ?? "4173");
const background = args.get("background") === "true";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  // Prevent path traversal
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded.replace(/\\/g, "/");
  const joined = path.join(repoRoot, clean);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(repoRoot)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url ?? "/";
  const reqPath = reqUrl === "/" ? "/index.html" : reqUrl;
  const abs = safePath(reqPath);
  if (!abs) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad Request");
    return;
  }

  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(abs).toLowerCase();
  res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
  fs.createReadStream(abs).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  const msg = `static-server listening on http://127.0.0.1:${port}`;
  if (!background) {
    console.log(msg);
  }
  // If background mode, keep running silently.
});
