
import { AliExpressScraper } from './scraper.js';
import { EbayListingAutomator } from './EbayLister.js';

const scraper = new AliExpressScraper();
const lister = new EbayListingAutomator();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'extractProduct') {
        try {
            // Scrape product data
            const scrapeResult = await scraper.scrapeProduct();
            if (!scrapeResult.success) throw new Error(scrapeResult.error);

            sendResponse({ 
                success: true, 
                data: scrapeResult.data 
            });
        } catch (error) {
            console.error('Extract Product Error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    if (request.action === 'createListing') {
        try {
            // Create eBay listing
            await lister.createListing(request.productData);
            
            sendResponse({ 
                success: true, 
                message: 'Listing created successfully!' 
            });
        } catch (error) {
            console.error('Create Listing Error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    return true; 
});