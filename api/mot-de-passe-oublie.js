// api/mot-de-passe-oublie.js — demande de réinitialisation de mot de passe.
// POST /api/mot-de-passe-oublie  body: { email }
// Répond toujours avec succès générique (ne révèle jamais si l'email existe en base).
import { query } from "./_lib/db.js";
import { envoyerEmail } from "./_lib/email.js";
import { limiteAtteinte, ipDe } from "./_lib/ratelimit.js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (await limiteAtteinte("mdp-oublie", ipDe(req), 6, 600)) {
    return res.status(429).json({ error: "Trop de demandes, réessaie dans quelques minutes." });
  }
  const REPONSE_GENERIQUE = { ok: true, message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "email requis" });

    const r = await query(`SELECT id_utilisateur FROM utilisateur WHERE email=$1`, [email]);
    if (r.rows.length) {
      const id_utilisateur = r.rows[0].id_utilisateur;
      const jeton = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(jeton).digest("hex");
      const expire = new Date(Date.now() + 3600 * 1000);
      await query(
        `INSERT INTO jeton_action (id_utilisateur, type, jeton_hash, expire_le) VALUES ($1,'reinitialisation_mdp',$2,$3)`,
        [id_utilisateur, hash, expire]
      );
      const site = process.env.SITE_URL || "";
      const lien = site + "/?reset=" + jeton;
      await envoyerEmail(email, "Réinitialise ton mot de passe FRAMEFORGE",
        `<p>Tu as demandé à réinitialiser ton mot de passe.</p><p>Ce lien est valable 1h :</p><p><a href="${lien}">${lien}</a></p><p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`
      );
    }
    return res.status(200).json(REPONSE_GENERIQUE);
  } catch (e) {
    return res.status(200).json(REPONSE_GENERIQUE);
  }
}
