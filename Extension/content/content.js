import { AliExpressScraper } from "./scraper.js";
import { EbayListingAutomator } from "./EbayLister.js";
import { BackgroundCommunication } from "./backgroundCommunication.js";

console.log("Content Script Loaded");

const scraper = new AliExpressScraper();
const lister = new EbayListingAutomator();
console.log("scraper", scraper);
//message from popup:
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === "extractProduct") {
      try {
        // Scrape product data
        console.log("Extracting product data...");
        const scrapeResult = await scraper.scrapeProduct();
        console.log("scrape result:", scrapeResult);
        if (!scrapeResult.success) throw new Error(scrapeResult.error);

        //send scraped product to background:
        const backgroundComm = await BackgroundCommunication.sendMessage(
          "extractProduct",
          { data: scrapeResult.data }
        );
        console.log("backgroundComm:", backgroundComm);
        //send scraped product to popup:
        sendResponse({
          success: true,
          message: "Product scraped successfully!",
          data: scrapeResult.data,
        });
      } catch (error) {
        console.error("Error extracting product:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
  })();

  return true; // Keep message channel open for async responses
});
// chrome.runtime.sendMessage({ action: 'debugStorage' }, (response) => {
//   console.log('[Debug] Stored product data:', response.data);
// });