const ebayLister = new EbayLister();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createListing') {
    ebayLister.createListing(request.productData).then(sendResponse);
    return true; // Keep message channel open for async response
  }
});