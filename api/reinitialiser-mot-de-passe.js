// api/reinitialiser-mot-de-passe.js — confirme la réinitialisation avec le jeton reçu par email.
// POST /api/reinitialiser-mot-de-passe  body: { token, password }
import bcrypt from "bcryptjs";
import { query } from "./_lib/db.js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { token, password } = body;
    if (!token || !password) return res.status(400).json({ error: "token et mot de passe requis" });
    if (password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum" });
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const r = await query(
      `SELECT id_jeton, id_utilisateur FROM jeton_action
        WHERE jeton_hash=$1 AND type='reinitialisation_mdp' AND utilise_le IS NULL AND expire_le > now()`,
      [hash]
    );
    if (!r.rows.length) return res.status(400).json({ error: "Lien invalide ou expiré" });
    const { id_jeton, id_utilisateur } = r.rows[0];

    const nouveauHash = await bcrypt.hash(password, 10);
    await query(`UPDATE utilisateur SET mot_de_passe_hash=$1 WHERE id_utilisateur=$2`, [nouveauHash, id_utilisateur]);
    await query(`UPDATE jeton_action SET utilise_le=now() WHERE id_jeton=$1`, [id_jeton]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
