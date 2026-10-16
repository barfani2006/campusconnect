const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

let listings = [
  { id: 1, category: "Books", title: "Engineering Mathematics — Vol. 1", detail: "Second-hand · Good condition · Semester 1", price: 220, seller: "Aarav", badge: "Student listing", icon: "📚" },
  { id: 2, category: "Food", title: "Campus Café Combo", detail: "Sandwich + cold coffee · Today’s offer", price: 99, seller: "Campus Café", badge: "Local offer", icon: "☕" },
  { id: 3, category: "Essentials", title: "Scientific Calculator", detail: "Used for one semester · Working well", price: 350, seller: "Mehak", badge: "Student listing", icon: "🧮" },
  { id: 4, category: "Events", title: "Design & Build Workshop", detail: "Friday · Student Innovation Club", price: 0, seller: "Innovation Club", badge: "Campus event", icon: "🎟️" },
  { id: 5, category: "Opportunities", title: "Peer Project: Campus Media", detail: "Looking for writers and photographers", price: 0, seller: "Student Community", badge: "Join opportunity", icon: "✨" },
  { id: 6, category: "Study", title: "Calculus Revision Pack", detail: "Faculty-approved revision resources", price: 0, seller: "Study Hub", badge: "Authorized resource", icon: "📝" }
];
let nextId = 7;

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (url.pathname === "/api/health") return send(res, 200, { ok: true, name: "CampusConnect API" });
  if (url.pathname === "/api/listings" && req.method === "GET") {
    const category = url.searchParams.get("category") || "All";
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const results = listings.filter(x => (category === "All" || x.category === category) &&
      `${x.title} ${x.detail} ${x.seller} ${x.category}`.toLowerCase().includes(q));
    return send(res, 200, { listings: results });
  }
  if (url.pathname === "/api/listings" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const allowed = ["Books", "Food", "Essentials", "Events", "Study", "Opportunities"];
      if (!body.title || !body.category || !allowed.includes(body.category)) return send(res, 400, { error: "Add a title and choose a valid category." });
      const item = {
        id: nextId++, category: body.category, title: String(body.title).slice(0, 90),
        detail: String(body.detail || "New community listing").slice(0, 160),
        price: Math.max(0, Number(body.price) || 0),
        seller: String(body.seller || "Campus community").slice(0, 60),
        badge: "Community submission",
        icon: ({Books:"📚",Food:"☕",Essentials:"🎒",Events:"🎟️",Study:"📝",Opportunities:"✨"})[body.category]
      };
      listings.unshift(item);
      return send(res, 201, { listing: item, message: "Listing added to this demo session." });
    } catch { return send(res, 400, { error: "Could not read the submitted listing." }); }
  }
  if (url.pathname.startsWith("/api/listings/") && req.method === "GET") {
    const id = Number(url.pathname.split("/").pop());
    const item = listings.find(x => x.id === id);
    return item ? send(res, 200, item) : send(res, 404, { error: "Listing not found." });
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(ROOT, safe);
  if (!full.startsWith(ROOT)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(full)] || "application/octet-stream",
      "Content-Length": data.length,
      "X-Content-Type-Options": "nosniff"
    });
    res.end(data);
  });
});
server.listen(PORT, () => console.log(`CampusConnect running at http://localhost:${PORT}`));