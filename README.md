# New-player

Lecteur vidéo basé sur PUPlayer (Philharmonie de Paris) avec affichage du programme de concert cliquable.

## Structure du projet

```
New-player/
├── css/
│   └── style.css              # Styles du programme
├── js/
│   └── script.js              # Logique du programme
├── json/
│   ├── config-Video-Extrait.json   # Config mode extrait
│   └── config-Video-Integral.json  # Config mode intégral
├── Pup-Video-Extrait.html     # Page mode extrait
├── Pup-Video-Integral.html    # Page mode intégral
└── README.md
```

## Fonctionnalités

- **Lecteur vidéo** : Intégration du PUPlayer de la Philharmonie
- **Programme cliquable** : Liste des chapitres sous la vidéo
- **Navigation** : Clic sur un chapitre pour sauter à ce moment
- **Suivi automatique** : Le chapitre en cours est mis en surbrillance

---

## Explication du script (`js/script.js`)

### 1. `timeToSeconds(timeStr)`

Convertit un temps au format `"HH:MM:SS.mmm"` en secondes.

Le fichier JSON stocke les temps au format lisible `"HH:MM:SS.mmm"` (ex: `"01:23:45.500"`), mais **JWPlayer ne comprend que les secondes**.

**Cas d'utilisation :**
- `jwplayer().seek(secondes)` → naviguer à un moment précis dans la vidéo
- `jwplayer().on('time', e => e.position)` → la position actuelle est retournée en secondes
- Comparer si le temps actuel est dans la plage d'un chapitre

```javascript
function timeToSeconds(timeStr) {
  if (!timeStr) return 0;                    // Si pas de valeur, retourne 0
  const [h, m, s] = timeStr.split(':');      // Sépare "01:23:45" en ["01", "23", "45"]
  return (+h * 3600) + (+m * 60) + parseFloat(s);  // Calcul : heures×3600 + minutes×60 + secondes
}
```

**Détail du calcul :**

Pour `"01:23:45.500"` :
- `h = "01"` → 1 heure = 1 × 3600 = **3600 secondes**
- `m = "23"` → 23 minutes = 23 × 60 = **1380 secondes**
- `s = "45.500"` → **45.5 secondes**
- Total : 3600 + 1380 + 45.5 = **5025.5 secondes**

---

### 2. `formatDuration(start, end)`

Calcule la durée entre deux temps et la formate en `"mm:ss"`.

```javascript
function formatDuration(start, end) {
  const dur = Math.round(timeToSeconds(end) - timeToSeconds(start));  // Durée en secondes
  return `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`;
  //       └─ minutes ─┘          └─ secondes avec zéro devant si < 10 ─┘
}
```

**Exemple :** `start="00:00:00"`, `end="00:12:47"` → `"12:47"`

---

### 3. `loadProgram(configUrl, player)`

Fonction principale qui charge le JSON et génère la liste du programme.

#### Étape 1 : Charger le JSON

```javascript
fetch(configUrl)                    // Récupère le fichier JSON
  .then(res => res.json())          // Convertit la réponse en objet JS
  .then(data => { ... });           // Utilise les données
```

#### Étape 2 : Parcourir les chapitres selon le mode

```javascript
const isExtrait = data.mode === 'sample';  // Détecte si mode Extrait (sample) ou Intégral

data.chapters.forEach((chapter, i) => {
  const [title, composer] = chapter.title.split(' , ');  // Sépare "Titre , Compositeur"
  const startSec = timeToSeconds(chapter.start);         // Temps de début en secondes
  ...
});
```

#### Étape 3 : Créer l'élément HTML

```javascript
const li = document.createElement('li');   // Crée un <li>
li.className = 'program-item';             // Ajoute la classe CSS

li.innerHTML = `
  <span class="index">${chapter.index || i + 1}</span>     <!-- Numéro -->
  <div class="content">
    ${composer ? `<div class="composer">${composer}</div>  <!-- Compositeur -->
    <div class="title">${title}</div>` : ''}               <!-- Titre -->
  </div>
  <span class="duration">${formatDuration(...)}</span>     <!-- Durée -->
`;
```

#### Étape 4 : Gérer le clic

```javascript
li.onclick = () => {
  if (window.jwplayer) {
    if (isExtrait) {
      // Mode Extrait : changer de piste (chaque chapitre = vidéo séparée)
      jwplayer().playlistItem(i);
    } else {
      // Mode Intégral : seek dans la vidéo unique
      jwplayer().seek(startSec);
    }
  }
  list.querySelectorAll('.active').forEach(el => el.classList.remove('active'));  // Retire "active" de tous
  li.classList.add('active');  // Ajoute "active" à l'élément cliqué
};
```

#### Étape 5 : Suivi automatique pendant la lecture

```javascript
setTimeout(() => {                    // Attend 2 secondes (le temps que le player charge)
  if (window.jwplayer) {
    if (isExtrait) {
      // Mode Extrait : écouter le changement de piste
      jwplayer().on('playlistItem', e => {
        const items = list.children;
        for (let i = 0; i < items.length; i++) {
          items[i].classList.toggle('active', i === e.index);
        }
      });
    } else {
      // Mode Intégral : écouter le temps
      jwplayer().on('time', e => {
        const items = list.children;
        for (let i = 0; i < items.length; i++) {
          const start = timeToSeconds(data.chapters[i].start);
          const end = data.chapters[i + 1] ? timeToSeconds(data.chapters[i + 1].start) : Infinity;
          // Active l'élément si le temps actuel est entre start et end
          items[i].classList.toggle('active', e.position >= start && e.position < end);
        }
      });
    }
  }
}, 2000);
```

---

## Fichiers

### `css/style.css`

Styles CSS pour :
- Le conteneur du player
- La section programme (titre, liste)
- Les éléments de la liste (index, titre, compositeur, durée)
- Responsive mobile

### Fichiers JSON

Format des chapitres dans le JSON :

```json
{
  "chapters": [
    {
      "title": "Nom de l'œuvre , Compositeur",
      "start": "00:00:00",
      "end": "00:12:47.4700000",
      "index": "1"
    }
  ]
}
```

## Utilisation

```html
<!-- Inclure les fichiers -->
<link href="css/style.css" rel="stylesheet" />
<script src="js/script.js"></script>

<!-- Conteneur du programme -->
<div id="program-section">
  <div id="program-header">
    <h2>Programme du concert</h2>
  </div>
  <ul id="program-list"></ul>
</div>

<!-- Initialiser -->
<script>
  const configUrl = "json/config-Video-Integral.json";
  const player = PUPlayer.create(...);
  loadProgram(configUrl, player);
</script>
```

## Dépendances

- [JWPlayer](https://cdn.jwplayer.com/libraries/yv750rlh.js)
- [PUPlayer CSS](https://pup.philharmoniedeparis.fr/puplayer.css)
- [PUPlayer JS](https://pup.philharmoniedeparis.fr/puplayer.umd.js)
