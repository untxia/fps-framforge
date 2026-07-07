// api/email.js — envoi d'email via Resend (https://resend.com). Aucune dépendance à installer (fetch natif).
//
// Variables d'environnement requises :
//   RESEND_API_KEY = re_...                        (console : https://resend.com/api-keys)
// Optionnel :
//   RESEND_FROM    = FRAMEFORGE <no-reply@ton-domaine.com>   (par défaut : onboarding@resend.dev, limité à ton propre email en mode test)
//
// ⚠️ Tant que ton domaine n'est pas vérifié sur Resend, l'expéditeur par défaut
// (onboarding@resend.dev) ne peut envoyer qu'à l'adresse email de ton compte Resend.
// Une fois ton domaine vérifié (Resend → Domains), mets RESEND_FROM sur ce domaine.

export async function envoyerEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("RESEND_API_KEY manquante — email non envoyé:", subject, "->", to); return false; }
  const from = process.env.RESEND_FROM || "FRAMEFORGE <onboarding@resend.dev>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": "Bearer " + key },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!r.ok) { console.error("Erreur envoi email Resend:", r.status, await r.text()); return false; }
    return true;
  } catch (e) {
    console.error("Erreur réseau envoi email:", e.message);
    return false;
  }
}
