// Convertir "HH:MM:SS.mmm" en secondes
function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const [h, m, s] = timeStr.split(':');
  return (+h * 3600) + (+m * 60) + parseFloat(s);
}

// Formater la durée en "mm:ss"
function formatDuration(start, end) {
  const dur = Math.round(timeToSeconds(end) - timeToSeconds(start));
  return `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`;
}

// Charger et afficher le programme
function loadProgram(configUrl) {
  fetch(configUrl)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('program-list');
      const isExtrait = data.mode === 'sample';  // Détecte le mode

      data.chapters.forEach((chapter, i) => {
        const [title, composer] = chapter.title.split(' , ');
        const startSec = timeToSeconds(chapter.start);

        const li = document.createElement('li');
        li.className = 'program-item';

        li.innerHTML = `
          <span class="index">${chapter.index || i + 1}.</span>
          <div class="content">
            ${composer ? `<div class="composer">${composer}</div>
            <div class="title">${title}</div>` : ''}
          </div>
          <span class="duration">${formatDuration(chapter.start, chapter.end)}</span>
        `;

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
          // Mettre à jour l'état actif
          list.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
          li.classList.add('active');
        };

        list.appendChild(li);
      });

      // Mise à jour du chapitre actif pendant la lecture
      setTimeout(() => {
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
                items[i].classList.toggle('active', e.position >= start && e.position < end);
              }
            });
          }
        }
      }, 2000);
    });
}
