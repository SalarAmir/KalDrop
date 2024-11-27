const scraper = new AliExpressScraper();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProduct') {
    scraper.scrapeProduct().then(sendResponse);
    return true; // Keep message channel open for async response
  }
});