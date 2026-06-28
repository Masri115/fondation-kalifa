# Fondation Kalifa — Site web

Site vitrine de la **Fondation Kalifa ASBL** (Belgique) — _« La voix des s'ang voix »_.
Sensibilisation, dépistage, don de sang et plaidoyer face à la **drépanocytose**.

> Informer. Dépister. Agir.

## À propos

Application monopage (SPA) statique, sans dépendance ni étape de build : **HTML + CSS + JavaScript vanilla**.
Le site a été implémenté à partir d'une maquette Claude Design et reproduit fidèlement son design.

### Pages

- Accueil
- Notre histoire
- Comprendre la drépanocytose (avec FAQ)
- Nos actions
- Événements
- Témoignages
- Faire un don (sélecteur de montant)
- Nous rejoindre (formulaire d'engagement)
- Partenaires
- Contact (formulaire)

### Fonctionnalités

- Navigation entre pages côté client (affichage/masquage de sections)
- Barre de navigation qui se densifie au défilement
- Menu mobile plein écran
- Accordéon FAQ
- Sélecteur de montant de don + champ libre
- États de soumission des formulaires (contact / engagement)
- Effets de survol fidèles à la maquette

## Lancer en local

Aucune installation requise. Servez le dossier avec n'importe quel serveur statique :

```bash
python3 -m http.server 4319
# puis ouvrir http://localhost:4319
```

## Structure

```
.
├── index.html          # Toutes les pages + navigation + footer
├── css/
│   └── styles.css      # Styles globaux, polices, animations
├── js/
│   └── app.js          # Routage, menus, FAQ, dons, formulaires
└── assets/             # Logos partenaires + visuels événements
```

## Déploiement

Compatible **GitHub Pages** tel quel : activez Pages sur la branche `main` (dossier racine `/`).

---

© Fondation Kalifa ASBL · Belgique
