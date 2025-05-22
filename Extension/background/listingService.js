import API from './API.js';
import tabCommunication from './tabCommunication.js';
import StorageService from './storageService.js';
import { ElementNotFoundError } from './customErrors.js';

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

let currentListingService;

async function createListingService(request) {
    /*
    request:
        {
            action: 'listProduct',
            id: 
        }
    */
    currentListingService = new ListingService();
    try{
        console.log('[createListingService] Started with request:', request);
        let prodToList;
        if(request.productData){
            prodToList = request.productData;
            await StorageService.addProductToArray(prodToList);
        }else{
            if(request.id === undefined){
                prodToList = await StorageService.getLatestProduct();
            }else{
                prodToList = await StorageService.getProductById(request.id);
            }
        }


        if(request.price){
            prodToList.price = request.price;
        }

        //uploader settings handling
        const uploader_settings = await API.get('/uploader-settings');

        prodToList.add_border_to_main_image = !!uploader_settings.add_border_to_main_image;
        prodToList.duplicate_max_photos = !!uploader_settings.duplicate_max_photos;
        //limit images to 24:
        if(prodToList.images.length > 24){
            prodToList.images = prodToList.images.slice(0,24);
        }
        // if(uploader_settings.duplicate_max_photos){
            //duplicate images to 24 if less:
        if(prodToList.duplicate_max_photos){
            console.log('[createListingService] duplicate_max_photos set to true');

            if(prodToList.images.length < 24){
                const diff = 24 - prodToList.images.length;
                for(let i = 0; i < diff; i++){
                    prodToList.images.push(prodToList.images[i]);
                }
            }
        }

        if(uploader_settings.fixed_item_specifics == true){
            console.log('[createListingService] fixed_item_specifcs set to true');
            const uploaderSpecsObj = uploader_settings.item_specifics.reduce((acc, item) => {
                const key = Object.keys(item)[0];
                acc[key] = item[key];
                return acc;
            }, {});

            // console.log('[createListingService] specifics from db:', uploader_settings.item_specifics);
            prodToList.specifics = {...prodToList.specifications, ...uploaderSpecsObj};

        }
        else{
            console.log('[createListingService] fixed_item_specifcs set to false');
            prodToList.specifics = {...prodToList.specifications}
        }

        // console.log('[createListingService] Uploader settings:', uploader_settings);

        //template handling:
        const {template_settings:template} = await API.get('/template/selected-template');
        if(template && template.html_code){
            
            for (let i = 0; i < prodToList.descriptionImages.length; i++) {
                const imgUrl = prodToList.descriptionImages[i];
                console.log("inserting img url", imgUrl, i+1);
                template.html_code = template.html_code.replace(`[Vendra Image ${i+1}]`, imgUrl);
            }
            
            template.html_code = template.html_code.replace('[Vendra Title]', prodToList.title);
            template.html_code = template.html_code.replace('[Vendra Description]', prodToList.description);

            console.log('[createListingService] Template:', template);
            prodToList.template = template.html_code;

            
            // const {}
            console.log('[createListingService] Product to list:', prodToList);
        }
        //item location

        prodToList.itemLocation = uploader_settings.item_location;
        await currentListingService.startListingProcess(prodToList);
        console.log("[createListingService] Listing finished successfully.");
        currentListingService = undefined;
        return {success:true, data:prodToList};
    }
    catch(error){
        console.error('[createListingService] Error:', error);
        currentListingService = undefined;
        throw error;
        
    }
    
};

class ListingService{
    
    /*
    productData:{
       
        }
            */

    constructor() {
        this.listingTabId = null;
        this.productData = null;
        this.lastActionSucceeded = true; // Flag to track if previous action succeeded
        this.nextWaitReload = false;
        
        this.actions = [
            {func: this.clickListButton, name: 'clickListButton', type: "required"},
            {func: this.fillTitle, name: 'fillTitle', type: "required"},
            {func: this.similarProducts, name: 'similarProducts', type: "optional"},
            {func: this.selectCategory, name: 'selectCategory', type: "optional"},
            {func: this.selectConditionnew, name: 'selectConditionnew', type: "optional"},
            {func: this.selectCondition, name: 'selectCondition', type: "optional"},
            {func: this.fillImages, name: 'fillImages', type: "required"},
            {func: this.setPricing, name:'setPricing', type:'optional'},
            {func: this.fillItemSpecifics, name: 'fillItemSpecifics', type: "optional"},
            {func: this.setTemplate, name: 'setTemplate', type: "optional"},
            {func: this.promotedListing, name: 'promotedListing', type: "optional"},
            {func: this.fillShipping, name: 'fillShipping', type: "optional"},
            {func: this.endListing, name: 'endListing', type: "required"},  
        ];
    }

    async waitForReloadIfNeeded() {
        if (this.nextWaitReload) {
            console.log('[ListingService] Waiting for page reload...');
            await tabCommunication.waitForReload();
        } else {
            console.log('[ListingService] Skipping reload wait due to previous action failure');
        }
    }

    async startListingProcess(productData) {
        // console.log('[ListingService] Started with product data:', productData);
        
        const newTab = await chrome.tabs.create({
            url: 'https://ebay.com/sh/lst/active',
            active: true,
        });
        console.log("New updated version running")
        console.log('[ListingService] New tab created with ID:', newTab.id);
        this.listingTabId = newTab.id;
        await tabCommunication.waitForReload();
        // this.lastActionSucceeded = true; // Initialize flag

        for (const action of this.actions) {
            try {
                // Wait for reload before each action (if needed)
                await this.waitForReloadIfNeeded();
                
                const result = await action.func.call(this, productData);
                if(result===undefined){
                    console.error(`ListingService] Action ${action.name} failed unexpected error`)
                    throw ""
                }
                if (!result?.success) {
                    // this.lastActionSucceeded = false;
                    // throw error;
                    console.error(`[ListingService] Action ${action.name} failed:`, result.error);
                    throw new Error(`Action ${action.name} failed: ${result.error}`);
                }
                
                // this.lastActionSucceeded = true;
                console.log(`[ListingService] Action ${action.name} executed successfully.`);
            }
            catch (error) {
                // this.lastActionSucceeded = false;
                
                if (error instanceof ElementNotFoundError) {
                    if (action.type === "required") {
                        throw new Error(`Required element not found in ${action.name}: ${error.message}`);
                    }
                    console.log(`[ListingService] Skipping optional action ${action.name} due to missing element: ${error.message}`);
                    continue;
                }
                console.error('[ListingService] Error:', error);
                throw error;
            }
        }
    }

    // async clickListButton(productData){
    //     this.nextWaitReload = false;
    //     console.log('[ListingService] Clicking list button:', productData.title);
    //     const response = await tabCommunication.sendMessage(this.listingTabId, {
    //         action: 'clickElement',
    //         selector: '#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a',
    //     });
        
    //     // const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
    //     //     action: 'clickElement',
    //     //     selector: '#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a',
    //     // });
    //     if(!response.success){
    //         return response;
    //     }
    //     this.nextWaitReload = true;

    //     console.log('[ListingService] List button clicked successfully:', response);
    //     return { success: true };
    // }

    async clickListButton(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Clicking list button:', productData.title);
        console.log("New updated version running")
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'clickElement',
            selector: '#listings-content-target > div.fl-title-bar > div.fl-title-bar__section2 > div:nth-child(2) > div > a',
        });
        
        // const response = await tabCommunication.sendMessageRetries(this.listingTabId, {
        //     action: 'clickElement',
        //     selector: '#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a',
        // });
        if(!response.success){
            return response;
        }
        this.nextWaitReload = true;

        console.log('[ListingService] List button clicked successfully:', response);
        return { success: true };
    }
    
    // async fillTitle(productData){
    //     this.nextWaitReload = false;
    //     console.log('[ListingService] Filling title:', productData.title);
    //     console.log('[ListingService] Sending message to tab ID:', this.listingTabId);
    //     const response = await tabCommunication.sendMessage(this.listingTabId, {
    //         action: 'fillValue',
    //         // #s0-1-1-24-7-\\@keyword-\\@box-\\@input-textbox
    //         selector:'#s0-1-1-19-7-\@keyword-\@keywords-search-box-\@keywords-box-\@input-textbox',
    //         value: productData.title,
    //     });
    //     if(!response.success){
    //         return response;
    //     }
    //     console.log('[ListingService] Title filled successfully:', response);
    //     const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
    //         action: 'clickElement',
    //         // #mainContent > div > div > div.keyword-suggestion > button
    //         selector:'#mainContent > div > div > div.keyword-suggestion > button',
    //     });
    //     if(!responseClick.success){
    //         return responseClick;
    //     }
    //     console.log('[ListingService] Clicked on suggested title:', responseClick);
    //     this.nextWaitReload = true;
    //     return { success: true };
    // }

    // async similarProducts(productData){
    //     this.nextWaitReload = false;
    //     console.log('[ListingService] Looking for similar products..')
    //     const response = await tabCommunication.sendMessage(this.listingTabId, {
    //         action: 'clickElementText',
    //         text: 'Continue without match'
    //     });
    //     if(!response.success){
    //         return response;
    //     }
    //     console.log('[ListingService] Clicked on continue without match:', response);
    //     // this.nextWaitReload = true;
    //     return { success: true };
    // }

   // In ListingService.js - fillTitle method
async fillTitle(productData) {
    this.nextWaitReload = false; // Keep this if still relevant for the overall step
    console.log('[ListingService] Instructing content script to fill title:', productData.title);

    // Send a single message with a selectorKey
    const fillResponse = await tabCommunication.sendMessage(this.listingTabId, {
        action: 'fillValue', // Or a more specific action like 'fillElementByKey'
        selectorKey: 'TITLE_INPUT_SELECTORS', // Key from EbayLister.js's SELECTORS
        value: productData.title,
        // You can also pass parameters for waitAndFindElement if needed, e.g.,
        // timeout: 7000,
        // checkVisible: true,
    });

    if (!fillResponse.success) {
        console.error('[ListingService] Failed to fill title via content script:', fillResponse.error);
        throw new Error(`Action fillTitle (via content script) failed: ${fillResponse.error}`);
    }

    console.log('[ListingService] Title fill instruction sent. Now attempting to click suggestion button.');

    // Click suggestion button (can also use a selectorKey)
    const clickSuggestionResponse = await tabCommunication.sendMessage(this.listingTabId, {
        action: 'clickElement', // Uses EbayLister's clickElement
        selectorKey: 'TITLE_SUGGESTION_BUTTON', // Key from EbayLister.js's SELECTORS
        // Alternatively, could be a textKey if TITLE_SUGGESTION_BUTTON is text-based
        // action: 'clickElementText',
        // textKey: 'SOME_TEXT_KEY_FOR_SUGGESTION_BUTTON'
        timeout: 2000, // Optional: override default timeout in EbayLister
        // retries: 2    // Optional: override default retries
    });

    if (clickSuggestionResponse.success) {
        console.log('[ListingService] Clicked suggested title button successfully.');
        this.nextWaitReload = true;
    } else {
        // If TITLE_SUGGESTION_BUTTON fails, try CONTINUE_WITHOUT_MATCH_TEXT as a fallback
        console.warn('[ListingService] Failed to click suggestion button, trying "Continue without match".');
        const continueResponse = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'clickElementText',
            textKey: 'CONTINUE_WITHOUT_MATCH_TEXT',
        });
        if (!continueResponse.success) {
             console.error('[ListingService] Failed to click "Continue without match":', continueResponse.error);
             // Decide if this is a critical failure
        } else {
            this.nextWaitReload = false; // Or true, depending on page flow after this click
        }
    }
    return { success: true };
}


async similarProducts(productData) {
    this.nextWaitReload = false;
    console.log('[ListingService] Instructing content script to click the continue button for similar products...');

    const response = await tabCommunication.sendMessage(this.listingTabId, {
        action: 'clickElement', // Changed from 'clickElementText'
        selectorKey: 'SIMILAR_PRODUCTS_CONTINUE_BUTTON', // Use the new selectorKey
        // Optional: Pass timeout or retries if you want to override defaults in EbayLister.js
        // waitFor: 3000, // Example: if this button takes time to appear
        // retries: 2
    });

    if (!response.success) {
        console.error('[ListingService] ❌ Could not click "Continue" button for similar products using selectorKey:', response.error ? response.error.toString() : 'Unknown error');
        // You might want to add a fallback to the text-based click if this selector fails,
        // or if the selector is not always present but the text "Continue without match" is.
        // Example Fallback:
        // console.log('[ListingService] Trying fallback: clicking "Continue without match" by text.');
        // const fallbackResponse = await tabCommunication.sendMessage(this.listingTabId, {
        //     action: 'clickElementText',
        //     textKey: 'CONTINUE_WITHOUT_MATCH_TEXT',
        //     waitFor: 1000,
        // });
        // if (!fallbackResponse.success) {
        //     console.error('[ListingService] ❌ Fallback text-based click also failed:', fallbackResponse.error);
        //     return fallbackResponse; // Or return the original failed response
        // }
        // console.log('[ListingService] ✅ Fallback text-based click successful.');
        // this.nextWaitReload = true; // if navigation happens
        // return { success: true };
        return response; // Return the original failed response for now
    }

    console.log('[ListingService] ✅ "Continue" button for similar products instruction processed successfully by content script using selector.');
    // Determine if a page reload/navigation is expected after this action.
    // If clicking this button reliably loads a new page or a significantly different section:
    // this.nextWaitReload = true; 
    return { success: true };
}


            // Function to click the "New without tags" button
            //  async selectConditionnew() {
            //     const observer = new MutationObserver((mutations) => {
            //         for (const mutation of mutations) {
            //             if (mutation.type === 'childList' || mutation.type === 'subtree') {
            //                 console.log('Mutation detected:', mutation);
            //                 const buttons = document.querySelectorAll('.condition-button-list__item .condition-button');
            //                 buttons.forEach(button => {
            //                     if (button.querySelector('.bold-text').textContent.trim() === 'New without tags') {
            //                         button.click();
            //                         console.log('Clicked on "New without tags" button');
            //                         observer.disconnect(); // Stop observing after the button is clicked
            //                         this.clickContinueButton();
            //                         console.log('Clicked on "Continue" button');
            //                     }
            //                 });
            //             }
            //         }
            //     });
        
            //     observer.observe(document.body, { childList: true, subtree: true });
        
            //     // Optionally, you can add a timeout to stop observing after a certain period
            //     setTimeout(() => {
            //         observer.disconnect();
            //     }, 10000); // Stop observing after 10 seconds
        
            //     return { true: true };
            // }
        
            //  clickContinueButton() {
            //     const continueButton = document.querySelector('.prelist-radix__next-container .btn--primary');
            //     if (continueButton) {
            //         continueButton.click();
            //     }
            //     return { true: true };
            // }
    async selectConditionnew(productData) {
    this.nextWaitReload = false;
    console.log('[ListingService] Instructing content script to handle "new" condition selection page...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Short delay

    const response = await tabCommunication.sendMessage(this.listingTabId, {
        action: 'handleConditionSelectionNew',
    });

    if (!response.success) {
        if (response.skipped) {
            console.log(`[ListingService] 'handleConditionSelectionNew' was skipped by content script: ${response.message}. This is acceptable.`);
            return { success: true };
        } else {
            console.warn(`[ListingService] Content script reported an issue with 'handleConditionSelectionNew': ${response.error || response.message}. Treating as optional and proceeding.`);
            // If this step becomes truly critical, you might want to throw an error here based on response.error
            // For now, let's assume it's optional if it reaches this point without throwing in EbayLister.
            return { success: true, warning: response.error || response.message };
        }
    }

    console.log(`[ListingService] 'handleConditionSelectionNew' action processed: ${response.message}`);
    if (!response.skipped) {
        this.nextWaitReload = true;
    }
    return { success: true };
}
        
    async selectCondition(productData){
        this.nextWaitReload = false;
        console.log("[ListingService] Looking for new condition popup..")
        // await new Promise(resolve => setTimeout(resolve, 8000));
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'detectElement',
            selector:'.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active'
        })
        if(!response.success){
            console.log("[ListingService] Condition popup not found. Continuing..")
            return response;
        }
        console.log("[ListingService] Condition popup found. Selecting condition..")

        const respOptionSelect = await tabCommunication.sendMessage(this.listingTabId, {
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
        // const responseClick = await tabCommunication.sendMessageRetries(this.listingTabId, {
        //     action :'clickElement',
        //     selector:'#mainContent > div > div > div.prelist-radix__body-container > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.condition-dialog-non-block-radix__continue > button'
        // })
        const responseClick = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'clickElementText',
            text:'Continue to listing'
        })
        if(!responseClick.success){
            return responseClick;
        }
        console.log("[ListingService] Clicked on continue button.")
        this.nextWaitReload = true;
        return { success: true };
    }
  
    async selectCategory(productData){
        this.nextWaitReload = false;
        console.log("[ListingService] Looking for category popup:")
        const response = await tabCommunication.sendMessage(this.listingTabId, {
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
        return { success: true };
    }
    
    async fillImages(productData){
        //wont navigate away from page
        this.nextWaitReload = false;

        console.log('[ListingService] Filling images:', productData.images);
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'uploadImages',
            selector:'#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__photos.summary__photos-image-guidance.summary__photos--photo-framework > div:nth-child(2) > div > div.uploader-ui.empty > div:nth-child(1) > div.uploader-thumbnails-ux.uploader-thumbnails-ux--inline.uploader-thumbnails-ux--inline-edit > div',
            images: productData.images,
            addBorder: productData.add_border_to_main_image,
        });
        if(!response.success){
            return response;
        }
        console.log('[ListingService] Images filled successfully:', response);
        // this.nextWaitReload = true;
        return { success: true };
    }

    async fillItemSpecifics(productData){
        //wont navigate away from page
        this.nextWaitReload = false;
        console.log('[ListingService] Filling item specifics:', productData.specifics);
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'fillSpecifics',
            specifics: productData.specifics,
            // selector:'#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__details
        });
        if(!response.success){
            return response;
        }

        return {success:true};
    }

    async setTemplate(productData){
        this.nextWaitReload = false;
        if(!productData.template){
            return {success:true};
        }
        console.log('[ListingService] Setting template:', productData.template);
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'setTemplate',
            template: productData.template
        });
        if(!response.success){
            return response;
        }
        return {success:true};
    }

    async setPricing(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Setting price:', productData.price);
        //buy it now option
        const buyItNowClick = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'selectDropdownOption',
            selector: '.listbox-button',
            optionText: 'Buy It Now'
        });
        if(!buyItNowClick.success){
            return buyItNowClick;
        }
        
        const fillPricing = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'fillPricing',
            price: productData.price,
            quantity: 1,
        });
        if(!fillPricing.success){
            return fillPricing;
        }

        return {success:true};
    }

    async promotedListing(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Setting promoted listing..')
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'setPromotedListing',
            adRate: 15
        });
        if(!response.success){
            return response;
        }
        return {success:true};
    }

    async fillShipping(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Setting shipping..')
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'fillShipping',
            city: productData.itemLocation.city,
            region: productData.itemLocation.region
        });
        if(!response.success){
            return response;
        }
        return {success:true};
    }

    async endListing(productData){
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'listingComplete'
        })
        if(!response.success){
            return response;
        }
        return { success: true };
    }
}

export {saveProductService, createListingService, currentListingService };
