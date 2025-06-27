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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const { blockedWebsites = [] } = await chrome.storage.sync.get('blockedWebsites');

        const shouldBlock = blockedWebsites.some(website =>
            tab.url.includes(website)
        );

        if (shouldBlock) {
            chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
        }
    }
});