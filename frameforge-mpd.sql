-- =============================================================
--  FRAMEFORGE — MPD (Modèle Physique de Données)
--  SGBD cible : PostgreSQL 14+
--  Encodage   : UTF-8
-- =============================================================

-- ---------- Types énumérés (domaines fermés) ----------
CREATE TYPE statut_abonnement AS ENUM ('actif', 'annule', 'expire', 'en_attente');
CREATE TYPE periodicite       AS ENUM ('mensuel', 'annuel');
CREATE TYPE statut_paiement   AS ENUM ('reussi', 'echoue', 'rembourse');
CREATE TYPE type_limitation   AS ENUM ('GPU', 'CPU');
CREATE TYPE type_ddr          AS ENUM ('DDR4', 'DDR5');
CREATE TYPE palier_ia         AS ENUM ('gratuit', 'pro', 'elite');
CREATE TYPE role_message       AS ENUM ('utilisateur', 'assistant');
CREATE TYPE source_benchmark  AS ENUM ('mesure_interne', 'soumission_utilisateur');

-- =============================================================
--  UTILISATEURS, OFFRES, ABONNEMENTS, PAIEMENTS
-- =============================================================

CREATE TABLE utilisateur (
    id_utilisateur     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    pseudo             VARCHAR(60)  NOT NULL,
    mot_de_passe_hash  VARCHAR(255) NOT NULL,
    date_inscription   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    est_actif          BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE offre (
    id_offre        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom             VARCHAR(40)  NOT NULL UNIQUE,
    niveau          SMALLINT     NOT NULL CHECK (niveau BETWEEN 0 AND 2),
    prix_mensuel    NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (prix_mensuel >= 0),
    prix_annuel     NUMERIC(7,2) NOT NULL DEFAULT 0 CHECK (prix_annuel >= 0),
    stripe_price_id VARCHAR(80)
);

CREATE TABLE abonnement (
    id_abonnement          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur         INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_offre               INTEGER NOT NULL REFERENCES offre(id_offre) ON DELETE RESTRICT,
    date_debut             DATE              NOT NULL DEFAULT CURRENT_DATE,
    date_fin               DATE,
    statut                 statut_abonnement NOT NULL DEFAULT 'actif',
    periodicite            periodicite       NOT NULL DEFAULT 'mensuel',
    stripe_subscription_id VARCHAR(80),
    CONSTRAINT chk_periode CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE TABLE paiement (
    id_paiement       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_abonnement     INTEGER NOT NULL REFERENCES abonnement(id_abonnement) ON DELETE CASCADE,
    montant           NUMERIC(7,2)    NOT NULL CHECK (montant >= 0),
    date_paiement     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    statut            statut_paiement NOT NULL DEFAULT 'reussi',
    stripe_payment_id VARCHAR(80)
);

-- =============================================================
--  CATALOGUE : MARQUES, CATEGORIES, COMPOSANTS + SPECIALISATIONS
-- =============================================================

CREATE TABLE marque (
    id_marque INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom       VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE categorie (
    id_categorie INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom          VARCHAR(40) NOT NULL UNIQUE   -- GPU, CPU, RAM, Carte mère
);

CREATE TABLE composant (
    id_composant INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_marque    INTEGER NOT NULL REFERENCES marque(id_marque) ON DELETE RESTRICT,
    id_categorie INTEGER NOT NULL REFERENCES categorie(id_categorie) ON DELETE RESTRICT,
    nom          VARCHAR(120)  NOT NULL,
    score_perf   NUMERIC(5,2)  NOT NULL CHECK (score_perf >= 0),
    lien_achat   VARCHAR(255),
    UNIQUE (nom, id_marque)
);

-- Spécialisations (héritage) : clé primaire = clé étrangère vers composant
CREATE TABLE gpu (
    id_composant INTEGER PRIMARY KEY REFERENCES composant(id_composant) ON DELETE CASCADE,
    vram_go      SMALLINT CHECK (vram_go > 0),
    tdp_w        SMALLINT CHECK (tdp_w > 0)
);

CREATE TABLE cpu (
    id_composant   INTEGER PRIMARY KEY REFERENCES composant(id_composant) ON DELETE CASCADE,
    nb_coeurs      SMALLINT     CHECK (nb_coeurs > 0),
    frequence_ghz  NUMERIC(3,1) CHECK (frequence_ghz > 0),
    socket         VARCHAR(20)
);

CREATE TABLE ram (
    id_composant  INTEGER PRIMARY KEY REFERENCES composant(id_composant) ON DELETE CASCADE,
    capacite_go   SMALLINT CHECK (capacite_go > 0),
    type_ddr      type_ddr,
    frequence_mhz INTEGER  CHECK (frequence_mhz > 0),
    latence_cl    SMALLINT CHECK (latence_cl > 0)
);

CREATE TABLE carte_mere (
    id_composant  INTEGER PRIMARY KEY REFERENCES composant(id_composant) ON DELETE CASCADE,
    chipset       VARCHAR(30),
    socket        VARCHAR(20),
    support_rebar BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================
--  JEUX & REGLAGES
-- =============================================================

CREATE TABLE jeu (
    id_jeu          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom             VARCHAR(80)     NOT NULL UNIQUE,
    est_disponible  BOOLEAN         NOT NULL DEFAULT TRUE,   -- FALSE = "bientôt" (ex. GTA 6)
    coef_gpu        NUMERIC(4,2)    NOT NULL CHECK (coef_gpu > 0),
    coef_cpu        NUMERIC(4,2)    NOT NULL CHECK (coef_cpu > 0),
    type_limitation type_limitation NOT NULL,
    date_ajout      DATE            NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE reglage_recommande (
    id_reglage      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_jeu          INTEGER NOT NULL REFERENCES jeu(id_jeu) ON DELETE CASCADE,
    libelle         VARCHAR(80)  NOT NULL,
    valeur          VARCHAR(80)  NOT NULL,
    ordre_affichage SMALLINT     NOT NULL DEFAULT 1,
    UNIQUE (id_jeu, libelle)
);

-- =============================================================
--  CONFIGURATIONS (profils sauvegardés) & BENCHMARKS
-- =============================================================

CREATE TABLE configuration (
    id_configuration INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur   INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_jeu           INTEGER NOT NULL REFERENCES jeu(id_jeu)              ON DELETE RESTRICT,
    id_gpu           INTEGER NOT NULL REFERENCES composant(id_composant)  ON DELETE RESTRICT,
    id_cpu           INTEGER NOT NULL REFERENCES composant(id_composant)  ON DELETE RESTRICT,
    id_ram           INTEGER NOT NULL REFERENCES composant(id_composant)  ON DELETE RESTRICT,
    id_carte_mere    INTEGER NOT NULL REFERENCES composant(id_composant)  ON DELETE RESTRICT,
    nom              VARCHAR(80)  NOT NULL,
    resolution       SMALLINT     NOT NULL CHECK (resolution IN (1080, 1440, 2160)),
    preset           SMALLINT     NOT NULL CHECK (preset BETWEEN 0 AND 100),
    fps_estime       INTEGER      CHECK (fps_estime >= 0),
    fps_1low_estime  INTEGER      CHECK (fps_1low_estime >= 0),
    goulot           type_limitation,
    date_creation    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE benchmark (
    id_benchmark   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
    id_jeu         INTEGER NOT NULL REFERENCES jeu(id_jeu)             ON DELETE CASCADE,
    id_gpu         INTEGER NOT NULL REFERENCES composant(id_composant) ON DELETE RESTRICT,
    id_cpu         INTEGER NOT NULL REFERENCES composant(id_composant) ON DELETE RESTRICT,
    resolution     SMALLINT         NOT NULL CHECK (resolution IN (1080, 1440, 2160)),
    preset         SMALLINT         NOT NULL CHECK (preset BETWEEN 0 AND 100),
    fps_moyen      INTEGER          NOT NULL CHECK (fps_moyen >= 0),
    fps_1low       INTEGER          CHECK (fps_1low >= 0),
    date_mesure    TIMESTAMPTZ      NOT NULL DEFAULT now(),
    source         source_benchmark NOT NULL DEFAULT 'soumission_utilisateur'
);

-- =============================================================
--  ASSISTANT IA & PROSPECTS
-- =============================================================

CREATE TABLE conversation_ia (
    id_conversation INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur  INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    palier          palier_ia   NOT NULL DEFAULT 'gratuit',
    date_debut      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE message_ia (
    id_message      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conversation INTEGER NOT NULL REFERENCES conversation_ia(id_conversation) ON DELETE CASCADE,
    role            role_message NOT NULL,
    contenu         TEXT         NOT NULL,
    date_envoi      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE prospect (
    id_prospect      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_jeu           INTEGER REFERENCES jeu(id_jeu) ON DELETE SET NULL,  -- jeu attendu (ex. GTA 6)
    email            VARCHAR(255) NOT NULL,
    date_inscription TIMESTAMPTZ  NOT NULL DEFAULT now(),
    a_consenti       BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (email, id_jeu)
);

-- =============================================================
--  INDEX (clés étrangères + colonnes de recherche)
-- =============================================================
CREATE INDEX idx_abonnement_utilisateur ON abonnement(id_utilisateur);
CREATE INDEX idx_abonnement_offre       ON abonnement(id_offre);
CREATE INDEX idx_paiement_abonnement    ON paiement(id_abonnement);
CREATE INDEX idx_composant_marque       ON composant(id_marque);
CREATE INDEX idx_composant_categorie    ON composant(id_categorie);
CREATE INDEX idx_composant_nom          ON composant(nom);
CREATE INDEX idx_reglage_jeu            ON reglage_recommande(id_jeu);
CREATE INDEX idx_config_utilisateur     ON configuration(id_utilisateur);
CREATE INDEX idx_config_jeu             ON configuration(id_jeu);
CREATE INDEX idx_config_gpu             ON configuration(id_gpu);
CREATE INDEX idx_config_cpu             ON configuration(id_cpu);
CREATE INDEX idx_benchmark_jeu          ON benchmark(id_jeu);
CREATE INDEX idx_benchmark_gpu          ON benchmark(id_gpu);
CREATE INDEX idx_message_conversation   ON message_ia(id_conversation);
CREATE INDEX idx_prospect_email         ON prospect(email);

-- =============================================================
--  CONTRAINTE DE COHERENCE CATEGORIE <-> ROLE (déclencheur)
--  Empêche de monter un CPU à la place d'un GPU, etc.
-- =============================================================
CREATE OR REPLACE FUNCTION verifier_categorie_composant(p_id_composant INTEGER, p_categorie VARCHAR)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM composant c
        JOIN categorie cat ON cat.id_categorie = c.id_categorie
        WHERE c.id_composant = p_id_composant AND cat.nom = p_categorie
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION trg_config_categories() RETURNS TRIGGER AS $$
BEGIN
    IF NOT verifier_categorie_composant(NEW.id_gpu, 'GPU')        THEN RAISE EXCEPTION 'id_gpu doit référencer un composant de catégorie GPU'; END IF;
    IF NOT verifier_categorie_composant(NEW.id_cpu, 'CPU')        THEN RAISE EXCEPTION 'id_cpu doit référencer un composant de catégorie CPU'; END IF;
    IF NOT verifier_categorie_composant(NEW.id_ram, 'RAM')        THEN RAISE EXCEPTION 'id_ram doit référencer un composant de catégorie RAM'; END IF;
    IF NOT verifier_categorie_composant(NEW.id_carte_mere, 'Carte mère') THEN RAISE EXCEPTION 'id_carte_mere doit référencer une carte mère'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chk_config_categories
    BEFORE INSERT OR UPDATE ON configuration
    FOR EACH ROW EXECUTE FUNCTION trg_config_categories();

-- =============================================================
--  DONNEES D'AMORCAGE (seed)
-- =============================================================
INSERT INTO categorie (nom) VALUES ('GPU'), ('CPU'), ('RAM'), ('Carte mère');

INSERT INTO offre (nom, niveau, prix_mensuel, prix_annuel) VALUES
    ('Gratuit', 0, 0.00,  0.00),
    ('Pro',     1, 4.99, 39.00),
    ('Elite',   2, 9.99, 99.00);

INSERT INTO marque (nom) VALUES
    ('NVIDIA'), ('AMD'), ('Intel'), ('Corsair'), ('G.Skill'), ('ASUS'), ('MSI'), ('Gigabyte');

-- =============================================================
--  FIN DU SCRIPT
-- =============================================================
