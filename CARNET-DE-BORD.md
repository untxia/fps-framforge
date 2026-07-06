# 📓 Carnet de bord — FRAMEFORGE

> Journal de développement du projet. Mis à jour à chaque étape.
> **Projet** : site vitrine d'optimisation des FPS pour le jeu compétitif sur PC (GPU / CPU / carte mère / RAM).
> **Stack** : HTML/CSS/JS autonome · API Anthropic (assistant IA) · Stripe (abonnements) · PostgreSQL (BDD) · Merise (conception).
> **Dernière mise à jour : 29 juin 2026.**

---

## 🗂️ Fichiers du projet
| Fichier | Rôle |
|---|---|
| `frameforge.html` | Le site complet (renommer `index.html` pour la mise en ligne) |
| `assistant.js` | Backend serverless — proxy sécurisé de l'assistant IA |
| `checkout.js` | Backend serverless — paiement Stripe (Pro / Elite) |
| `README.md` | Guide de mise en production + feuille de route |
| `frameforge-mcd.mermaid` | **MCD** — diagramme entité-association |
| `frameforge-merise.md` | **MLD** + cardinalités + règles de passage Merise |
| `frameforge-mpd.sql` | **MPD** — script PostgreSQL complet |
| `CARNET-DE-BORD.md` | Ce carnet de bord |

---

## 🧭 Historique des versions

### v0.1 — Fondations du site vitrine
- Page d'accueil avec **parallax** et identité visuelle « instrument / télémétrie » (cyan signal + ambre, fond bleu-nuit).
- **HUD de télémétrie** animé (oscilloscope FPS) en signature dans le header.
- **Configurateur FPS** interactif : choix GPU / CPU / RAM / jeu / résolution + curseur de preset → estimation des FPS, 1% low, frametime, détection du **goulot d'étranglement** (GPU/CPU) et réglages recommandés par jeu.
- Section composants, méthode en 3 étapes, **tarifs freemium** (Gratuit 0€ / Pro 4,99€ / Elite 9,99€).
- Typographie Space Grotesk + JetBrains Mono + Inter. Responsive de base, `prefers-reduced-motion`.

### v0.2 — Matériel & catalogue
- Rendus SVG de matériel (écran **BIOS** stylisé, GPU, CPU, RAM) pour décorer.
- Section **« Référence composants »** : tout le catalogue listé, chaque composant cliquable.
- **Liens d'achat** (« Voir / Acheter ») + sélecteur de boutique (Amazon.fr / Google Shopping / Recherche Google), liens de recherche fiables.
- Bloc « Acheter cette config » dans le configurateur.

### v0.3 — Vraies photos
- Photos **Pexels** (libres) intégrées : fond du header (PC gaming RGB), trio **RAM installée / GPU / CPU**, bandeau PC gaming.
- Choix assumé : sources libres et hot-link autorisé (rendu correct une fois déployé).

### v0.4 — Galerie cartes graphiques
- Galerie dédiée de 4 cartes graphiques (RGB, édition blanche, RTX 2080 Super, RTX installée).

### v0.5 — Architecture 3D & mouvement
- **Tilt 3D interactif** sur toutes les cartes (inclinaison vers la souris + relief).
- **Entrées en 3D** au scroll (rotation X + profondeur).
- **Cube filaire** rotatif dans le header.
- **Bandeau de composants défilant** (GPU, CPU, RAM, carte mère, refroidissement, écran…).
- Fonds parallax plein écran par section + effet de **biais** au scroll.

### v0.6 — Nouveaux jeux
- Ajout de **Rocket League**, **Forza Horizon 5**, **Battlefield 6** et **GTA 6** (affiché « bientôt », non sélectionnable).
- Compteurs mis à jour (12 jeux).

### v0.7 — Responsive tous écrans
- Affichage adapté du **petit téléphone à l'ultrawide**, mode paysage.
- **Menu mobile** (burger) ajouté.

### v0.8 — Assistant IA & 4K/8K
- **Assistant IA** flottant à 3 paliers (Gratuit / Pro / Elite) qui connaît la config en cours et adapte sa profondeur de réponse selon l'abonnement.
- Paliers d'affichage **4K / 8K** (la page remplit l'écran au lieu d'une colonne centrale).

### v0.9 — Photos & transitions
- Photos de fond **plus visibles**, **séparateurs lumineux** entre sections, **fondu enchaîné** des fonds au scroll (avec teintes distinctes par section visibles même hors photo).

### v1.0 — Pack « vrai produit »
- **SEO** : title optimisé, meta description, Open Graph, Twitter card, favicon, JSON-LD, theme-color.
- **Légal/RGPD** : bannière cookies + modales Mentions légales / Confidentialité / CGV.
- **Accessibilité** : lien d'évitement, focus visibles, ARIA.
- Configurateur : **cartes mères** + catalogue élargi (+30 GPU, +19 CPU, +10 RAM).
- **Lien partageable** (config encodée dans l'URL) + **profils sauvegardés**.
- Sections **Témoignages**, **FAQ** (transparence sur le calcul des FPS), **capture email** (« préviens-moi »).
- **Performance scroll** optimisée.
- Backends livrés : `assistant.js`, `checkout.js` + `README.md` (déploiement, Stripe, images locales, données réelles, SEO programmatique).

### v1.1 — Modélisation Merise
- **MCD** (`frameforge-mcd.mermaid`), **MLD** + cardinalités (`frameforge-merise.md`), **MPD** PostgreSQL (`frameforge-mpd.sql`) : 17 entités, héritage des composants, déclencheur de cohérence, types ENUM, index, données d'amorçage.

### v1.2 — Carnet de bord & effet curseur ⭐
- Création de ce **carnet de bord** (mis à jour à chaque étape).
- Regroupement des fichiers **MCD / MLD / MPD** dans le dossier du site.
- **Effet « poussière d'étoiles »** au curseur : particules en forme de mini-frames/pixels cyan-ambre-blanc qui jaillissent de la souris (thème télémétrie/FPS), avec une explosion au clic. Désactivé sur tactile et si l'utilisateur réduit les animations.

---

### v1.3 — Vers le vrai produit (front + backend)
**Front (actif tout de suite) :**
- **Détection auto du GPU** via WebGL (bouton « Détecter mon GPU »).
- **Carte de score** téléchargeable en PNG (« J'ai X FPS ») — partage viral.
- **Liens affiliés** : config `AFFILIATE` (tag Amazon Partenaires) → commissions.
- **Newsletter** branchable sur un vrai service (`NEWSLETTER_ENDPOINT`).

**Backend & infra (fichiers livrés à brancher) :**
- `db.js` (PostgreSQL), `auth.js` (inscription/connexion bcrypt + JWT).
- `webhook.js` (active les abonnements après paiement Stripe).
- `benchmark.js` (soumission/lecture des FPS réels — calibrage du modèle).
- `generate-seo.js` (génère les pages SEO par jeu × composant + sitemap).
- `vercel.json` (en-têtes de sécurité / CSP), `robots.txt`, `sitemap.xml`, page **404** thématisée.
- `DEPLOIEMENT.md` : guide pas à pas (déploiement, base, auth, IA, Stripe, croissance).

### v1.4 — Page d accueil & accès abonnement
- **Page d accueil (intro)** animee avant le site : logo, sequence de boot telemetrie, barre de chargement, bouton ENTRER (clic n importe ou ou touche Entree/Echap pour entrer).
### v1.5 — Passe d honnetete (avant lancement)
- **Chiffres reels et dynamiques** : le nombre de composants et de jeux est desormais calcule depuis le vrai catalogue (fini le faux 218+ / +200 / ~35%). Reste juste quand tu ajoutes des composants.
- **HUD hero** branche sur le jeu / goulot / preset reels (fini le +38% invente).
- **Faux temoignages masques** (publier de faux avis est illegal en France) — a remplacer par de vrais retours.
- **Badge Pro** : Le plus choisi -> Recommande.
- **Fonctions non developpees** marquees bientot (comparaison avant/apres, export overlay, analyse de logs).
- **Bug corrige** : suppression d un doublon de page d accueil (deux ecrans ENTRER). On garde la splash animee d origine.
### v1.6 — Produit reel : comptes, Stripe, securite
- **Front comptes** : bouton Connexion + modale inscription/connexion branchee sur `/api/auth`, token JWT, palier affiche, sauvegarde de profils reservee aux connectes.
- **Stripe cote front** : boutons Pro/Elite branches sur `/api/checkout` + message de retour apres paiement.
- **Verrouillage serveur** : `assistant.js` plafonne le palier depuis la base (impossible de tricher en JS). `me.js` ajoute la lecture du palier, `auth.js` renvoie le palier, `webhook.js` active la bonne offre.
- **Config centralisee** `FF_CONFIG` (domaine/affiliation/newsletter/analytics) + correction automatique du domaine (canonical/og).
- **Vraie image de partage** `og-image.png` generee aux couleurs du site + `package.json` (dependances API).
- Guide `DEPLOIEMENT.md` complete (section comptes/Stripe/securite).
### v1.7 — Finitions & croissance (points 3 et 4)
**Finitions (point 3) :**
- **Splash memorisee** : ne s affiche qu a la premiere visite (localStorage), entree directe ensuite et via liens partages.
- **Passe de sobriete** : intensite des effets 3D/parallax/curseur reduite d environ 30 % (plus pro, plus fluide).
- **Images locales** : bascule automatique vers `images/` si le dossier existe (repli CDN sinon) + script `telecharge-images.sh` + `decoding=async` partout.
- **AUDIT-QUALITE.md** : audit statique realise + checklist Lighthouse/mobiles pour l apres-deploiement.

**Croissance (point 4) :**
- **FPS reels** : formulaire de soumission dans le configurateur (calibrage communautaire) + `benchmark.js` v2 (accepte les noms de composants).
- **384 pages SEO generees** depuis le vrai catalogue (12 jeux x 32 GPU) avec FPS estimes, reglages et lien vers le configurateur + `sitemap.xml` complet (390 URLs) + zip `pages-seo-reglages.zip`.
- **Version anglaise** : landing `en.html` + hreflang fr/en (traduction complete de l app = etape ulterieure).
- **Guides BIOS** rediges : ASUS, MSI, Gigabyte (+ index) — XMP/EXPO, Resizable BAR, mise a jour, avec avertissements de securite. Lien "Guides BIOS" et "English" dans le pied de page.
### v1.8 — Jeux 2026, catalogue XXL, transition avant-garde
- **Forza Horizon 6** ajoute (sorti le 19 mai 2026, Japon) avec ses reglages performance ; FH5 conserve.
- **CoD Modern Warfare 4** ajoute en "bientot" (officialise, sortie 23 octobre 2026) aux cotes de GTA 6.
- **Catalogue elargi a 111 composants** : 44 GPU (dont RTX 5090→5060, RX 9070 XT/9070/9060 XT, Arc B580/B570), 31 CPU (dont Ryzen 9000X3D, Core Ultra 200K), 16 RAM (jusqu a DDR5-8000), 20 cartes meres (X870E, B850, Z890, B860...). Les compteurs du site suivent automatiquement.
- **572 pages SEO regenerees** (13 jeux x 44 GPU) + sitemap et zip a jour.
- **Transition de splash avant-gardiste** : glitch RGB du titre, puis l ecran se decoupe en 6 volets aux aretes lumineuses qui s ouvrent en alternance haut/bas pour reveler le site (desactive si animations reduites).
### v1.9 — Depot Git + relecture de l intro
- **Page d accueil** : elle n avait pas disparu, elle etait memorisee apres la 1re vue (comportement voulu). Ajouts : un **clic sur le logo FRAMEFORGE rejoue l intro**, et l URL `?splash=1` la force aussi.
- **Depot Git initialise** : structure de production (le site devient `index.html`, les fonctions serveur passent dans `api/`), `.gitignore`, `GITHUB.md` (instructions de push), commit initial. Zip du depot fourni (`frameforge-repo.zip`, avec l historique .git) pour pousser depuis ta machine.
### v2.0 — RAM complete, SEO maximise, a11y, scroll premium
- **RAM etendue a 25 references** : de 8 a 128 Go (kits reels : 16/32/48/64/96/128 — le 72 Go n existe pas en kit standard, remplace par 48/96), avec **simple channel et double channel** et leur impact FPS (le simple channel penalise fortement les 1% low).
- **SEO renforce** : donnees structurees **FAQPage** (rich results Google), **index /reglages/** genere (hub de maillage interne pour les 572 pages), lien "Tous les reglages" au pied de page, sitemap complete.
- **Accessibilite (a11y)** : landmark `<main>` + skip-link, labels relies aux champs (for/id), groupe resolution ARIA, FAQ avec aria-expanded, contraste du texte discret releve, Echap ferme la modale de connexion, tout reste compatible prefers-reduced-motion.
- **Scroll inertiel premium (style Alpine)** : defilement fluide avec inertie a la molette + ancres animees, desktop uniquement (tactile natif), desactive si animations reduites.
## ✅ État d'avancement
- [x] Site vitrine complet et responsive (mobile → 8K)
- [x] Configurateur FPS + catalogue + liens d'achat
- [x] Effets visuels (parallax, 3D, fondu, bandeau, curseur)
- [x] Assistant IA à paliers (fonctionnel dans l'app)
- [x] SEO, légal, accessibilité
- [x] Modélisation BDD (MCD / MLD / MPD)
- [x] Backends assistant + paiement (à brancher)
- [ ] Déploiement (Netlify/Vercel)
- [x] Front comptes + verrouillage des paliers cote serveur (code)
- [x] Stripe cote front + webhook d'activation (code)
- [x] Image de partage (og-image.png) + config centralisee
- [ ] Cle API + rate limit pour l'assistant en prod
- [ ] Stripe : produits, prix, webhook d'activation des paliers
- [x] Détection GPU · carte de score · affiliation · newsletter branchable
- [x] Fichiers backend (auth, db, webhook, benchmark) + infra (vercel.json, robots, sitemap, 404) + guide de déploiement
- [x] Splash memorisee · sobriete effets · bascule images locales + script
- [x] 384 pages SEO + sitemap · guides BIOS · landing EN · soumission FPS reels
- [ ] Images passées en local (WebP) — lancer telecharge-images.sh
- [ ] Vraies données de benchmark
- [x] Pages SEO programmatiques (generees)

---

## 🔜 Prochaines pistes
1. Déployer une première version en ligne.
2. Brancher l'assistant sur `/api/assistant` + limiter le débit.
3. Mettre en place le paiement Stripe de bout en bout.
4. Remplacer les estimations par de vraies données de perf.
5. Générer les pages SEO par jeu × composant.

*(Ce carnet est complété à chaque nouvelle action sur le projet.)*
