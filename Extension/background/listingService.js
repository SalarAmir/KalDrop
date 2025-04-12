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

        //limit images to 24:
        if(prodToList.images.length > 24){
            prodToList.images = prodToList.images.slice(0,24);
        }
        // if(uploader_settings.duplicate_max_photos){
            //duplicate images to 24 if less:
        if(prodToList.images.length < 24){
            const diff = 24 - prodToList.images.length;
            for(let i = 0; i < diff; i++){
                prodToList.images.push(prodToList.images[i]);
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
            url: 'https://www.ebay.com/sell/create',
            active: true,
        });
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

    async clickListButton(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Clicking list button:', productData.title);
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'clickElement',
            selector: '#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a',
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
    
    async fillTitle(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Filling title:', productData.title);
        console.log('[ListingService] Sending message to tab ID:', this.listingTabId);
        const response = await tabCommunication.sendMessage(this.listingTabId, {
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
        this.nextWaitReload = true;
        return { success: true };
    }

    async similarProducts(productData){
        this.nextWaitReload = false;
        console.log('[ListingService] Looking for similar products..')
        const response = await tabCommunication.sendMessage(this.listingTabId, {
            action: 'clickElementText',
            text: 'Continue without match'
        });
        if(!response.success){
            return response;
        }
        console.log('[ListingService] Clicked on continue without match:', response);
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
        console.log('[ListingService] Checking for condition selection page...');
        
        try {
            // Allow page to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try multiple selectors to detect the condition page
            const pageSelectors = [
                '.prelist-radix__body-container.prelist-radix__condition-grading',
                '.condition-button-list',
                '.condition-picker-radix',
                'button:contains("New without tags")',
                'div[data-testid="condition-selector"]'
            ];
            
            let pageFound = false;
            for (const selector of pageSelectors) {
                console.log(`[ListingService] Trying to detect condition page with selector: ${selector}`);
                const check = await tabCommunication.sendMessage(this.listingTabId, {
                    action: 'detectElement',
                    selector: selector,
                    timeout: 1000 // Short timeout for each attempt
                });
                
                if (check.success) {
                    console.log(`[ListingService] Condition page detected with selector: ${selector}`);
                    pageFound = true;
                    break;
                }
            }
            
            if (!pageFound) {
                console.log('[ListingService] Condition selection page not found. Skipping...');
                return { success: true }; // Skip if not found
            }
            
            // Try multiple approaches to select condition
            console.log('[ListingService] Trying different methods to select "New without tags"');
            
            // Method 1: Direct click on button with text
            const directClick = await tabCommunication.sendMessage(this.listingTabId, {
                action: 'clickElementText',
                text: 'New without tags',
                timeout: 2000
            });
            
            if (!directClick.success) {
                console.log('[ListingService] Direct click failed, trying script method');
                
                // Method 2: Execute script to find and click based on text content
                const scriptClick = await tabCommunication.sendMessage(this.listingTabId, {
                    action: 'executeScript',
                    script: `
                        // Try multiple selector patterns
                        let found = false;
                        
                        // Try condition buttons
                        const buttons = document.querySelectorAll('button, .condition-button, [role="button"]');
                        for (const button of buttons) {
                            if (button.textContent && button.textContent.includes('New without tags')) {
                                console.log('Found button with text: New without tags');
                                button.click();
                                found = true;
                                break;
                            }
                        }
                        
                        // Try radio buttons or options
                        if (!found) {
                            const options = document.querySelectorAll('input[type="radio"], .radio-input');
                            for (const option of options) {
                                const label = option.closest('label') || 
                                                document.querySelector('label[for="' + option.id + '"]');
                                if (label && label.textContent.includes('New without tags')) {
                                    console.log('Found radio option: New without tags');
                                    option.click();
                                    found = true;
                                    break;
                                }
                            }
                        }
                        
                        return found;
                    `
                });
                
                if (!scriptClick.success || scriptClick.result === false) {
                    console.log('[ListingService] Failed to select "New without tags" condition');
                    
                    // Continue anyway as this might be optional
                    console.log('[ListingService] Continuing despite condition selection failure');
                    
                    // Try to continue without selecting condition
                    const skipClick = await tabCommunication.sendMessage(this.listingTabId, {
                        action: 'clickElementText',
                        text: 'Continue',
                        timeout: 2000
                    });
                    
                    if (skipClick.success) {
                        console.log('[ListingService] Clicked continue button without selecting condition');
                        this.nextWaitReload = true;
                        return { success: true };
                    }
                    
                    return { success: true }; // Continue anyway
                }
            }
            
            // Wait for selection to register
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try multiple continue button approaches
            const continueSelectors = [
                '.prelist-radix__next-container .btn--primary',
                'button:contains("Continue")',
                '.action-button',
                '.btn-continue',
                '.next-button'
            ];
            
            for (const selector of continueSelectors) {
                console.log(`[ListingService] Trying to click continue with selector: ${selector}`);
                const continueClick = await tabCommunication.sendMessage(this.listingTabId, {
                    action: 'clickElement',
                    selector: selector,
                    timeout: 1000
                });
                
                if (continueClick.success) {
                    console.log('[ListingService] Continue button clicked successfully');
                    this.nextWaitReload = true;
                    return { success: true };
                }
            }
            
            // Try text-based continue button as last resort
            const textContinue = await tabCommunication.sendMessage(this.listingTabId, {
                action: 'clickElementText',
                text: 'Continue',
                timeout: 2000
            });
            
            if (textContinue.success) {
                console.log('[ListingService] Text-based continue button clicked');
                this.nextWaitReload = true;
                return { success: true };
            }
            
            // If we get here, we found the condition page but couldn't proceed
            // This could be acceptable in some flows, so return success
            console.log('[ListingService] Condition selected but could not find continue button. Proceeding anyway.');
            this.nextWaitReload = true;
            return { success: true };
            
        } catch (error) {
            console.error('[ListingService] Error in selectConditionnew:', error);
            // Don't fail the entire listing process for this optional step
            return { success: true, warning: error.toString() };
        }
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