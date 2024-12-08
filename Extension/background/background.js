console.log("Background script initialized");

let isProcessing=false

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

// Communication services
async function extractProductService(request) {
    try {
        console.log('[extractProductService] Started with request:', request);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('[extractProductService] Active tab query result:', tab);

        if (!tab) {
            throw new Error('No active tab found');
        }

        console.log('[extractProductService] Sending message to tab ID:', tab.id);
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
        console.log('[extractProductService] Response from content script:', response);

        if (!response.success) {
            throw new Error(response.error || 'Failed to extract product');
        }

        console.log('[extractProductService] Storing extracted product data:', response.data);
        await StorageService.set('lastExtractedProduct', response.data);
        console.log('[extractProductService] Product data saved successfully.');

        return response.data;
    } catch (error) {
        console.error('[extractProductService] Error:', error);
        throw error;
    }
}
async function createListingService(request) {
    if (isProcessing) {
        console.log('[createListingService] A listing process is already running. Ignoring this request.');
        return;
    }

    isProcessing = true; // Set flag to indicate processing has started
    console.log('[createListingService] Started with request:', request);

    try {
        let productData = request.productData;
        console.log('[createListingService] Product data from request:', productData);

        if (!productData) {
            console.log('[createListingService] No product data in request. Attempting to retrieve from storage...');
            productData = await StorageService.get('lastExtractedProduct');
            console.log('[createListingService] Retrieved product data from storage:', productData);

            if (!productData) {
                throw new Error('No product data available for listing');
            }
        }

        const [existingTab] = await chrome.tabs.query({
            url: 'https://www.ebay.com/sell/create*',
        });
        console.log('[createListingService] Tab query result for eBay listing page:', existingTab);

        let tabId;
        if (!existingTab) {
            console.log('[createListingService] eBay listing page not open, creating a new tab...');
            const newTab = await chrome.tabs.create({
                url: 'https://www.ebay.com/sell/create',
                active: true,
            });
            tabId = newTab.id;

            console.log('[createListingService] New tab created with ID:', tabId);

            // Wait for the new tab to load
            await waitForTabLoad(tabId);
            console.log('[createListingService] New tab has fully loaded.');
        } else {
            console.log('[createListingService] Using existing tab with ID:', existingTab.id);
            tabId = existingTab.id;
        }

        // Send product data to the tab
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'listProduct',
            productData: productData,
        });
        console.log('[createListingService] Response from content script:', response);

        if (!response.success) {
            throw new Error(response.error || 'Failed to create eBay listing');
        }

        return response.data;
    } catch (error) {
        console.error('[createListingService] Error:', error);
        throw error;
    } finally {
        isProcessing = false; // Reset flag when processing is complete
    }
}

// Utility to wait for a tab to load
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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'debugStorage') {
        chrome.storage.local.get('lastExtractedProduct', (result) => {
            console.log('[Debug] Stored product data:', result.lastExtractedProduct);
            sendResponse({ data: result.lastExtractedProduct });
        });
        return true; // To keep the sendResponse callback alive
    }
});
