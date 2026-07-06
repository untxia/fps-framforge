# 🚀 FRAMEFORGE — Guide de déploiement & mise en production

Ce guide relie tous les fichiers du projet. Ordre conseillé : **1 → 6**.

## Arborescence cible (sur Vercel)
```
/
├── index.html              ← renommer frameforge.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── vercel.json             ← en-têtes de sécurité (CSP, etc.)
├── images/                 ← (optionnel) photos en local (WebP)
├── reglages/               ← pages SEO générées par generate-seo.js
└── api/
    ├── assistant.js        ← proxy IA (clé côté serveur)
    ├── checkout.js         ← paiement Stripe
    ├── webhook.js          ← activation des abonnements
    ├── auth.js             ← inscription / connexion
    ├── benchmark.js        ← FPS réels (calibrage)
    └── db.js               ← connexion PostgreSQL
```

---

## 1. Déployer la vitrine (5 min)
1. Renomme `frameforge.html` → `index.html`.
2. Crée un compte **Vercel** (ou Netlify), « New Project » → importe le dossier (ou glisser-dépose).
3. Déploie. ✅ Les **photos** et tous les effets s'affichent (plus de blocage d'aperçu).

## 2. Base de données PostgreSQL
1. Crée une base (Neon, Supabase, Vercel Postgres… offre gratuite suffisante).
2. Exécute `frameforge-mpd.sql` dessus (crée les tables + données d'amorçage).
3. Variable d'env : `DATABASE_URL = postgres://…`.

## 3. Comptes utilisateurs (auth)
1. `npm i pg bcryptjs jsonwebtoken` (Vercel installe via `package.json`).
2. Place `auth.js` et `db.js` dans `api/`.
3. Variable d'env : `JWT_SECRET = <chaîne longue aléatoire>`.
4. Côté front : ajoute un formulaire connexion/inscription qui appelle `POST /api/auth` et stocke le `token`.

## 4. Assistant IA en ligne
1. Place `assistant.js` dans `api/`.
2. Variable d'env : `ANTHROPIC_API_KEY = sk-ant-…`.
3. Dans `index.html`, remplace l'appel direct par `fetch("/api/assistant", …)` (le serveur garde la clé).
4. Ajoute un **rate limit** (Upstash/Vercel KV) — ~20 requêtes / 10 min / IP.

## 5. Paiement Stripe (abonnements)
1. Compte Stripe → crée 2 prix récurrents : Pro 4,99€/mois, Elite 9,99€/mois.
2. Place `checkout.js` + `webhook.js` dans `api/`. `npm i stripe`.
3. Variables d'env : `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`.
4. Branche les boutons « Passer en Pro / Choisir Elite » sur `checkout(plan)` (exemple dans `checkout.js`).
5. Configure le **webhook** Stripe → URL `https://ton-domaine/api/webhook` (active le palier après paiement).
6. ⚠️ Le déblocage des fonctions Pro/Elite doit être vérifié **côté serveur** (jamais seulement en JS).

## 6. Croissance
- **FPS réels** : ajoute un formulaire « soumettre mon FPS » → `POST /api/benchmark`. Remplace progressivement les estimations.
- **SEO programmatique** : `node generate-seo.js` → crée `reglages/*.html` + `sitemap.xml`. Branche-le sur tout ton catalogue.
- **Affiliation** : dans `index.html`, renseigne `AFFILIATE.amazon = "tontag-21"` → commissions sur les achats.
- **Newsletter** : renseigne `NEWSLETTER_ENDPOINT` (Formspree/Mailchimp) dans `index.html`.
- **Analytics** : décommente la balise Plausible dans `<head>` avec ton domaine.

---

## Récap des variables d'environnement
| Variable | Pour |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | auth |
| `ANTHROPIC_API_KEY` | assistant IA |
| `STRIPE_SECRET_KEY` | paiement |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE` | abonnements |
| `STRIPE_WEBHOOK_SECRET` | webhook |
| `SITE_URL` | redirections Stripe / CORS |

## Sécurité (déjà préparée)
- En-têtes CSP / anti-clickjacking dans `vercel.json`.
- Clés API jamais exposées au navigateur (tout passe par `api/`).
- Mots de passe hachés (bcrypt), contraintes et déclencheur dans la base.
- À ajouter : rate limit sur `api/assistant` et validation stricte des entrées.


---

## 🔐 Comptes, paliers & Stripe (câblage front + serveur)

Ces éléments sont maintenant **codés** ; il reste à déployer + remplir tes clés.

### Fichier de config unique (dans `index.html`)
En haut du script, un objet `FF_CONFIG` centralise tout ce que tu dois renseigner :
```js
const FF_CONFIG = {
  apiBase: "",            // "" = même domaine (Vercel)
  affiliateAmazon: "",    // ton tag Amazon Partenaires
  newsletterEndpoint: "", // ton URL Formspree/Mailchimp
  plausibleDomain: ""     // ton domaine (analytics)
};
```
Le **domaine** (canonical / og:url) se corrige tout seul une fois en ligne (basé sur l'URL réelle).
L'**image de partage** `og-image.png` est fournie (générée aux couleurs du site).

### Dépendances API
`package.json` est fourni (pg, bcryptjs, jsonwebtoken, stripe) → Vercel installe tout seul.

### Comptes utilisateurs (déjà branché côté front)
- Bouton **Connexion** dans la nav → modale connexion/inscription → appelle `POST /api/auth`.
- Le token JWT est stocké et le **palier** de l'utilisateur s'affiche à côté de son pseudo.
- `auth.js` renvoie le palier réel ; `me.js` permet de le re-vérifier.
- La **sauvegarde de profils** est réservée aux connectés.

### Verrouillage du palier CÔTÉ SERVEUR (anti-triche)
`assistant.js` **ne fait plus confiance au client** : il lit le token, calcule le palier réel en base, et **plafonne** le niveau de réponse (un gratuit ne peut pas obtenir l'assistant Elite, même en trafiquant le JS).
➡️ En prod, fais appeler l'assistant ainsi (au lieu de l'appel direct de démo) :
```js
fetch(FF_CONFIG.apiBase + "/api/assistant", {
  method: "POST",
  headers: { "content-type": "application/json", "authorization": "Bearer " + localStorage.getItem("ff_token") },
  body: JSON.stringify({ messages: history, tier, ctx: /* résumé config */ })
});
```

### Stripe (boutons déjà branchés)
- « Passer en Pro » / « Choisir Elite » appellent `POST /api/checkout` (redirige vers le paiement).
- `webhook.js` mappe le prix Stripe → la bonne offre et **active l'abonnement** en base.
- Variables : `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`, + `ANTHROPIC_API_KEY`, `JWT_SECRET`, `DATABASE_URL`.

### Ce qui reste (uniquement de ton côté)
Créer les comptes (Vercel, Stripe, Anthropic, base), y mettre les clés, exécuter `frameforge-mpd.sql`, déployer. Le code, lui, est prêt.
