// api/checkout.js
// Crée une session de paiement Stripe Checkout pour les abonnements Pro / Elite.
// Compatible Vercel. (npm i stripe)
//
// Variables d'environnement requises :
//   STRIPE_SECRET_KEY   = sk_live_... ou sk_test_...
//   STRIPE_PRICE_PRO    = price_...   (ID du prix Pro 4,99€/mois créé dans Stripe)
//   STRIPE_PRICE_ELITE  = price_...   (ID du prix Elite 9,99€/mois)
//   SITE_URL            = https://ton-domaine.com

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRICES = {
  pro: process.env.STRIPE_PRICE_PRO,
  elite: process.env.STRIPE_PRICE_ELITE,
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const price = PRICES[body.plan];
    if (!price) return res.status(400).json({ error: "Plan inconnu (pro|elite)" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.SITE_URL}/?paiement=succes`,
      cancel_url: `${process.env.SITE_URL}/?paiement=annule#tarifs`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/*
  CÔTÉ FRONT (à brancher sur les boutons "Passer en Pro" / "Choisir Elite") :

    async function checkout(plan){
      const r = await fetch("/api/checkout", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body: JSON.stringify({ plan })
      });
      const { url } = await r.json();
      if (url) window.location.href = url;   // redirige vers la page de paiement Stripe
    }

  IMPORTANT : le déblocage réel des fonctions Pro/Elite doit se faire CÔTÉ SERVEUR
  (via un webhook Stripe qui marque l'utilisateur comme abonné), jamais seulement
  en JS côté client — sinon n'importe qui peut contourner le paiement.
*/
