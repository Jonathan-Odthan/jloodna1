# 🛍️ Jloodna | Global Trading

> Marketplace e-commerce premium pour **Haiti 🇭🇹** 
> Devise principale: **HTG (Gourde haïtienne)**

---

## ✨ Fonctionnalités

### 🛒 Client
- Catalogue complet avec 12+ catégories
- Recherche avancée (filtres prix, note, stock, marque, popularité)
- Panier persistant + Wishlist/Favoris
- Checkout multi-étapes avec PayPal et NatCash
- Suivi de commande en temps réel
- Avis et notes produits
- Affichage dual HTG ↔ DOP avec convertisseur
- Notifications en temps réel
- Responsive mobile-first

### ⚙️ Admin (`/admin/pages/dashboard.html`)
- Tableau de bord avec statistiques live
- CRUD produits complet (avec variantes, images, tags)
- Import dropshipping par lien URL
- Gestion commandes + changement de statut
- Gestion clients, paiements, coupons
- Bannières et contenus homepage
- Journal d'activité (audit log)
- Sécurité renforcée (accès restreint aux emails autorisés)

### 🌐 Dropshipping
- Import de produits par URL (Amazon, AliExpress, Alibaba…)
- Gestion des marges et prix de vente
- Synchronisation automatique

---

## 📁 Structure du projet

```
jloodna/
├── index.html                    # Page d'accueil
├── maintenance.html              # Page de maintenance
├── package.json
├── .env.example                  # Variables d'environnement (template)
├── .gitignore
│
├── pages/                        # Pages client
│   ├── shop.html                 # Catalogue/Boutique
│   ├── category.html             # Page catégorie
│   ├── product.html              # Détail produit
│   ├── search.html               # Recherche avancée
│   ├── checkout.html             # Commande (PayPal + NatCash)
│   ├── account.html              # Mon compte
│   ├── orders.html               # Mes commandes
│   ├── track.html                # Suivi de commande
│   ├── wishlist.html             # Favoris
│   ├── deals.html                # Offres du jour
│   ├── notifications.html        # Notifications
│   ├── contact.html              # Contact
│   ├── faq.html                  # FAQ / Aide
│   ├── about.html                # À propos
│   ├── privacy.html              # Politique de confidentialité
│   ├── terms.html                # Conditions d'utilisation
│   ├── returns.html              # Retours & Remboursements
│   └── 404.html                  # Page introuvable
│
├── auth/                         # Authentification
│   ├── login.html
│   ├── register.html
│   └── forgot.html
│
├── admin/                        # Espace administrateur
│   └── pages/
│       ├── dashboard.html        # Dashboard complet
│       └── access-denied.html    # Accès refusé
│
├── frontend/                     # Assets statiques
│   └── assets/
│       ├── css/
│       │   ├── variables.css
│       │   └── main.css
│       ├── js/
│       │   ├── app.js            # Core: cart, wishlist, toast, notifs
│       │   ├── layout.js         # Header/Footer injection
│       │   └── products.js       # Catalogue produits
│       └── images/
│           ├── logo.svg
│           ├── favicon.svg
│           └── placeholder.svg
│
└── backend/                      # API Node.js/Express
    ├── server.js
    ├── middleware/
    │   └── auth.js               # JWT + admin guard + CSRF
    ├── routes/
    │   ├── auth.js               # Login, register, logout
    │   ├── products.js           # CRUD produits
    │   ├── orders.js             # Commandes + tracking
    │   ├── payments.js           # PayPal + NatCash
    │   ├── categories.js
    │   ├── dropship.js           # Import par URL
    │   ├── notifications.js
    │   ├── coupons.js
    │   └── admin.js
    └── models/
        └── productSeed.js        # Données initiales
```

---

## 🚀 Démarrage rapide (sans backend)

```bash
# Ouvrez simplement index.html dans votre navigateur
# Ou utilisez un serveur local :
npx serve .
# → http://localhost:3000
```

## 🔧 Démarrage avec le backend API

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos vraies valeurs

# 3. Lancer en développement
npm run dev

# 4. Lancer en production
NODE_ENV=production npm start
```

### Base de données PostgreSQL

Le backend exige maintenant une base PostgreSQL persistante. Créez une base sur
Neon, Supabase, Render ou votre hébergeur, puis ajoutez sa chaîne de connexion
dans `DATABASE_URL` (avec `sslmode=require` en production). Les tables et les
produits initiaux sont créés automatiquement au premier démarrage.

```bash
DATABASE_URL=postgresql://utilisateur:mot_de_passe@hote:5432/jloodna?sslmode=require
NODE_ENV=production npm start
```

Ne publiez jamais `.env` ni les secrets PayPal/JWT. Configurez ces variables
directement dans les variables secrètes de votre hébergeur.

---

## 🔐 Accès Administrateur

| Email                     | Rôle  |
|---------------------------|-------|
| jloodna@gmail.com         | Admin |

> **Important:** Le mot de passe admin est défini dans `.env` → `ADMIN_PASSWORD`  
> Ne partagez jamais ces informations. Toute tentative non autorisée est journalisée.

**URL Admin:** `/admin/pages/dashboard.html`

---

## 💳 Paiements configurés

| Méthode  | Détails |
|----------|---------|
| **PayPal** | Client ID configuré dans `.env` · Supporte toutes cartes internationales |
| **NatCash** | Numéro: **+509 40 89 40 38** · Paiement mobile haïtien |

---

## 💱 Devises

| Devise | Symbole | Code | Usage |
|--------|---------|------|-------|
| Gourde haïtienne | G | HTG | **Devise principale** |
| Peso dominicain  | RD$ | DOP | Affichage optionnel |

Taux par défaut HTG→DOP: **0.37** (configurable dans `.env`)

---

## 🌐 Déploiement GitHub Pages (frontend uniquement)

```bash
git init
git add .
git commit -m "🚀 Initial commit — Jloodna Global Trading"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/jloodna.git
git push -u origin main
# Activez GitHub Pages sur la branche main
```

## 🚀 Déploiement complet (Render / Railway / Heroku)

```bash
# Variables d'environnement à configurer sur la plateforme :
NODE_ENV=production
JWT_SECRET=
ADMIN_PASSWORD= définissez cette valeur uniquement dans Render
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PORT=3000
```

### Déploiement recommandé sur Render

Le fichier `render.yaml` configure automatiquement un Web Service Node.js et
une base PostgreSQL. Depuis Render :

1. **New +** → **Blueprint**
2. Sélectionnez le dépôt GitHub et validez `render.yaml`
3. Remplissez les variables marquées **sync: false**
4. Pour `CORS_ORIGIN`, utilisez l'URL Render du service, par exemple
    `https://jloodna-global-trading.onrender.com`
5. Vérifiez ensuite `https://VOTRE-URL.onrender.com/api/health`

Le service utilise `npm ci` pour le build, `npm start` pour le lancement et
`/api/health` comme contrôle de santé. Ne mettez jamais les valeurs secrètes
dans GitHub : configurez-les uniquement dans Render.

---

## 🛡️ Sécurité

- ✅ JWT tokens avec expiration
- ✅ Bcrypt pour les mots de passe (salt rounds: 12)
- ✅ Helmet.js (headers sécurisés)
- ✅ Rate limiting (login: 10/15min, global: 300/15min)
- ✅ Protection CSRF (double-submit cookie)
- ✅ Validation et sanitisation des entrées
- ✅ Accès admin restreint aux emails autorisés
- ✅ Journalisation des accès sensibles
- ✅ Cookies HttpOnly + Secure + SameSite
- ✅ Sessions expirables
- ✅ Masquage infos sensibles dans les réponses

---

## 📞 Support

- **WhatsApp:** +509 40 89 40 38
- **Email:** contact@jloodna.com
- **Site:** https://jloodna.com

---

*© 2025 Jloodna Global Trading — Tous droits réservés*
