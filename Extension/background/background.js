console.log("Background script initialized");

class StorageService {
    static get(key) {
        console.log(`[StorageService.get] Fetching key: ${key}`);
        return new Promise((resolve) => {
            chrome.storage.local.get([key], function (result) {
                console.log(`[StorageService.get] Result for ${key}:`, result[key]);
                resolve(result[key]);
            });
        });
    }

    static set(key, value) {
        console.log(`[StorageService.set] Setting key: ${key} with value:`, value);
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, function () {
                console.log(`[StorageService.set] Successfully set ${key} to`, value);
                resolve();
            });
        });
    }
}

async function extractProductService(request) {
    try {
        console.log('[extractProductService] Started with request:', request);
        console.log('[extractProductService] Storing extracted product data:', request.data);
        await StorageService.set('lastExtractedProduct', request.data);
        console.log('[extractProductService] Product data saved successfully.');
		const lastProd = await StorageService.get("lastExtractedProduct");
		console.log("[extractProductService] in local: ",lastProd);

        return {success:true, data:request.data};
    } catch (error) {
        console.error('[extractProductService] Error:', error);
        return {success:false, error:error.toString()};
    }
}

async function createListingService() {
    const currentListingService = new ListingService();
    try{
        const lastProd = await StorageService.get("lastExtractedProduct");
        console.log("[createListingService] in local: ",lastProd);
        await currentListingService.startListingProcess(lastProd);
        console.log("[createListingService] Listing finished successfully.");
        return {success:true, data:lastProd};
    }
    catch(error){
        console.error('[createListingService] Error:', error);
        throw error;

    }
}

class ListingService{
    
    /*
        productData:{
            "title":"",
            "description": "",
            "price": ,
            "images": [],
            "categoryId": "",
            "listingOptions": {
                "requireImmediatePayment": true,
                "quantity": 5,
                "allowOffers": true
            }
        }
    */

    constructor(){
        //define actions sequence as list of functions
        this.processing = false;
        this.listingTabId = null;
        this.productData = null;

        this.actions = [
            // this.navigateToSellPage,
            (productData)=>this.clickListButton(productData),
            (productData)=>this.fillTitle(productData),
            (productData)=>this.selectCategory(productData),
            (productData)=>this.selectCondition(productData),
            (productData)=>this.fillImages(productData),
        ];
    }

    async startListingProcess(productData){
        if(this.processing){
            console.log('[ListingService] A listing process is already running. Ignoring this request.');
            return;
        }
        this.processing = true;
        console.log('[ListingService] Started with product data:', productData);
        const newTab = await chrome.tabs.create({
            url: 'https://www.ebay.com/sell/create',
            active: true,
        })
        console.log('[ListingService] New tab created with ID:', newTab.id);
        this.listingTabId = newTab.id;
        try {
            for (const action of this.actions) {
                console.log('[ListingService] Executing action:', action.name);
                console.log(this.listingTabId);
                await action(productData);
            }
        } catch (error) {
            console.error('[ListingService] Error:', error);
            throw error;
        } finally {
            this.processing = false;
        }
    }

    async clickListButton(productData){
        console.log('[ListingService] Clicking list button:', productData.title);
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'clickElement',
            selector: '#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a',
        })
        console.log('[ListingService] List button clicked successfully:', response);

    }

    async fillTitle(productData){
        console.log('[ListingService] Filling title:', productData.title);
        console.log('[ListingService] Sending message to tab ID:', this.listingTabId);
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'fillValue',
            selector:'#s0-1-1-24-7-\\@keyword-\\@box-\\@input-textbox',
            value: productData.title,
        });
        console.log('[ListingService] Title filled successfully:', response);
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'clickElement',
            selector:'#mainContent > div > div > div.keyword-suggestion > button',
        });
        console.log('[ListingService] Clicked on suggested title:', responseClick);
    }

    async selectCategory(productData){
        console.log("[ListingService] Looking for category popup:")
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'detectElement',
            selector: '#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker',
        })
        if(!response.success){
            console.log("[ListingService] Category popup not found. Continuing..")
            return;
        }
        console.log("[ListingService] Category popup found. Selecting category..")
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker > div > div.se-panel-container__body > div > div.se-panel-section.category-picker__suggested-section > div:nth-child(2) > button > span > span > span'
        })
        console.log("[ListingService] Category selected successfully.")
        console.log("[ListingService] Clicking without match button.");
        const responseClickWithoutMatch = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__next-container > button'
        })
    }

    async selectCondition(productData){
        console.log("[ListingService] Looking for condition popup..")
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'detectElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active'
        })
        if(!response.success){
            console.log("[ListingService] Condition popup not found. Continuing..")
            return;
        }
        console.log("[ListingService] Condition popup found. Selecting condition..")
        const respOptionSelect = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'selectOption',
            selector:'.condition-picker-radix__radio-group',
            text: 'New with box',
            index: 0
        })
        console.log("[ListingService] Condition selected successfully.")
        //continue listing button:
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.condition-dialog-non-block-radix__continue > button'
        })
        console.log("[ListingService] Clicked on continue button.")
    }

    async fillImages(productData){
        console.log('[ListingService] Filling images:', productData.images);
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'uploadImages',
            selector:'#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__photos.summary__photos-image-guidance.summary__photos--photo-framework > div:nth-child(2) > div > div.uploader-ui.empty > div:nth-child(1) > div.uploader-thumbnails-ux.uploader-thumbnails-ux--inline.uploader-thumbnails-ux--inline-edit > div',
            images: productData.images,
        });
        console.log('[ListingService] Images filled successfully:', response);
    }
}


async function waitForTabLoad(tabId, timeout = 15000) {
    console.log(`[waitForTabLoad] Waiting for tab ID ${tabId} to load...`);
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkTab = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error('Tab no longer exists'));
                }
                if (tab.status === 'complete') {
                    console.log(`[waitForTabLoad] Tab ID ${tabId} has loaded.`);
                    return resolve();
                }
                if (Date.now() - startTime > timeout) {
                    return reject(new Error('Tab load timeout exceeded'));
                }
                setTimeout(checkTab, 500);
            });
        };

        checkTab();
    });
}



// Communication services
class tabCommunication{
    static async sendMessage(tabId, message) {
        const response = await chrome.tabs.sendMessage(tabId, message);
        if(!response){
            throw new Error('No response from content script');
        }
        if(!response.success){
            throw new Error(response.error || 'Content script failed to process message');
        }
        return response;
    }

    static async sendMessageRetries(tabId, message, maxRetries = 3, retryDelay = 2000) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.sendMessage(tabId, message);
            } catch (error) {
                console.warn(`Attempt ${attempt+1} failed:`, error);
                if (attempt >= maxRetries) {
                    // throw error;
                    return {success:false, error:error.toString()};
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

}


// Action to service mapping
const actionToServiceMap = {
    'extractProduct': extractProductService,
    'listProduct': createListingService,
};

// Debugging helper to log all available actions
console.log('Available actions in actionToServiceMap:', Object.keys(actionToServiceMap));

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[onMessage] Received message:', request);

    const action = request.action;
    console.log('[onMessage] Action received:', action);

    if (!actionToServiceMap[action]) {
        console.error('[onMessage] Unknown action received:', action);
        sendResponse({ success: false, error: 'Unknown action' });
        return true;
    }

    console.log(`[onMessage] Processing action: ${action}`);
    actionToServiceMap[action](request)
        .then(response => {
            console.log(`[onMessage] Action ${action} processed successfully, response:`, response);
            sendResponse({ success: true, data: response });
        })
        .catch(error => {
            console.error(`[onMessage] Error processing action ${action}:`, error);
            sendResponse({
                success: false,
                error: error.toString()
            });
        });

    return true; // Allow asynchronous response
});


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'debugStorage') {
//         chrome.storage.local.get('lastExtractedProduct', (result) => {
//             console.log('[Debug] Stored product data:', result.lastExtractedProduct);
//             sendResponse({ data: result.lastExtractedProduct });
//         });
//         return true; // To keep the sendResponse callback alive
//     }
// });
