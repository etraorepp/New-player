# Lecteur de Conférences - Mode Dynamique

## Description

`Pup-Conference.html` charge dynamiquement les conférences audio depuis les APIs de la Philharmonie de Paris via un serveur proxy local.

Le lecteur affiche une interface hiérarchique avec :
- **Sections dépliables** pour les childs avec subchilds
- **Numérotation claire** : 1, 2, 3, 4... pour les chapitres principaux
- **Sous-chapitres numérotés** : 1, 2, 3... dans chaque section
- **Symboles visuels** : ▼/▶ pour déplier/replier, ├─ └─ pour l'arborescence

## Démarrage

### 1. Démarrer le serveur proxy

```bash
node server.js
```

Ou avec npm :

```bash
npm start
```

Le serveur démarre sur **http://localhost:3000**

**Pour arrêter le serveur :** Appuyez sur `Ctrl + C` dans le terminal

### 2. Ouvrir dans le navigateur

Ouvrez votre navigateur et allez à :
```
http://localhost:3000
```

## Utilisation

### Pour afficher une autre conférence :

1. Ouvrez `Pup-Conference.html` dans un éditeur de texte
2. Changez l'ID Syracuse à la ligne 38 :

```javascript
const syracuseId = "82378"; // ← Changez cet ID
```

3. Sauvegardez et rafraîchissez la page dans votre navigateur

## Fonctionnement

### Architecture

```
Navigateur  →  Serveur Proxy (localhost:3000)  →  APIs Philharmonie
```

Le serveur proxy (`server.js`) évite les problèmes CORS en faisant les requêtes côté serveur.

### APIs utilisées (via proxy)

1. **`/api/json/{ID}`** → Métadonnées de la conférence
   - Titre, date, intervenants, stream URL
   
2. **`/api/xml/{ID}`** → Structure hiérarchique
   - Parent/childs/subchilds avec timecodes

La page construit automatiquement :
- Les chapitres détaillés (subchilds si disponibles)
- Les métadonnées (titre, date, intervenants)
- Le lecteur audio PUPlayer

## Configuration automatique des chapitres

Le système crée les chapitres intelligemment avec une hiérarchie visuelle :

### Structure hiérarchique

- **Sections parentes** (childs avec subchilds) :
  - Symbole : **▼** (dépliée) / **▶** (repliée)
  - Cliquable pour déplier/replier les sous-chapitres
  - Affiche le nombre de sous-chapitres
  - Numérotation : 1, 2, 3, 4...

- **Sous-chapitres** (subchilds) :
  - Symboles : **├─** (intermédiaire) / **└─** (dernier)
  - Indentés visuellement
  - Numérotation indépendante : 1, 2, 3... dans chaque section
  - Cliquable pour lancer la lecture

- **Chapitres simples** (childs sans subchilds) :
  - Affichage standard
  - Numérotation : 1, 2, 3, 4...

### Exemple pour la conférence 82378

```
▼ 1. Table ronde (15h)                    01:07:38
     2 sous-chapitres
   ├─ 1. Qu'est-ce qu'un raga?            00:34:30
   └─ 2. Qu'est-ce qu'un tala?            00:33:09

2. Concert-démonstration                  00:42:36

3. Table ronde (17h) : La danse kathak... 00:51:28

▼ 4. Démonstration                        00:49:15
     13 sous-chapitres
   ├─ 1. Vichnou vandana                  00:03:27
   ├─ 2. Bavahamat                        00:04:33
   ... (11 autres sous-chapitres)
   └─ 13. Jugalbandi                      00:04:10
```

Total : **4 chapitres principaux** dont 2 sections avec **15 sous-chapitres**

## Réseau

**Important** : 
- Le serveur doit être exécuté sur le réseau interne de la Philharmonie
- Les APIs ne sont accessibles que depuis ce réseau
- Le proxy résout les problèmes CORS du navigateur

## Avantages de cette approche

### Technique
- Pas de fichiers JSON statiques à générer
- Toujours à jour avec les données de l'API
- Un seul fichier HTML pour toutes les conférences
- Résout les problèmes CORS avec un proxy simple
- Change juste l'ID pour charger une autre conférence

### Interface utilisateur
- Hiérarchie visuelle claire avec sections dépliables
- Numérotation logique et indépendante par section
- Navigation intuitive (clic sur section = toggle, clic sur sous-chapitre = lecture)
- Vue compacte : possibilité de replier les sections
- Symboles visuels ▼/▶ ├─ └─ pour comprendre la structure
- Affichage du titre de la conférence au-dessus du programme

## Débogage

Ouvrez la console du navigateur (F12) pour voir :
- Les étapes de chargement
- Le nombre de chapitres générés (total, sections, sous-chapitres, simples)
- Les éventuelles erreurs

Exemple de logs :
```
Chargement de la conférence 82378
Récupération des métadonnées...
Récupération de la structure...
Construction de la configuration...
Configuration créée:
  Total: 19 chapitres
  Sections: 2
  Sous-chapitres: 15
  Chapitres simples: 2
```

## Structure du projet

```
New-player/
├── Pup-Conference.html       ← Lecteur de conférences (dynamique)
├── Pup-Video-Integral.html   ← Lecteur vidéo intégral
├── Pup-Video-Extrait.html    ← Lecteur vidéo extraits
├── server.js                 ← Serveur proxy pour éviter CORS
├── package.json              ← Configuration npm
├── ListOfSyracuseIds.txt     ← Liste des 589 IDs disponibles
├── css/
│   └── style.css             ← Styles (hiérarchie, sections dépliables)
└── js/
    └── script.js             ← Fonctions communes
```

## Raccourcis clavier

- **Clic sur section** : Déplier/replier les sous-chapitres
- **Clic sur sous-chapitre** : Lancer la lecture à ce moment
- **F12** : Ouvrir la console de débogage
- **Ctrl + C** (dans le terminal) : Arrêter le serveur
