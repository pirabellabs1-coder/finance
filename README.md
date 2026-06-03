# 💰 Finance — Gestion financière personnelle

Application web de gestion de finances personnelles avec **vrais comptes**,
synchronisation multi-appareils et **emails** (reset de mot de passe, rappels,
alertes budget). Suivez vos **revenus**/**dépenses**, **budgets**, **objectifs**
et **récurrences** dans une interface moderne, responsive, sombre/clair.

Stack : **Next.js (App Router) + TypeScript + Tailwind**, **Vercel Postgres**
(données + auth serveur), **Resend** (emails), sessions **JWT** par cookie.

---

## 🚀 Démarrage rapide

```bash
npm install
# Renseignez les variables d'environnement (voir plus bas), puis :
npm run dev
```

Puis ouvrez **http://localhost:3000** et créez votre compte.

> En local, récupérez les variables depuis Vercel avec `vercel env pull .env.local`
> (nécessite une base Postgres connectée au projet).

Autres commandes :

```bash
npm run build   # build de production (vérifie aussi les types)
npm start       # sert le build de production
```

---

## ⚙️ Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `POSTGRES_URL` | Connexion Vercel Postgres (ajoutée automatiquement en créant la base dans Vercel → Storage). |
| `AUTH_SECRET` | Secret de signature des sessions/jetons (chaîne aléatoire). |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi des emails. |
| `EMAIL_FROM` | Expéditeur, ex. `Finance <noreply@votre-domaine.com>` (domaine à vérifier dans Resend). |
| `CRON_SECRET` | Protège l'endpoint cron `/api/cron/reminders`. |
| `APP_URL` | URL publique de l'app (liens dans les emails). |

Le schéma de base de données se crée automatiquement à la première requête
(`src/server/db.ts`). Les **emails** (`src/server/email.ts`) couvrent le reset de
mot de passe, les rappels d'échéances et les alertes de budget ; un **cron Vercel
quotidien** (`vercel.json` → `/api/cron/reminders`) envoie les rappels/alertes.

---

## ✨ Fonctionnalités (Phase 1 — MVP)

| Domaine | Détails |
| --- | --- |
| **Authentification** | Création de compte, connexion, déconnexion, « mot de passe oublié », changement de mot de passe. Mots de passe hachés (PBKDF2/SHA-256). |
| **Revenus & dépenses** | Ajout, modification, suppression. Montant, catégorie, description, date, moyen de paiement, référence. Catégories prédéfinies (Salaire, Freelance, Nourriture, Transport, Logement…). |
| **Tableau de bord** | Solde total, revenus/dépenses du mois (avec évolution vs mois précédent), épargne, graphique d'évolution, répartition des dépenses, dernières transactions. |
| **Statistiques** | Analyses hebdomadaires (dépensé/gagné, catégorie la plus coûteuse, évolution) et mensuelles (comparaison, épargne estimée, taux d'épargne, moyenne journalière, dépenses récurrentes). |
| **Recherche & filtres** | Recherche texte + filtres par type, catégorie, moyen de paiement, plage de dates et plage de montants. |
| **Interface** | Design responsive (sidebar sur desktop, barre de navigation + bouton flottant sur mobile), **mode sombre / clair / système**, multi-devises. |
| **Profil** | Nom, prénom, devise, photo de profil (recadrée et compressée), thème. |

Les charts (donut de répartition, barres d'évolution) sont **dessinés à la main
en SVG/CSS** — aucune dépendance de graphiques, bundle léger.

## ✨ Fonctionnalités (Phase 2)

| Domaine | Détails |
| --- | --- |
| **Limite de dépense mensuelle** | Budget global avec barre de progression, % consommé, montant restant et alerte de dépassement. |
| **Budgets par catégorie** | Un plafond par catégorie de dépense, suivi de la consommation du mois et code couleur (vert / orange / rouge). |
| **Centre de notifications** | Cloche dans l'en-tête (compteur de non-lus) : alertes de budget (approche / dépassement) et rappels d'échéances récurrentes. |
| **Objectifs d'épargne** | Objectifs avec montant cible, échéance et couleur ; suivi de progression et contributions (ajouter / retirer). |
| **Transactions récurrentes** | Règles (loyer, abonnements, salaire) en mensuel/hebdo, **génération automatique** des échéances, mise en pause, et option « Répéter » directement dans le formulaire. |
| **Export** | Export **CSV / Excel** des transactions filtrées et vue **imprimable / PDF**. |

---

## 🧱 Stack technique

- **Next.js 15** (App Router, Route Handlers) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** (thème par variables CSS)
- **Vercel Postgres** (`@vercel/postgres`) — données + comptes
- **Resend** — envoi d'emails · **jose** — sessions JWT (cookie httpOnly)
- **scrypt** (Node) — hachage des mots de passe · **lucide-react** — icônes

---

## 🗂️ Structure du projet

```
src/
├─ app/
│  ├─ layout.tsx              # Layout racine : thème + AuthProvider
│  ├─ page.tsx                # Redirige vers /login
│  ├─ (auth)/                 # Pages publiques (login, register, forgot-password)
│  └─ (app)/                  # Pages authentifiées (dashboard, transactions,
│                             #   revenus, depenses, statistiques, profil)
├─ components/
│  ├─ ui/                     # Button, Input, Select, Card, Modal, …
│  ├─ layout/                 # Sidebar, Header, MobileNav, guards
│  ├─ charts/                 # DonutChart, MonthlyBars (SVG/CSS)
│  ├─ dashboard/              # StatCard
│  └─ transactions/           # Formulaire, liste, provider du modal
├─ context/
│  ├─ AuthContext.tsx         # État d'authentification
│  ├─ DataContext.tsx         # Transactions de l'utilisateur courant (CRUD)
│  └─ PlanningContext.tsx     # Budgets, objectifs, récurrences, notifications
├─ lib/
│  ├─ types.ts                # Types du domaine
│  ├─ constants.ts            # Catégories, moyens de paiement, devises
│  ├─ stats.ts                # Agrégations & calculs de dates
│  ├─ format.ts               # Formatage monnaie / dates / %
│  ├─ storage.ts              # localStorage (état lu/non-lu des notifs)
│  ├─ export.ts               # Export CSV + impression PDF
│  └─ repositories.ts         # Client API (fetch) — point d'accès unique
├─ server/                    # Code serveur (jamais envoyé au navigateur)
│  ├─ db.ts                   # Pool Postgres + schéma auto-créé
│  ├─ users.ts · data.ts      # Requêtes SQL + mappers
│  ├─ password.ts · session.ts # scrypt + sessions JWT (cookie)
│  └─ email.ts                # Resend + templates d'emails
└─ app/api/                   # Route Handlers : auth, transactions, budget,
                              #   goals, recurring, email/summary, cron/reminders
```

---

## 🔌 Architecture

L'UI parle à des *repositories* (`auth`, `transactions`, `budgets`, `goals`,
`recurring`) définis dans [`src/lib/repositories.ts`](src/lib/repositories.ts),
qui appellent les **Route Handlers** sous `src/app/api/*`. Côté serveur
(`src/server/*`), ces routes lisent/écrivent dans **Vercel Postgres**, gèrent les
**sessions JWT** (cookie httpOnly) et envoient les **emails** via Resend. Les
méthodes étant toutes `async`, l'interface n'a pas bougé depuis le prototype.

---

## 🔒 Sécurité

- Mots de passe hachés côté serveur (**scrypt**), jamais stockés en clair.
- Sessions signées (**JWT**, `AUTH_SECRET`) en cookie **httpOnly / secure**.
- Reset de mot de passe par **jeton signé à usage unique** (expire en 1 h).
- Endpoint cron protégé par `CRON_SECRET`.
- Tous les secrets en variables d'environnement (jamais commités).

---

## 🗺️ Suite (selon le cahier des charges)

- **Phase 1 ✅** — Auth, revenus/dépenses, tableau de bord, statistiques,
  recherche & filtres, responsive, thème clair/sombre.
- **Phase 2 ✅** — Limite de dépense mensuelle + budgets par catégorie,
  centre de notifications, objectifs d'épargne, transactions récurrentes,
  export CSV / Excel / PDF.
- **Backend ✅** — Vercel Postgres (vrais comptes + synchronisation
  multi-appareils), reset de mot de passe par email, rappels & alertes par email
  (cron quotidien), récap mensuel.
- **Phase 3** — Suggestions IA (dépenses inutiles, prévisions, conseils
  d'économie), OCR des reçus, connexion bancaire.

L'architecture (repositories, routes API, base Postgres) a été pensée pour
accueillir ces évolutions.
