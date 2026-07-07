// api/ratelimit.js — limitation de débit simple (fenêtre fixe) basée sur la table limite_appel.
// Pas de service externe requis : réutilise la base Postgres déjà en place.
import { query } from "./db.js";

export function ipDe(req) {
  const h = req.headers["x-forwarded-for"];
  if (h) return h.split(",")[0].trim();
  return req.socket?.remoteAddress || "inconnu";
}

// route: nom de l'endpoint (ex: "assistant") ; max: nb d'appels autorisés ; fenetreSec: durée de la fenêtre
export async function limiteAtteinte(route, ip, max, fenetreSec) {
  const fenetreMs = fenetreSec * 1000;
  const debut = Math.floor(Date.now() / fenetreMs) * fenetreMs;
  const cle = route + ":" + ip + ":" + debut;
  const expire = new Date(debut + fenetreMs);
  try {
    const r = await query(
      `INSERT INTO limite_appel (cle, compteur, expire_le) VALUES ($1, 1, $2)
       ON CONFLICT (cle) DO UPDATE SET compteur = limite_appel.compteur + 1
       RETURNING compteur`,
      [cle, expire]
    );
    // nettoyage opportuniste des fenêtres expirées (non bloquant)
    query("DELETE FROM limite_appel WHERE expire_le < now()").catch(() => {});
    return r.rows[0].compteur > max;
  } catch (e) {
    // si la base est indisponible, on n'empêche pas le service de fonctionner
    console.error("Erreur rate limit:", e.message);
    return false;
  }
}
