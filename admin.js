// Variáveis globais (definidas em firebase-config.js)
// const db = firebase.firestore();
// const COLLECTION_NAME = "musicas";

// --- Funções de Utilidade ---

/**
 * Converte um link de compartilhamento do Dropbox para um link de download direto.
 * Ex: https://www.dropbox.com/s/abcdefghij/musica.mp3?dl=0
 * Para: https://dl.dropboxusercontent.com/s/abcdefghij/musica.mp3
 * @param {string} shareLink O link de compartilhamento do Dropbox.
 * @returns {string} O link de download direto.
 */
function convertDropboxLink(shareLink) {
  // Se já tiver raw=1, não mexe
  if (shareLink.includes("raw=1")) {
    return shareLink;
  }

  // Se já tiver parâmetros, adiciona raw=1 com &
  if (shareLink.includes("?")) {
    return shareLink + "&raw=1";
  }

  // Caso raro: sem parâmetros
  return shareLink + "?raw=1";
}


/**
 * Gera um nome de faixa automático baseado no número da ordem.
 * @param {number} order O número da ordem.
 * @returns {string} O nome formatado (ex: Faixa 005).
 */
function generateTrackName(order) {
    return `Faixa ${String(order).padStart(3, '0')}`;
}

// --- Funções de Interação com o Firestore ---

/**
 * Adiciona uma nova faixa ao Firestore.
 * @param {string} nome Nome da faixa.
 * @param {string} linkOriginal Link de compartilhamento do Dropbox.
 * @param {string} linkConvertido Link de download direto.
 * @param {number} ordem Ordem da faixa.
 */
async function addTrack(nome, linkOriginal, linkConvertido, ordem) {
    try {
        const newTrack = {
            nome: nome,
            linkOriginal: linkOriginal,
            linkConvertido: linkConvertido,
            ordem: ordem,
            ativo: true, // Nova faixa começa ativa
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(COLLECTION_NAME).add(newTrack);
        document.getElementById('form-status').textContent = `Faixa "${nome}" adicionada com sucesso!`;
        document.getElementById('form-status').style.color = 'var(--color-green)';
    } catch (error) {
        console.error("Erro ao adicionar faixa: ", error);
        document.getElementById('form-status').textContent = `Erro ao adicionar faixa: ${error.message}`;
        document.getElementById('form-status').style.color = '#dc3545';
    }
}

/**
 * Atualiza um campo específico de uma faixa.
 * @param {string} docId ID do documento no Firestore.
 * @param {object} updateData Objeto com os campos a serem atualizados.
 */
async function updateTrack(docId, updateData) {
    try {
        await db.collection(COLLECTION_NAME).doc(docId).update(updateData);
    } catch (error) {
        console.error("Erro ao atualizar faixa: ", error);
        alert("Erro ao atualizar faixa. Verifique o console para mais detalhes.");
    }
}

/**
 * Remove uma faixa do Firestore.
 * @param {string} docId ID do documento no Firestore.
 */
async function removeTrack(docId) {
    if (confirm("Tem certeza que deseja remover esta faixa?")) {
        try {
            await db.collection(COLLECTION_NAME).doc(docId).delete();
        } catch (error) {
            console.error("Erro ao remover faixa: ", error);
            alert("Erro ao remover faixa. Verifique o console para mais detalhes.");
        }
    }
}

// --- Funções de Renderização e Eventos ---

/**
 * Renderiza a lista de faixas na tabela.
 * @param {Array<object>} tracks Lista de faixas com seus IDs de documento.
 */
function renderTracks(tracks) {
    const tracksList = document.getElementById('tracks-list');
    tracksList.innerHTML = ''; // Limpa a lista atual

    tracks.forEach((track, index) => {
        const row = tracksList.insertRow();
        row.dataset.docId = track.id;

        // Célula de Ordem
        row.insertCell().textContent = track.ordem;

        // Célula de Nome
        row.insertCell().textContent = track.nome;

        // Célula de Status
        const statusCell = row.insertCell();
        statusCell.textContent = track.ativo ? 'Ativa' : 'Inativa';
        statusCell.className = track.ativo ? 'status-active' : 'status-inactive';

        // Célula de Link Original
        const linkCell = row.insertCell();
        const link = document.createElement('a');
        link.href = track.linkOriginal;
        link.target = '_blank';
        link.textContent = 'Ver Link';
        linkCell.appendChild(link);

        // Célula de Ações
        const actionsCell = row.insertCell();

        // Botão Subir Ordem
        const btnUp = document.createElement('button');
        btnUp.textContent = '↑';
        btnUp.className = 'btn-up';
        btnUp.disabled = index === 0;
        btnUp.onclick = () => moveTrackOrder(track.id, track.ordem, tracks[index - 1]?.id, tracks[index - 1]?.ordem);
        actionsCell.appendChild(btnUp);

        // Botão Descer Ordem
        const btnDown = document.createElement('button');
        btnDown.textContent = '↓';
        btnDown.className = 'btn-down';
        btnDown.disabled = index === tracks.length - 1;
        btnDown.onclick = () => moveTrackOrder(track.id, track.ordem, tracks[index + 1]?.id, tracks[index + 1]?.ordem);
        actionsCell.appendChild(btnDown);

        // Botão Ativar/Desativar
        const btnToggle = document.createElement('button');
        btnToggle.textContent = track.ativo ? 'Desativar' : 'Ativar';
        btnToggle.className = 'btn-toggle-active';
        btnToggle.onclick = () => updateTrack(track.id, { ativo: !track.ativo });
        actionsCell.appendChild(btnToggle);

        // Botão Pré-visualizar (Play / Pause)
        const btnPreview = document.createElement('button');
        btnPreview.textContent = 'Pré-visualizar';
        btnPreview.className = 'btn-preview';

        btnPreview.onclick = () => {
        previewTrack(track.linkConvertido, btnPreview);
};

actionsCell.appendChild(btnPreview);


        // Botão Remover
        const btnRemove = document.createElement('button');
        btnRemove.textContent = 'Remover';
        btnRemove.className = 'btn-remove';
        btnRemove.onclick = () => removeTrack(track.id);
        actionsCell.appendChild(btnRemove);
    });
}

/**
 * Troca a ordem de duas faixas.
 * @param {string} id1 ID do documento da primeira faixa.
 * @param {number} order1 Ordem da primeira faixa.
 * @param {string} id2 ID do documento da segunda faixa.
 * @param {number} order2 Ordem da segunda faixa.
 */
async function moveTrackOrder(id1, order1, id2, order2) {
    if (!id2) return; // Não há faixa para trocar

    // Usa um batch para garantir que ambas as atualizações ocorram ou nenhuma ocorra
    const batch = db.batch();

    const docRef1 = db.collection(COLLECTION_NAME).doc(id1);
    const docRef2 = db.collection(COLLECTION_NAME).doc(id2);

    batch.update(docRef1, { ordem: order2 });
    batch.update(docRef2, { ordem: order1 });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Erro ao reordenar faixas: ", error);
        alert("Erro ao reordenar faixas. Verifique o console para mais detalhes.");
    }
}

/**
 * Inicia a pré-visualização de uma faixa.
 * @param {string} convertedLink Link de download direto da faixa.
 */
function previewTrack(convertedLink, button) {
  const player = document.getElementById("preview-player");

  // Se estiver tocando essa mesma música → pausa
  if (!player.paused && player.src === convertedLink) {
    player.pause();
    button.textContent = "Pré-visualizar";
    return;
  }

  // Caso contrário, toca a música
  player.pause();
  player.src = convertedLink;
  player.currentTime = 0;

  player.play().then(() => {
    button.textContent = "Pausar";
  }).catch(error => {
    console.error("Erro ao tentar reproduzir:", error);
    alert("Erro ao tentar reproduzir. Verifique o link.");
  });
}

// --- Inicialização e Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    const addTrackForm = document.getElementById('add-track-form');

    // Listener para o formulário de adição
    addTrackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dropboxLink = document.getElementById('dropbox-link').value.trim();
        let trackName = document.getElementById('track-name').value.trim();
        let trackOrderInput = document.getElementById('track-order').value.trim();

        if (!dropboxLink) {
            alert("O link do Dropbox é obrigatório.");
            return;
        }

        const convertedLink = convertDropboxLink(dropboxLink);

        // 1. Determinar a próxima ordem se não for fornecida
        let nextOrder = parseInt(trackOrderInput);
        if (isNaN(nextOrder)) {
            // Busca a maior ordem atual para determinar a próxima
            const snapshot = await db.collection(COLLECTION_NAME)
                .orderBy('ordem', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                nextOrder = snapshot.docs[0].data().ordem + 1;
            } else {
                nextOrder = 1;
            }
        }

        // 2. Gerar nome automático se não for fornecido
        if (!trackName) {
            trackName = generateTrackName(nextOrder);
        }

        // 3. Adicionar a faixa
        await addTrack(trackName, dropboxLink, convertedLink, nextOrder);

        // Limpar o formulário
        addTrackForm.reset();
    });

    // Listener em tempo real para a coleção de músicas
    db.collection(COLLECTION_NAME)
        .orderBy('ordem', 'asc')
        .onSnapshot(snapshot => {
            const tracks = [];
            snapshot.forEach(doc => {
                tracks.push({ id: doc.id, ...doc.data() });
            });
            renderTracks(tracks);
        }, error => {
            console.error("Erro ao receber snapshot do Firestore: ", error);
            alert("Erro ao carregar a lista de faixas. Verifique a conexão e as permissões do Firebase.");
        });
});
