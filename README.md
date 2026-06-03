# 💰 Finance — Gestion financière personnelle

Application web de gestion de finances personnelles (MVP Phase 1).
Suivez vos **revenus** et **dépenses**, visualisez vos **statistiques** et gardez
le contrôle de votre budget — le tout dans une interface moderne, responsive et
avec un mode sombre/clair.

Construite avec **Next.js (App Router) + TypeScript + Tailwind CSS**.
Aucune configuration externe n'est nécessaire : les données sont stockées
**localement dans le navigateur**, derrière une couche d'accès propre conçue
pour brancher **Firebase ou une API** plus tard sans toucher à l'interface.

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

Puis ouvrez **http://localhost:3000** et créez votre compte pour commencer.

Autres commandes :

```bash
npm run build   # build de production (vérifie aussi les types)
npm start       # sert le build de production
```

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

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** (thème par variables CSS)
- **lucide-react** (icônes)
- Stockage : **localStorage** (via une couche `repositories` remplaçable)

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
└─ lib/
   ├─ types.ts                # Types du domaine
   ├─ constants.ts            # Catégories, moyens de paiement, devises
   ├─ stats.ts                # Agrégations & calculs de dates
   ├─ format.ts               # Formatage monnaie / dates / %
   ├─ crypto.ts               # Hachage de mot de passe (démo locale)
   ├─ storage.ts              # Wrapper localStorage (SSR-safe)
   ├─ export.ts               # Export CSV + impression PDF
   └─ repositories.ts         # ⭐ Point de bascule du backend
```

---

## 🔌 Changer de backend (Firebase / API)

Toute l'application communique avec des *repositories* — `auth`, `transactions`,
`budgets`, `goals`, `recurring`, `notificationState` — définis dans
[`src/lib/repositories.ts`](src/lib/repositories.ts) via des interfaces typées.
**L'UI ne touche jamais localStorage directement.**

Pour passer à un vrai backend, il suffit d'implémenter ces interfaces et de
remplacer les dernières lignes du fichier :

```ts
// Aujourd'hui (démo locale) :
export const auth: AuthRepository = new LocalAuthRepository();
export const transactions: TransactionRepository = new LocalTransactionRepository();

// Demain (Firebase, par exemple) :
import { FirebaseAuthRepository, FirestoreTransactionRepository } from "./repositories.firebase";
export const auth: AuthRepository = new FirebaseAuthRepository();
export const transactions: TransactionRepository = new FirestoreTransactionRepository();
```

Toutes les méthodes sont déjà `async`, donc le passage à un backend réseau (REST,
GraphQL, Firestore temps réel) ne demande **aucun changement dans les composants**.

---

## 🔒 Note de sécurité

L'authentification actuelle est une **démo côté client** : les comptes et le
hachage des mots de passe vivent dans le navigateur (voir
[`src/lib/crypto.ts`](src/lib/crypto.ts)). Cela évite de stocker des mots de
passe en clair, **mais ce n'est pas une sécurité réelle**. En production,
confiez l'authentification à un vrai backend (Firebase Auth, JWT côté serveur…)
en suivant la section ci-dessus.

---

## 🗺️ Suite (selon le cahier des charges)

- **Phase 1 ✅** — Auth, revenus/dépenses, tableau de bord, statistiques,
  recherche & filtres, responsive, thème clair/sombre.
- **Phase 2 ✅** — Limite de dépense mensuelle + budgets par catégorie,
  centre de notifications, objectifs d'épargne, transactions récurrentes,
  export CSV / Excel / PDF.
- **Phase 3** — Suggestions IA (dépenses inutiles, prévisions, conseils
  d'économie), OCR des reçus, connexion bancaire, synchronisation temps réel
  multi-appareils (Firebase/API).

L'architecture (repositories, agrégations, point de bascule du backend) a été
pensée pour accueillir ces évolutions.
