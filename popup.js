const defaultWebsites = [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com'
];

document.addEventListener('DOMContentLoaded', async () => {
    const { blockedWebsites = defaultWebsites } = await chrome.storage.sync.get('blockedWebsites');

    if (blockedWebsites.length === 0) {
        await chrome.storage.sync.set({ blockedWebsites: defaultWebsites });
        blockedWebsites.push(...defaultWebsites);
    }

    renderWebsites(blockedWebsites);
});

function renderWebsites(websites) {
    const list = document.getElementById('websites-list');
    list.innerHTML = '';

    websites.forEach(website => {
        const item = document.createElement('div');
        item.className = 'website-item';
        item.innerHTML = `
            <span>${website}</span>
            <button class="remove-btn" data-website="${website}">Remove</button>
        `;
        list.appendChild(item);
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', removeWebsite);
    });
}

document.getElementById('add-website').addEventListener('click', addWebsite);
document.getElementById('new-website').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWebsite();
});

async function addWebsite() {
    const input = document.getElementById('new-website');
    const website = input.value.trim().toLowerCase();

    if (!website) return;

    const { blockedWebsites = [] } = await chrome.storage.sync.get('blockedWebsites');

    if (!blockedWebsites.includes(website)) {
        blockedWebsites.push(website);
        await chrome.storage.sync.set({ blockedWebsites });
        renderWebsites(blockedWebsites);
    }

    input.value = '';
}

async function removeWebsite(e) {
    const website = e.target.dataset.website;
    const { blockedWebsites = [] } = await chrome.storage.sync.get('blockedWebsites');

    const updated = blockedWebsites.filter(w => w !== website);
    await chrome.storage.sync.set({ blockedWebsites: updated });
    renderWebsites(updated);
}