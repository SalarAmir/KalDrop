import { AliExpressScraper } from "./scraper.js";
import { EbayListingAutomator } from "./EbayLister.js";
import { BackgroundCommunication } from "./backgroundCommunication.js";
import { LoadingOverlay } from "./LoadingOverlay.js";

const scraper = new AliExpressScraper();
const loadingOverlay = new LoadingOverlay();
const lister = new EbayListingAutomator(loadingOverlay);

console.log("scraper", scraper);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        if (request.action === "extractProduct") {
            try {
                loadingOverlay.show('Extracting product data...');
                
                console.log("Extracting product data...");
                const scrapeResult = await scraper.scrapeProduct();
                console.log("scrape result:", scrapeResult);
                if (!scrapeResult.success) throw new Error(scrapeResult.error);
                
                loadingOverlay.updateMessage('Sending data to background...');
                const backgroundComm = await BackgroundCommunication.sendMessage(
                    "extractProduct",
                    { data: scrapeResult.data }
                );
                console.log("backgroundComm:", backgroundComm);
                
                loadingOverlay.hide();
                sendResponse({
                    success: true,
                    message: "Product scraped successfully!",
                    data: scrapeResult.data,
                });
            } catch (error) {
                console.error("Error extracting product:", error);
                loadingOverlay.hide();
                sendResponse({ success: false, error: error.message });
            }
        }
    })();
    return true;
});

//get tab id:
// const tabId = chrome.devtools.inspectedWindow.tabId;
// console.log("tabId:", tabId);

const backgroundComm = await BackgroundCommunication.sendMessage(
    'contentLoaded',
    { data: 'content loaded' },

);

console.log('backgroundComm:', backgroundComm);

if (backgroundComm.success) {
    if (backgroundComm.currentlyListing) {
        loadingOverlay.show('Listing in progress...');
    }
}