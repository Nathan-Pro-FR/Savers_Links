let currentGroup = JSON.parse(localStorage.getItem('imported_links_group_map')) || {};

document.addEventListener('DOMContentLoaded', () => {
  renderList();
});

function extractSiteName(urlStr) {
  try {
    const fullUrl = urlStr.match(/^https?:\/\//i) ? urlStr : `https://${urlStr}`;
    const parsed = new URL(fullUrl);
    return parsed.hostname;
  } catch (e) {
    const match = urlStr.replace(/^https?:\/\//i, '').split('/')[0];
    return match || 'inconnu';
  }
}

function importLinks() {
  const input = document.getElementById('linkInput');
  const rawText = input.value.trim();

  if (!rawText) return;

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  lines.forEach(link => {
    const now = new Date();
    const timestamp = now.getTime();
    const totalItems = Object.keys(currentGroup).length;
    const numero = totalItems + 1;
    const nomSite = extractSiteName(link);

    const heures24 = now.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const dateFormatted = now.toLocaleDateString('fr-FR');

    // Clé du dictionnaire : Timestamp_NomSite
    const itemKey = `${timestamp}_${nomSite}`;
    
    // ID complet : Numero_Timestamp_NomSite
    const customId = `${numero}_${timestamp}_${nomSite}`;

    currentGroup[itemKey] = {
      id: customId,
      numéro: numero,
      lien: link,
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
  localStorage.setItem('imported_links_group_map', JSON.stringify(currentGroup));
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

// Enregistrement du Service Worker externe
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .catch(err => console.error('Erreur SW:', err));
}
