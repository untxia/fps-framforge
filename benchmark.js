// api/benchmark.js — FPS réels soumis par la communauté (calibrage du modèle).
// POST { jeu, gpu, cpu, resolution, preset, fps_moyen, fps_1low? }  (noms — mappés en ids)
// GET  ?jeu=...&gpu=...  -> moyenne communautaire
import { query } from "./db.js";

async function idJeu(nom){ const r=await query(`SELECT id_jeu FROM jeu WHERE nom=$1`,[nom]); return r.rows[0]?.id_jeu; }
async function idCompo(nom){ const r=await query(`SELECT id_composant FROM composant WHERE nom=$1`,[nom]); return r.rows[0]?.id_composant; }

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { jeu, gpu, cpu, resolution, preset, fps_moyen, fps_1low } = b;
      const fps = parseInt(fps_moyen);
      if (!jeu || !gpu || !cpu || !fps || fps < 1 || fps > 2000)
        return res.status(400).json({ error: "champs invalides" });
      const [ij, ig, ic] = await Promise.all([idJeu(jeu), idCompo(gpu), idCompo(cpu)]);
      if (!ij || !ig || !ic) return res.status(400).json({ error: "jeu ou composant inconnu" });
      await query(
        `INSERT INTO benchmark (id_jeu, id_gpu, id_cpu, resolution, preset, fps_moyen, fps_1low, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'soumission_utilisateur')`,
        [ij, ig, ic, resolution || 1080, preset || 0, fps, fps_1low || null]
      );
      return res.status(201).json({ ok: true });
    }
    if (req.method === "GET") {
      const { jeu, gpu } = req.query;
      const r = await query(
        `SELECT ROUND(AVG(b.fps_moyen)) AS fps_moyen, ROUND(AVG(b.fps_1low)) AS fps_1low, COUNT(*)::int AS n
           FROM benchmark b
           JOIN jeu j ON j.id_jeu=b.id_jeu
           JOIN composant c ON c.id_composant=b.id_gpu
          WHERE j.nom=$1 AND c.nom=$2`,
        [jeu, gpu]
      );
      return res.status(200).json(r.rows[0]);
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
