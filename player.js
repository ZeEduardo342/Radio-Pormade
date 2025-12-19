let playlist = [];
let currentIndex = 0;
let failedTracks = new Set();
let isPlaying = false;

const audio = document.getElementById('audio-player');
const progressBar = document.getElementById('progress-bar');
const statusMessage = document.getElementById('status-message');

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = 'block';
  setTimeout(() => statusMessage.style.display = 'none', 4000);
}



/* ======================
   CONTROLE DE FAIXAS
====================== */

function playCurrentTrack() {
  if (!playlist.length) return;

  // Se todas falharam → PARA
  if (failedTracks.size >= playlist.length) {
    showStatus("Nenhuma faixa válida disponível.");
    audio.pause();
    isPlaying = false;
    return;
  }

  // Pula faixas inválidas
  if (failedTracks.has(currentIndex)) {
    goToNextTrack();
    return;
  }

  const track = playlist[currentIndex];
  audio.src = track.linkConvertido;
  audio.load();

  audio.play()
    .then(() => {
      isPlaying = true;
      console.log("Tocando:", track.nome);
    })
    .catch(() => {
      failedTracks.add(currentIndex);
      goToNextTrack();
    });
}

function goToNextTrack() {
  currentIndex = (currentIndex + 1) % playlist.length;
  setTimeout(playCurrentTrack, 300);
}

/* ======================
   EVENTOS DO AUDIO
====================== */

audio.addEventListener("ended", () => {
  goToNextTrack();
});

audio.addEventListener("error", () => {
  console.warn("Erro de mídia");
  failedTracks.add(currentIndex);
  goToNextTrack();
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = percent + "%";
});

/* ======================
   FIRESTORE
====================== */

function loadPlaylist() {
  db.collection(COLLECTION_NAME)
    .where("ativo", "==", true)
    .orderBy("ordem", "asc")
    .onSnapshot(snapshot => {

      const newList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (!newList.length) {
        playlist = [];
        audio.pause();
        isPlaying = false;
        return;
      }

      playlist = newList;

      // Se não está tocando, inicia
      if (!isPlaying) {
        currentIndex = 0;
        failedTracks.clear();
        playCurrentTrack();
      }
    });
}

document.addEventListener("DOMContentLoaded", loadPlaylist);
