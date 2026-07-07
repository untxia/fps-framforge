// api/assistant.js — proxy IA sécurisé (Groq) AVEC contrôle du palier côté serveur.
// La clé reste serveur. Le palier n'est PAS décidé par le client : il est plafonné par la base.
//
// Variable d'environnement requise (à créer dans Vercel, JAMAIS dans un fichier versionné) :
//   GROQ_API_KEY = gsk_...              (console : https://console.groq.com/keys)
// Optionnel :
//   GROQ_MODEL   = llama-3.3-70b-versatile   (par défaut ; ex. llama-3.1-8b-instant)
//
// Front (prod) -> POST /api/assistant  body:{ messages, tier, ctx }  + header Authorization: Bearer <token utilisateur>
import { limiteAtteinte, ipDe } from "./ratelimit.js";
import { tierServeur, tokenDe } from "./tier.js";

const ORDER = { gratuit: 0, pro: 1, elite: 2 };
const NAME = ["gratuit", "pro", "elite"];

function instructions(tier, en) {
  if (en) {
    if (tier === "elite")
      return " ELITE TIER: proactive expert. Give a personalized, step-by-step optimization plan tailored to the exact setup, anticipate bottlenecks, suggest a SAFE undervolt/curve, and a complete structured action plan.";
    if (tier === "pro")
      return " PRO TIER: detailed answers, all games, precise BIOS and RAM settings (XMP/EXPO, PBO, timings), before/after comparisons.";
    return " FREE TIER: short, general answers (3-4 sentences). For detailed BIOS settings, custom profiles and advanced optimization, invite the user to upgrade to Pro (€4.99) or Elite (€9.99).";
  }
  if (tier === "elite")
    return " NIVEAU ELITE : expert proactif. Plan d'optimisation personnalisé étape par étape adapté à la config exacte, anticipe les goulots, propose une courbe/undervolt SÛRE, plan d'action complet et structuré.";
  if (tier === "pro")
    return " NIVEAU PRO : réponses détaillées, tous les jeux, réglages BIOS et RAM précis (XMP/EXPO, PBO, timings), comparaisons avant/après.";
  return " NIVEAU GRATUIT : réponses courtes et générales (3-4 phrases). Pour les réglages BIOS détaillés et l'optimisation avancée, invite à passer en Pro (4,99€) ou Elite (9,99€).";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.SITE_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) return res.status(500).json({ error: "GROQ_API_KEY manquante côté serveur" });
  const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (await limiteAtteinte("assistant", ipDe(req), 20, 600)) {
    return res.status(429).json({ error: "Trop de requêtes, réessaie dans quelques minutes." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { messages, tier: demande, ctx, lang } = body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages[] requis" });

    // Palier effectif = min(demandé, palier réel en base) -> impossible de tricher côté client
    const dbTier = await tierServeur(tokenDe(req));
    const eff = NAME[Math.min(ORDER[demande] ?? 0, ORDER[dbTier])];
    const en = lang === "en";

    const systeme = (en
        ? "You are the AI assistant for FRAMEFORGE, an FPS optimization tool for competitive PC gaming. "
        : "Tu es l'assistant IA de FRAMEFORGE, un outil d'optimisation des FPS pour le jeu compétitif sur PC. ")
      + (ctx ? ((en ? "User's current setup: " : "Config de l'utilisateur : ") + String(ctx).slice(0, 500) + ". ") : "")
      + (en
        ? "Reply in English, clear and actionable, with no dangerous advice (no extreme overvolting). Don't invent precise benchmark numbers."
        : "Réponds en français, clair et actionnable, sans conseils dangereux (pas d'overvolt extrême). N'invente pas de chiffres de benchmark précis.")
      + instructions(eff, en);

    // Format OpenAI-compatible (Groq) : le system prompt est un message "system"
    const msgs = [{ role: "system", content: systeme }].concat(
      messages.slice(-12).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 4000),
      }))
    );

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: msgs }),
    });
    const raw = await r.text();
    let data; try { data = JSON.parse(raw); } catch (e) { data = null; }
    if (!r.ok) {
      console.error("Groq error", r.status, raw);
      return res.status(r.status).json({ error: data?.error?.message || data?.error || raw.slice(0, 500) || "Erreur Groq" });
    }

    // Réponse normalisée pour le front : { reply }
    const reply = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply, raw: data });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur assistant" });
  }
}
