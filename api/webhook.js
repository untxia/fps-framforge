// api/webhook.js — webhook Stripe : active le bon palier après paiement. npm i stripe pg
import Stripe from "stripe";
import { query } from "./_lib/db.js";

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// prix Stripe -> nom d'offre en base
const PRIX_VERS_OFFRE = {
  [process.env.STRIPE_PRICE_PRO]: "Pro",
  [process.env.STRIPE_PRICE_ELITE]: "Elite",
};

function readRaw(req) {
  return new Promise((resolve) => { let d = ""; req.on("data", c => (d += c)); req.on("end", () => resolve(Buffer.from(d))); });
}

async function activer(email, priceId, subId) {
  if (!email) return;
  const offreNom = PRIX_VERS_OFFRE[priceId] || "Pro";
  const o = await query(`SELECT id_offre FROM offre WHERE nom=$1`, [offreNom]);
  const u = await query(`SELECT id_utilisateur FROM utilisateur WHERE email=$1`, [email.toLowerCase()]);
  if (!o.rows.length || !u.rows.length) return;
  const idOffre = o.rows[0].id_offre, idUser = u.rows[0].id_utilisateur;
  // termine les abonnements actifs puis en crée un nouveau
  await query(`UPDATE abonnement SET statut='annule' WHERE id_utilisateur=$1 AND statut='actif'`, [idUser]);
  await query(
    `INSERT INTO abonnement (id_utilisateur, id_offre, statut, stripe_subscription_id)
     VALUES ($1,$2,'actif',$3)`, [idUser, idOffre, subId || null]);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send(`Signature invalide: ${err.message}`); }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const email = s.customer_details?.email || s.customer_email;
      const line = await stripe.checkout.sessions.listLineItems(s.id, { limit: 1 });
      const priceId = line.data[0]?.price?.id;
      await activer(email, priceId, s.subscription);
    }
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await query(`UPDATE abonnement SET statut='expire' WHERE stripe_subscription_id=$1`, [sub.id]);
    }
    res.json({ received: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
