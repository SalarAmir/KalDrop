console.log("Background script initialized");
const frontendDomain = "localhost";
const authCookieName = "noar.auth";

const initAuth = async () => {
    // supabase= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
    const cookies = await chrome.cookies.getAll({
        name:authCookieName,
        domain:frontendDomain
    });
    if(cookies.length === 0){
        console.log('[initAuth] No auth cookie found.');
        return;
    }
    
    //convert to json obj:
    const authObj = JSON.parse(decodeURIComponent(cookies[0].value));
    // const authObj = decodeURIComponent(cookies[0].value);
    const authToken = authObj.access_token;

    console.log('[initAuth] Logged in user found:',authObj.user.email);
    StorageService.set('auth_token', authToken);
};
initAuth();
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

    static remove(key) {
        console.log(`[StorageService.remove] Removing key: ${key}`);
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, function () {
                console.log(`[StorageService.remove] Successfully removed ${key}`);
                resolve();
            });
        });
    }

    static async addProductToArray(product) {
        const products = await this.get('extractedProducts') || [];
        const isDuplicate = products.some(p => p.title === product.title);
        
        if (!isDuplicate) {
            products.push(product);
            await this.set('extractedProducts', products);
            await this.set('lastExtractedProduct', product);
            return true;
        }
        return false;
    }

    static async getLatestProduct() {
        return await this.get('lastExtractedProduct');
    }
}

class API {
	static serverUrl = process.env.SERVER_URL;
	// static serverUrl = 'http://localhost:5000/api/v1';
    static async createHeaders() {
        const token = await StorageService.get('auth_token');
        if (!token) {
            console.error('No token found.');
            throw new Error('No token found.');
            // return;
        }
        const headers =  {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
        console.log('[API.createHeaders] Headers:', headers);
        return headers;
    }

    static async handleResponse(response) {
        if (!response.ok) {
            const data = await response.json();
            if(data.statusCode === 401){
                console.error('Unauthorized. Clearing auth token.');
                await StorageService.remove('auth_token');
            }
            console.error('API Error:', data);
            throw new Error(data.error);
        }
        return response.json();
    }

	static async get(url) {
		try {
			const completeUrl = `${API.serverUrl}${url}`;

			const response = await fetch(completeUrl, {
				method: 'GET',
				headers: this.createHeaders(),
			});
			const data = await this.handleResponse(response);

			// if(!data.success){
			// 	console.error("GET", completeUrl, "Error:", data.error);
			// 	throw new Error(data.error);
			// }

			console.log(
				"GET",
				completeUrl,
				"Response:",
				data
			)

			return data;
		} catch (err) {
			console.error(err);
		}
	}

	static async post(url, body) {
		try {
            
			const completeUrl = `${this.serverUrl}${url}`;
            console.log("POST", completeUrl, "Body:", JSON.stringify(body));
			const response = await fetch(completeUrl, {
				method: 'POST',
				headers: await this.createHeaders(),
				body: JSON.stringify(body),
			});
            const data = await this.handleResponse(response);

			console.log(
				"POST",
				completeUrl,
				"Response:",
				data
			)

			return data;
		} catch (err) {
			console.error(err);
            throw err;
		}
	}
}

async function extractProductService(request) {
    try {
        console.log('[extractProductService] Started with request:', request);
        const wasAdded = await StorageService.addProductToArray(request.data);
        console.log('[extractProductService] ', wasAdded?'new product added':'duplicate product skipped');
		const lastProd = await StorageService.getLatestProduct();
		console.log("[extractProductService] in local: ",lastProd);

        return {success:true, data:request.data};
    } catch (error) {
        console.error('[extractProductService] Error:', error);
        return {success:false, error:error.toString()};
    }
}

async function saveProductService(request) {
    try {
        /*
        request:
        {
            action: 'saveProduct',
            index: 0
        }
        */
        console.log('[saveProductService] Started with request:', request);
        const product = (await StorageService.get('extractedProducts'))[request.index];
        console.log('[saveProductService] Product to save:', product);
        const response = await API.post('/products', product);
        console.log('[saveProductService] Product saved successfully:', response);
        return {success:true, data:product};
    }
    catch(error){
        console.error('[saveProductService] Error:', error);
        throw error;
    }
};


async function createListingService(request) {
    /*
    request:{
        action: 'listProduct',
        index: 0
        }
        */
       const currentListingService = new ListingService();
       try{
           
           console.log('[createListingService] Started with request:', request);
           let prodToList;
           if(request.index === undefined){
               prodToList = await StorageService.getLatestProduct();
            }else{
                prodToList = (await StorageService.get('extractedProducts'))[request.index];
            }
            await currentListingService.startListingProcess(prodToList);
        console.log("[createListingService] Listing finished successfully.");
        return {success:true, data:prodToList};
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

    constructor() {
        this.processing = false;
        this.listingTabId = null;
        this.productData = null;

        // Define required and optional actions separately
        // this.requiredActions = [
        //     { func: this.clickListButton, name: 'clickListButton' },
        //     { func: this.fillTitle, name: 'fillTitle' },
        //     { func: this.fillImages, name: 'fillImages' },
        // ];

        // this.optionalActions = [
        //     { func: this.selectCategory, name: 'selectCategory' },
        //     { func: this.selectCondition, name: 'selectCondition' },
        // ];

        this.actions = [
            {func:this.clickListButton, name:'clickListButton', type:"required"},
            {func:this.fillTitle, name:'fillTitle', type:"required"},
            {func:this.selectCategory, name:'selectCategory', type:"optional"},
            {func:this.selectCondition, name:'selectCondition', type:"optional"},
            {func:this.fillImages, name:'fillImages', type:"required"},
        ];
    }

    async startListingProcess(productData) {
        if (this.processing) {
            console.log('[ListingService] A listing process is already running. Ignoring this request.');
            return;
        }
        this.processing = true;

        console.log('[ListingService] Started with product data:', productData);
        try {
            const newTab = await chrome.tabs.create({
                url: 'https://www.ebay.com/sell/create',
                active: true,
            });
            console.log('[ListingService] New tab created with ID:', newTab.id);
            this.listingTabId = newTab.id;

            for(const action of this.actions){
                if(action.type === "required"){
                    console.log(`[ListingService] Executing required action: ${action.name}`);
                    const result = await action.func.call(this, productData);
                    if (!result.success) {
                        if (result.error instanceof ElementNotFoundError) {
                            throw new Error(`Required element not found in ${action.name}: ${result.error.message}`);
                        }
                        throw result.error;
                    }
                }
                else if(action.type === "optional"){
                    console.log(`[ListingService] Executing optional action: ${action.name}`);
                    const result = await action.func.call(this, productData);
                    if (!result.success) {
                        if (result.error instanceof ElementNotFoundError) {
                            console.log(`[ListingService] Skipping optional action ${action.name} due to missing element: ${result.error.message}`);
                            continue;
                        }
                        throw result.error;
                    }
                }
            }

            // Execute required actions
            // for (const action of this.requiredActions) {
            //     console.log(`[ListingService] Executing required action: ${action.name}`);
            //     const result = await action.func.call(this, productData);
            //     if (!result.success) {
            //         if (result.error instanceof ElementNotFoundError) {
            //             throw new Error(`Required element not found in ${action.name}: ${result.error.message}`);
            //         }
            //         throw result.error;
            //     }
            // }

            // // Execute optional actions
            // for (const action of this.optionalActions) {
            //     console.log(`[ListingService] Executing optional action: ${action.name}`);
            //     const result = await action.func.call(this, productData);
            //     if (!result.success) {
            //         if (result.error instanceof ElementNotFoundError) {
            //             console.log(`[ListingService] Skipping optional action ${action.name} due to missing element: ${result.error.message}`);
            //             continue;
            //         }
            //         throw result.error;
            //     }
            // }
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
        });
        if(!response.success){
            return response;
        }

        console.log('[ListingService] List button clicked successfully:', response);
        return { success: true };
    }
    
    async fillTitle(productData){
        console.log('[ListingService] Filling title:', productData.title);
        console.log('[ListingService] Sending message to tab ID:', this.listingTabId);
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'fillValue',
            selector:'#s0-1-1-24-7-\\@keyword-\\@box-\\@input-textbox',
            value: productData.title,
        });
        if(!response.success){
            return response;
        }
        console.log('[ListingService] Title filled successfully:', response);
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'clickElement',
            selector:'#mainContent > div > div > div.keyword-suggestion > button',
        });
        if(!responseClick.success){
            return responseClick;
        }
        console.log('[ListingService] Clicked on suggested title:', responseClick);
        return { success: true };
    }
    
    async selectCategory(productData){
        console.log("[ListingService] Looking for category popup:")
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'detectElement',
            selector: '#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker',
        })
        if(!response.success){
            // console.log("[ListingService] Category popup not found. Continuing..")
            return response;
        }
        console.log("[ListingService] Category popup found. Selecting category..")
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker > div > div.se-panel-container__body > div > div.se-panel-section.category-picker__suggested-section > div:nth-child(2) > button > span > span > span'
        })
        if(!responseClick.success){
            return responseClick;
        }
        console.log("[ListingService] Category selected successfully.")
        console.log("[ListingService] Clicking without match button.");
        const responseClickWithoutMatch = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__next-container > button'
        })
        if(!responseClickWithoutMatch.success){
            return responseClickWithoutMatch;
        }
        console.log("[ListingService] Clicked without match button.")
        return { success: true };
    }
    
    async selectCondition(productData){
        console.log("[ListingService] Looking for condition popup..")
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'detectElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active'
        })
        if(!response.success){
            console.log("[ListingService] Condition popup not found. Continuing..")
            return response;
        }

        console.log("[ListingService] Condition popup found. Selecting condition..")
        const respOptionSelect = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'selectOption',
            selector:'.condition-picker-radix__radio-group',
            text: 'New with box',
            index: 0
        })
        if(!respOptionSelect.success){
            return respOptionSelect;
        }
        console.log("[ListingService] Condition selected successfully.")
        //continue listing button:
        const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action :'clickElement',
            selector:'#mainContent > div > div > div.prelist-radix__body-container > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.condition-dialog-non-block-radix__continue > button'
        })
        if(!responseClick.success){
            return responseClick;
        }
        console.log("[ListingService] Clicked on continue button.")
        return { success: true };
    }
    
    async fillImages(productData){
        console.log('[ListingService] Filling images:', productData.images);
        const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
            action: 'uploadImages',
            selector:'#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__photos.summary__photos-image-guidance.summary__photos--photo-framework > div:nth-child(2) > div > div.uploader-ui.empty > div:nth-child(1) > div.uploader-thumbnails-ux.uploader-thumbnails-ux--inline.uploader-thumbnails-ux--inline-edit > div',
            images: productData.images,
        });
        if(!response.success){
            return response;
        }
        console.log('[ListingService] Images filled successfully:', response);
        return { success: true };
    }
}

class ContentScriptError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContentScriptError';
    }
}

class ElementNotFoundError extends Error {
    constructor(selector) {
        super(`Element not found: ${selector}`);
        this.name = 'ElementNotFoundError';
        this.selector = selector;
    }
}

// Communication services:
class tabCommunication {
    static async sendMessage(tabId, message) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, message);
            if (!response) {
                throw new ContentScriptError('No response from content script');
            }
            if (!response.success) {
                if (response.error && response.error.includes('Element not found')) {
                    throw new ElementNotFoundError(message.selector);
                }
                throw new Error(response.error || 'Content script failed to process message');
            }
            return response;
        } catch (error) {
            if (error.message.includes('Receiving end does not exist')) {
                throw new ContentScriptError('Content script not loaded');
            }
            throw error; // Re-throw other errors
        }
    }

    static async sendMessageRetries(tabId, message, maxRetries = 5, retryDelay = 2000) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.sendMessage(tabId, message);
            } catch (error) {
                const isLastAttempt = attempt >= maxRetries;
                const errorType = error instanceof ContentScriptError ? 'Content Script Error' :
                                error instanceof ElementNotFoundError ? 'Element Not Found' :
                                'Unknown Error';
                
                console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed - ${errorType}:`, error.message);

                if (isLastAttempt) {
                    return { success: false, error: error };
                }

                // Only retry for if not element not found error
                if (error instanceof ElementNotFoundError) {
                    return { success: false, error: error };
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
    'saveProduct': saveProductService,
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


chrome.cookies.onChanged.addListener(async (changeInfo) => {
    if(changeInfo.cookie.domain !== frontendDomain) return;
    if(changeInfo.cookie.name !== authCookieName) return;
    
    if(changeInfo.removed){
        console.log('[onCookieChanged] Auth cookie removed. Clearing local storage.');
        await StorageService.remove('auth_token');
        return;
    }

    const cookieToken = JSON.parse(decodeURIComponent(changeInfo.cookie.value)).access_token;
    const currentToken = await StorageService.get('auth_token');
    // const umm = await supabase.auth.getUser(cookieToken);
    if(!currentToken){
        console.log('[onCookieChanged] No current token found. Setting local storage.');
        await StorageService.set('auth_token', cookieToken);
    }
    if(currentToken !== cookieToken){
        console.log('[onCookieChanged] Token changed. Updating local storage.');
        await StorageService.set('auth_token', cookieToken);
    }
});