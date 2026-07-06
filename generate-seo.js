// generate-seo.js — génère une page SEO par (jeu disponible × GPU) depuis le VRAI catalogue du site.
// Usage : node generate-seo.js          (lit index.html ou frameforge.html)
// Produit : ./reglages/*.html + sitemap.xml
import fs from "fs";

const SITE = process.env.SITE_URL || "https://frameforge.example.com";
const src = fs.existsSync("index.html") ? "index.html" : "frameforge.html";
const html = fs.readFileSync(src, "utf8");

function arr(name) {
  const m = html.match(new RegExp("const " + name + "=\\[([\\s\\S]*?)\\];"));
  if (!m) throw new Error(name + " introuvable dans " + src);
  return new Function("return [" + m[1] + "]")();
}
const GPUS = arr("GPUS"), CPUS = arr("CPUS"), GAMES = arr("GAMES");
const REF_CPU = CPUS.reduce((a, b) => (b.s > a.s ? b : a)); // meilleur CPU comme référence

const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// même modèle que le site (1080p, preset compétitif 15)
function estime(gpu, game) {
  const qF = 1.45 - (15 / 100) * 0.74;
  const fpsGpu = gpu.s * game.gc * 1.0 * qF;
  const fpsCpu = REF_CPU.s * game.cc * 1.0 * (0.92 + 0.08 * qF);
  const fps = Math.max(28, Math.min(720, Math.min(fpsGpu, fpsCpu)));
  return { fps: Math.round(fps), low: Math.round(fps * 0.82), goulot: fpsGpu < fpsCpu ? "GPU" : "CPU" };
}

const CSS = `*{margin:0;box-sizing:border-box}body{background:#080b11;color:#e9eef7;font-family:system-ui,sans-serif;line-height:1.65;background-image:linear-gradient(rgba(120,200,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(120,200,255,.06) 1px,transparent 1px);background-size:54px 54px}.w{max-width:760px;margin:0 auto;padding:48px 20px}h1{font-size:1.9rem;line-height:1.2;margin-bottom:10px}.k{color:#19d6ff}.mut{color:#8593a8}.fps{font-size:4rem;font-weight:700;color:#19d6ff;margin:22px 0 4px}.fps small{font-size:1.1rem;color:#8593a8}table{width:100%;border-collapse:collapse;margin:22px 0;font-size:.95rem}td{padding:10px 8px;border-bottom:1px dashed rgba(120,200,255,.18)}td:last-child{text-align:right;color:#19d6ff;font-family:monospace}.cta{display:inline-block;background:#19d6ff;color:#00121a;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:10px;margin-top:18px}.note{font-size:.8rem;color:#5d6a80;margin-top:26px}a.back{color:#8593a8;font-size:.85rem;text-decoration:none}`;

fs.mkdirSync("reglages", { recursive: true });
const urls = [];
let n = 0;

for (let j = 0; j < GAMES.length; j++) {
  const game = GAMES[j];
  if (game.soon) continue;
  for (let g = 0; g < GPUS.length; g++) {
    const gpu = GPUS[g];
    const e = estime(gpu, game);
    const s = `${slug(game.l)}-${slug(gpu.l)}`;
    const titre = `Meilleurs réglages ${game.l} avec ${gpu.l} — FPS estimés`;
    const rows = (game.set || []).map(x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td></tr>`).join("");
    const page = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titre)}</title>
<meta name="description" content="Réglages optimaux ${esc(game.l)} sur ${esc(gpu.l)} : ${e.fps} FPS estimés en 1080p compétitif, limité par le ${e.goulot}. Paramètres recommandés et configurateur gratuit.">
<link rel="canonical" href="${SITE}/reglages/${s}"><style>${CSS}</style></head><body><div class="w">
<a class="back" href="/">← FRAMEFORGE</a>
<h1>Réglages <span class="k">${esc(game.l)}</span> avec ${esc(gpu.l)}</h1>
<p class="mut">Estimation en 1080p, preset compétitif, avec un processeur haut de gamme (${esc(REF_CPU.l)}).</p>
<div class="fps">${e.fps} <small>FPS estimés</small></div>
<p class="mut">1% low ≈ ${e.low} fps · limité par le <b class="k">${e.goulot}</b></p>
<table>${rows}</table>
<a class="cta" href="/?g=${g}&j=${j}&res=1080&q=15#configurateur">Affiner avec MA config →</a>
<p class="note">Chiffres estimés par le modèle FRAMEFORGE (composant, jeu, résolution, preset) — les FPS réels varient selon la scène, les pilotes et le refroidissement. Aide-nous à calibrer en soumettant tes FPS réels dans le configurateur.</p>
</div></body></html>`;
    fs.writeFileSync(`reglages/${s}.html`, page);
    urls.push(`${SITE}/reglages/${s}`);
    n++;
  }
}

// Index /reglages/ : hub de maillage interne (aide Google a decouvrir les 500+ pages)
{
  const parJeu = {};
  for (const u of urls) {
    const s = u.split("/").pop();
    const jeu = GAMES.filter(x=>!x.soon).find(x => s.startsWith(slug(x.l)+"-"));
    (parJeu[jeu ? jeu.l : "Autres"] ||= []).push(s);
  }
  const blocs = Object.entries(parJeu).map(([jeu, slugs]) =>
    `<h2>${esc(jeu)}</h2><ul>` + slugs.map(s => `<li><a href="${s}">${esc(s.replace(/-/g," "))}</a></li>`).join("") + `</ul>`).join("");
  const idx = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tous les réglages FPS par jeu et carte graphique · FRAMEFORGE</title>
<meta name="description" content="Index complet des guides de réglages FPS FRAMEFORGE : chaque jeu compétitif optimisé pour chaque carte graphique.">
<link rel="canonical" href="${SITE}/reglages/"><style>${CSS} h2{margin-top:26px;color:#19d6ff;font-size:1.1rem}ul{list-style:none;columns:2;gap:24px}li{padding:3px 0}li a{color:#c6cfdd;text-decoration:none;font-size:.88rem}li a:hover{color:#19d6ff}@media(max-width:600px){ul{columns:1}}</style></head><body><div class="w">
<a class="back" href="/">← FRAMEFORGE</a>
<h1>Tous les <span class="k">réglages</span> par jeu &amp; GPU</h1>
<p class="mut">${urls.length} guides générés depuis le catalogue FRAMEFORGE.</p>
${blocs}
<a class="cta" href="/#configurateur">Ouvrir le configurateur →</a>
</div></body></html>`;
  fs.writeFileSync("reglages/index.html", idx);
}

const fixes = [`${SITE}/`, `${SITE}/reglages/`, `${SITE}/en.html`, `${SITE}/guides/index.html`, `${SITE}/guides/bios-asus.html`, `${SITE}/guides/bios-msi.html`, `${SITE}/guides/bios-gigabyte.html`];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fixes.map(u => `  <url><loc>${u}</loc><priority>${u.endsWith("/") ? "1.0" : "0.8"}</priority></url>`).join("\n")}
${urls.map(u => `  <url><loc>${u}</loc><priority>0.7</priority></url>`).join("\n")}
</urlset>`;
fs.writeFileSync("sitemap.xml", sitemap);
console.log(`Généré ${n} pages SEO dans ./reglages/ + sitemap.xml (${urls.length + fixes.length} URLs)`);
