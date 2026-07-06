# FRAMEFORGE — Modélisation Merise (MCD · MLD · MPD)

Modélisation de la base de données de FRAMEFORGE selon la méthode **Merise**.
Trois niveaux : **MCD** (conceptuel), **MLD** (logique / relationnel), **MPD** (physique / PostgreSQL — voir `frameforge-mpd.sql`).

Le diagramme entité-association est dans `frameforge-mcd.mermaid`.

---

## 1. MCD — Modèle Conceptuel de Données

Le MCD décrit **quoi** stocker, indépendamment de toute technologie. Il liste les **entités**, leurs **propriétés**, et les **associations** entre elles avec leurs **cardinalités** (min, max).

### Entités principales

**UTILISATEUR** — *id_utilisateur*, email, pseudo, mot_de_passe_hash, date_inscription, est_actif
**OFFRE** — *id_offre*, nom, niveau, prix_mensuel, prix_annuel, stripe_price_id
**ABONNEMENT** — *id_abonnement*, date_debut, date_fin, statut, periodicite, stripe_subscription_id
**PAIEMENT** — *id_paiement*, montant, date_paiement, statut, stripe_payment_id
**MARQUE** — *id_marque*, nom
**CATEGORIE** — *id_categorie*, nom (GPU, CPU, RAM, Carte mère)
**COMPOSANT** — *id_composant*, nom, score_perf, lien_achat
**GPU** *(spécialisation)* — vram_go, tdp_w
**CPU** *(spécialisation)* — nb_coeurs, frequence_ghz, socket
**RAM** *(spécialisation)* — capacite_go, type_ddr, frequence_mhz, latence_cl
**CARTE_MERE** *(spécialisation)* — chipset, socket, support_rebar
**JEU** — *id_jeu*, nom, est_disponible, coef_gpu, coef_cpu, type_limitation, date_ajout
**REGLAGE_RECOMMANDE** — *id_reglage*, libelle, valeur, ordre_affichage
**CONFIGURATION** — *id_configuration*, nom, resolution, preset, fps_estime, fps_1low_estime, goulot, date_creation
**BENCHMARK** — *id_benchmark*, resolution, preset, fps_moyen, fps_1low, date_mesure, source
**CONVERSATION_IA** — *id_conversation*, palier, date_debut
**MESSAGE_IA** — *id_message*, role, contenu, date_envoi
**PROSPECT** — *id_prospect*, email, date_inscription, a_consenti

> *La propriété en italique est l'identifiant de l'entité.*

### Associations et cardinalités (Merise)

| Association | Entité A | card. A | card. B | Entité B |
|---|---|---|---|---|
| SOUSCRIRE | UTILISATEUR | (0,n) | (1,1) | ABONNEMENT |
| CONCERNER | OFFRE | (0,n) | (1,1) | ABONNEMENT |
| GENERER | ABONNEMENT | (0,n) | (1,1) | PAIEMENT |
| FABRIQUER | MARQUE | (0,n) | (1,1) | COMPOSANT |
| CLASSER | CATEGORIE | (1,n) | (1,1) | COMPOSANT |
| DEFINIR | JEU | (1,n) | (1,1) | REGLAGE_RECOMMANDE |
| CREER | UTILISATEUR | (0,n) | (1,1) | CONFIGURATION |
| CIBLER | JEU | (0,n) | (1,1) | CONFIGURATION |
| MONTER_GPU | COMPOSANT | (0,n) | (1,1) | CONFIGURATION |
| MONTER_CPU | COMPOSANT | (0,n) | (1,1) | CONFIGURATION |
| MONTER_RAM | COMPOSANT | (0,n) | (1,1) | CONFIGURATION |
| MONTER_CM | COMPOSANT | (0,n) | (1,1) | CONFIGURATION |
| DEMARRER | UTILISATEUR | (0,n) | (1,1) | CONVERSATION_IA |
| CONTENIR | CONVERSATION_IA | (1,n) | (1,1) | MESSAGE_IA |
| SOUMETTRE | UTILISATEUR | (0,n) | (0,1) | BENCHMARK |
| MESURER | JEU | (0,n) | (1,1) | BENCHMARK |
| ATTENDRE | JEU | (0,n) | (0,1) | PROSPECT |

**Héritage (spécialisation exclusive et totale)** : un COMPOSANT est **exactement** l'un des sous-types GPU, CPU, RAM ou CARTE_MERE (déterminé par sa CATEGORIE).

> Choix de conception : une CONFIGURATION référence 4 composants par des associations distinctes (un par rôle) plutôt qu'une association porteuse « rôle ». Cela garantit, via des clés étrangères obligatoires, qu'une config possède toujours exactement 1 GPU, 1 CPU, 1 RAM et 1 carte mère.

---

## 2. MLD — Modèle Logique de Données (relationnel)

Passage du MCD au relationnel. **Conventions** : clé primaire **en gras**, clé étrangère préfixée par `#`.

**Règles de passage appliquées :**
- Chaque **entité** devient une **table**.
- Une association **(x,1)–(x,n)** : la clé de l'entité côté (x,n) **migre** en clé étrangère dans la table côté (1,1).
- L'**héritage** est traduit par *« table mère + une table par sous-type »* : chaque sous-type a pour clé primaire la clé étrangère vers `COMPOSANT` (relation 1–1).
- Aucune association *plusieurs-à-plusieurs* ici : les 4 rôles de composant sont 4 clés étrangères dans `CONFIGURATION`.

```
UTILISATEUR (id_utilisateur, email, pseudo, mot_de_passe_hash, date_inscription, est_actif)

OFFRE (id_offre, nom, niveau, prix_mensuel, prix_annuel, stripe_price_id)

ABONNEMENT (id_abonnement, date_debut, date_fin, statut, periodicite,
            stripe_subscription_id, #id_utilisateur, #id_offre)

PAIEMENT (id_paiement, montant, date_paiement, statut, stripe_payment_id,
          #id_abonnement)

MARQUE (id_marque, nom)

CATEGORIE (id_categorie, nom)

COMPOSANT (id_composant, nom, score_perf, lien_achat, #id_marque, #id_categorie)

GPU (#id_composant, vram_go, tdp_w)
CPU (#id_composant, nb_coeurs, frequence_ghz, socket)
RAM (#id_composant, capacite_go, type_ddr, frequence_mhz, latence_cl)
CARTE_MERE (#id_composant, chipset, socket, support_rebar)
    -- dans chaque sous-type, #id_composant est aussi la clé primaire

JEU (id_jeu, nom, est_disponible, coef_gpu, coef_cpu, type_limitation, date_ajout)

REGLAGE_RECOMMANDE (id_reglage, libelle, valeur, ordre_affichage, #id_jeu)

CONFIGURATION (id_configuration, nom, resolution, preset, fps_estime,
               fps_1low_estime, goulot, date_creation,
               #id_utilisateur, #id_jeu, #id_gpu, #id_cpu, #id_ram, #id_carte_mere)
    -- #id_gpu, #id_cpu, #id_ram, #id_carte_mere référencent tous COMPOSANT

BENCHMARK (id_benchmark, resolution, preset, fps_moyen, fps_1low, date_mesure,
           source, #id_utilisateur, #id_jeu, #id_gpu, #id_cpu)

CONVERSATION_IA (id_conversation, palier, date_debut, #id_utilisateur)

MESSAGE_IA (id_message, role, contenu, date_envoi, #id_conversation)

PROSPECT (id_prospect, email, date_inscription, a_consenti, #id_jeu)
```

**Contrainte de cohérence** (à poser au niveau MPD) : un composant utilisé comme `#id_gpu` doit appartenir à la catégorie « GPU », etc. → vérifié par déclencheur (trigger) ou par l'application.

---

## 3. MPD — Modèle Physique de Données

Le script PostgreSQL complet (types, contraintes `CHECK`, clés étrangères avec `ON DELETE`, index, types énumérés et données d'amorçage) est dans **`frameforge-mpd.sql`**.

Points clés du passage MLD → MPD :
- Identifiants en `INTEGER GENERATED ALWAYS AS IDENTITY`.
- Domaines fermés (statuts, paliers, DDR…) en **types ENUM** PostgreSQL.
- Contraintes `CHECK` (résolution ∈ {1080,1440,2160}, preset ∈ [0,100], score ≥ 0…).
- Index sur toutes les clés étrangères et les colonnes de recherche (email, nom de composant).
- `ON DELETE CASCADE` pour les dépendances fortes (paiements, messages, réglages, sous-types) et `RESTRICT` pour protéger le catalogue.
