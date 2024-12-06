import { AliExpressScraper } from './scraper.js';
import { EbayListingAutomator } from './EbayLister.js';

console.log("Content")

const scraper = new AliExpressScraper();
console.log("scraper",scraper)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'extractProduct') {
    try {
      // Scrape product data
      console.log('Extracting product data...');
      const scrapeResult = await scraper.scrapeProduct();
      console.log("scrape result:",scrapeResult)
      if (!scrapeResult.success) throw new Error(scrapeResult.error);

      // Automate eBay listing
      // const lister = new EbayListingAutomator(scrapeResult.data);
      // await lister.createListing();

      sendResponse({ success: true, message: 'Listing created successfully!', data:scraper.productData });
    } catch (error) {
      console.error('Error processing request:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  return true; // Keep message channel open for async responses
});
