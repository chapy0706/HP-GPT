// /scripts/static-server.mjs
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { port: 4173, root: path.resolve(__dirname, "..") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port" && argv[i + 1]) {
      args.port = Number(argv[++i]);
    } else if (a === "--root" && argv[i + 1]) {
      args.root = path.resolve(argv[++i]);
    }
  }
  return args;
}

const { port, root } = parseArgs(process.argv.slice(2));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) {
    return null;
  }
  return targetPath;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // Basic security headers (doesn't try to be a CSP solution).
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "no-referrer");

    let filePath;

    if (pathname === "/" || pathname === "") {
      filePath = path.join(root, "index.html");
    } else {
      const joined = safeJoin(root, pathname.replace(/^\//, ""));
      if (!joined) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad Request");
        return;
      }
      filePath = joined;
    }

    // Serve directories as index.html
    try {
      const st = await fs.stat(filePath);
      if (st.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      // ignore
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    const body = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(body);
  } catch (e) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

server.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`static-server: http://127.0.0.1:${port} (root: ${root})`);
});
