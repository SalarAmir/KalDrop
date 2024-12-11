import { AliExpressScraper } from "./scraper.js";
import { EbayListingAutomator } from "./EbayLister.js";
import { BackgroundCommunication } from "./backgroundCommunication.js";

console.log("Content Script Loaded");

const scraper = new AliExpressScraper();
const lister = new EbayListingAutomator();
console.log("scraper", scraper);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === "extractProduct") {
      try {
        // Scrape product data
        console.log("Extracting product data...");
        const scrapeResult = await scraper.scrapeProduct();
        console.log("scrape result:", scrapeResult);
        if (!scrapeResult.success) throw new Error(scrapeResult.error);

        // Prepare product data for listing
        const listingData = {
          title: scrapeResult.data.title,
          description: `
              Original Price: $${scrapeResult.data.originalPrice || "N/A"}
              Discount: ${scrapeResult.data.discount || "No discount"}
              
              Product Details:
              - Estimated Selling Price: $${scrapeResult.data.sellingPrice}
              - Estimated Profit: $${scrapeResult.data.estimatedProfit}
              - Rating: ${scrapeResult.data.rating || "N/A"} ⭐
              - Total Reviews: ${scrapeResult.data.reviews}
              - Units Sold: ${scrapeResult.data.soldCount}
    
              Variants:
              Colors: ${
                scrapeResult.data.variants.colors
                  .map((c) => c.value)
                  .join(", ") || "N/A"
              }
              Sizes: ${
                scrapeResult.data.variants.sizes
                  .map((s) => s.value)
                  .join(", ") || "N/A"
              }
            `,
          price: parseFloat(scrapeResult.data.sellingPrice),
          images: scrapeResult.data.images,
          categoryId: "", // You'll need to map this
          listingOptions: {
            requireImmediatePayment: true,
            quantity: 5, // Default to 5 units
            allowOffers: true,
          },
        };
        console.log(listingData);
        const backgroundComm = await BackgroundCommunication.sendMessage(
          "extractProduct",
          { data: listingData }
        );
        console.log("backgroundComm:", backgroundComm);
        sendResponse({
          success: true,
          message: "Product scraped successfully!",
          data: listingData,
        });
      } catch (error) {
        console.error("Error extracting product:", error);
        sendResponse({ success: false, error: error.message });
      }

      // return true;
    }
  })();

  return true; // Keep message channel open for async responses
});
// chrome.runtime.sendMessage({ action: 'debugStorage' }, (response) => {
//   console.log('[Debug] Stored product data:', response.data);
// });