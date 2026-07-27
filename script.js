let currentGroup = JSON.parse(localStorage.getItem('imported_links_map')) || {};

document.addEventListener('DOMContentLoaded', () => {
  renderList();
});

function extractSiteName(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, '');
  } catch (e) {
    return 'inconnu';
  }
}

function importLinks() {
  const input = document.getElementById('linkInput');
  const rawText = input.value.trim();

  if (!rawText) return;

  const urlRegex = /https?:\/\/[^\s]+/gi;
  const matches = rawText.match(urlRegex);

  if (!matches || matches.length === 0) {
    alert("Aucun lien valide (http:// ou https://) n'a été trouvé.");
    return;
  }

  const cleanLinks = matches.map(link => link.replace(/[,;.]+$|\)+$/, '').trim());
  const baseTimestamp = Date.now();

  cleanLinks.forEach((cleanUrl, index) => {
    const timestamp = baseTimestamp + index; 
    const totalItems = Object.keys(currentGroup).length;
    const numero = totalItems + 1;
    const nomSite = extractSiteName(cleanUrl);

    const now = new Date(timestamp);
    const heures24 = now.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const dateFormatted = now.toLocaleDateString('fr-FR');

    // Ajout de 'numero' dans la clé pour garantir l'unicité même en cas de doublon
    const itemKey = `${numero}_${timestamp}_${nomSite}`;
    const customId = `${numero}_${timestamp}_${nomSite}`;

    currentGroup[itemKey] = {
      id: customId,
      numéro: numero,
      lien: cleanUrl,
      nom_site: nomSite,
      date: dateFormatted,
      heures: heures24,
      timestamp: timestamp
    };
  });

  saveToStorage();
  renderList();
  input.value = '';
}

function renderList() {
  const listEl = document.getElementById('itemsList');
  const counterEl = document.getElementById('counter');
  if (!listEl || !counterEl) return;

  listEl.innerHTML = '';

  const entries = Object.entries(currentGroup);
  counterEl.textContent = `${entries.length} lien(s) dans le groupe`;

  entries.reverse().forEach(([key, item]) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
        <span>#${item.numéro} — ${item.nom_site}</span>
        <span>${item.heures}</span>
      </div>
      <div class="item-key">Clé: "${key}"</div>
      <a href="${item.lien}" target="_blank" rel="noopener" class="item-link">${item.lien}</a>
      <div class="item-meta">
        <span>📅 ${item.date}</span>
        <span>⏱️ ${item.timestamp}</span>
        <span>ID: ${item.id}</span>
      </div>
    `;
    listEl.appendChild(card);
  });
}

function saveToStorage() {
  localStorage.setItem('imported_links_map', JSON.stringify(currentGroup));
}

function exportJSON() {
  if (Object.keys(currentGroup).length === 0) return alert('Le groupe est vide !');

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentGroup, null, 2));
  const downloadAnchor = document.createElement('a');
  const fileName = `groupe_liens_${new Date().getTime()}.json`;

  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function copyJSON() {
  if (Object.keys(currentGroup).length === 0) return alert('Le groupe est vide !');

  navigator.clipboard.writeText(JSON.stringify(currentGroup, null, 2))
    .then(() => alert('JSON copié dans le presse-papier !'))
    .catch(err => console.error('Erreur lors de la copie :', err));
}

function clearGroup() {
  if (confirm('Voulez-vous vraiment effacer tout le groupe actuel ?')) {
    currentGroup = {};
    saveToStorage();
    renderList();
  }
}

// Enregistrement du Service Worker avec rechargement automatique à la mise à jour
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    // Vérifie les mises à jour
    reg.update();
  }).catch(err => console.error('Erreur SW:', err));

  // Si le nouveau SW prend le contrôle, on rafraîchit pour charger le nouveau code
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
