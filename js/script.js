/**
 * Fonction pour convertir le temps "HH:MM:SS.mmm" en secondes
 * @param {string} timeStr - Temps au format "HH:MM:SS.mmm"
 * @returns {number} - Temps en secondes
 */
function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fonction pour formater la durée en "mm:ss"
 * @param {string} startStr - Temps de début
 * @param {string} endStr - Temps de fin
 * @returns {string} - Durée formatée
 */
function formatDuration(startStr, endStr) {
  const startSec = timeToSeconds(startStr);
  const endSec = timeToSeconds(endStr);
  const durationSec = Math.round(endSec - startSec);
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Fonction pour extraire le titre et le compositeur
 * @param {string} fullTitle - Titre complet (ex: "Titre , Compositeur")
 * @returns {object} - { title, composer }
 */
function parseTitle(fullTitle) {
  const parts = fullTitle.split(' , ');
  if (parts.length >= 2) {
    return {
      title: parts[0].trim(),
      composer: parts[1].trim()
    };
  }
  return {
    title: fullTitle,
    composer: ''
  };
}

/**
 * Charger et afficher le programme
 * @param {string} configUrl - URL du fichier JSON de configuration
 * @param {object} player - Instance du player PUPlayer
 */
function loadProgram(configUrl, player) {
  fetch(configUrl)
    .then(response => response.json())
    .then(data => {
      const programList = document.getElementById('program-list');
      const chapters = data.chapters || [];
      const isExtrait = data.mode === 'sample';

      chapters.forEach((chapter, index) => {
        const parsed = parseTitle(chapter.title);
        const duration = formatDuration(chapter.start, chapter.end);
        const startSeconds = timeToSeconds(chapter.start);
        const hasExtrait = chapter.startSample && chapter.endSample;

        const li = document.createElement('li');
        li.className = 'program-item';
        li.dataset.start = startSeconds;
        li.dataset.index = index;

        li.innerHTML = `
          <span class="index">${chapter.index || index + 1}</span>
          <div class="content">
            <div class="title">${parsed.title}</div>
            ${parsed.composer ? `<div class="composer">${parsed.composer}</div>` : ''}
          </div>
          ${hasExtrait && isExtrait ? '<span class="badge">Extrait</span>' : ''}
          <span class="duration">${duration}</span>
          <svg class="play-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;

        // Clic pour naviguer vers le chapitre
        li.addEventListener('click', () => {
          // Utiliser l'API du player pour seek
          if (player && player.seek) {
            player.seek(startSeconds);
          } else if (player && player.jwplayer) {
            player.jwplayer().seek(startSeconds);
          } else if (window.jwplayer) {
            jwplayer().seek(startSeconds);
          }
          
          // Mettre à jour l'état actif
          document.querySelectorAll('.program-item').forEach(item => {
            item.classList.remove('active');
          });
          li.classList.add('active');
        });

        programList.appendChild(li);
      });

      // Écouter les changements de temps pour mettre à jour l'élément actif
      const updateActiveChapter = (currentTime) => {
        const items = document.querySelectorAll('.program-item');
        items.forEach((item, idx) => {
          const start = parseFloat(item.dataset.start);
          const nextItem = items[idx + 1];
          const end = nextItem ? parseFloat(nextItem.dataset.start) : Infinity;
          
          if (currentTime >= start && currentTime < end) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      };

      // Essayer de s'abonner aux événements de temps du player
      setTimeout(() => {
        if (window.jwplayer) {
          jwplayer().on('time', (e) => {
            updateActiveChapter(e.position);
          });
        }
      }, 2000);
    })
    .catch(error => {
      console.error('Erreur lors du chargement du programme:', error);
    });
}

