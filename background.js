const defaultWebsites = [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com'
];

chrome.runtime.onInstalled.addListener(async () => {
    const { blockedWebsites } = await chrome.storage.sync.get('blockedWebsites');
    if (!blockedWebsites) {
        await chrome.storage.sync.set({ blockedWebsites: defaultWebsites });
    }
});

function isWebsiteBlocked(url, blockedWebsites) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        return blockedWebsites.some(website => {
            const cleanWebsite = website.replace(/^https?:\/\//, '');
            console.log({ cleanWebsite, hostname, urlObj })
            return hostname === cleanWebsite || hostname.endsWith('.' + cleanWebsite);
        });
    } catch (e) {
        return false;
    }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const { blockedWebsites = [] } = await chrome.storage.sync.get('blockedWebsites');
        const shouldBlock = isWebsiteBlocked(tab.url, blockedWebsites);

        if (shouldBlock) {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
        }
    }
});