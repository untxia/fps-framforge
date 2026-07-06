# 🐙 Pousser FRAMEFORGE sur GitHub

Le dépôt Git est **déjà initialisé et commité** (branche `main`). Il ne reste que le push,
qui doit se faire depuis TON compte GitHub (je n'ai pas accès à tes identifiants).

## Option A — depuis ce dossier (2 commandes)
1. Crée un dépôt vide sur https://github.com/new (nom : `frameforge`, sans README).
2. Puis :
```bash
git remote add origin https://github.com/TON-PSEUDO/frameforge.git
git push -u origin main
```
(GitHub te demandera de t'identifier — utilise un Personal Access Token comme mot de passe.)

## Option B — avec GitHub CLI
```bash
gh repo create frameforge --public --source=. --push
```

## Mettre le commit à ton nom
Le commit initial est signé "FRAMEFORGE <dev@frameforge.local>". Pour le passer à ton identité :
```bash
git config user.name  "Ton Nom"
git config user.email "ton@email.com"
git commit --amend --reset-author --no-edit
```

## Déploiement dans la foulée
Sur https://vercel.com : "Import Git Repository" → choisis `frameforge` → Deploy.
Le site (index.html), les 572 pages SEO, les guides et les fonctions `api/` partent ensemble.
