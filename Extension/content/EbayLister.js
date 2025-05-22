//automator v0.2
const SELECTORS = {
    // General Listing Flow
    LIST_NEW_ITEM_BUTTON: '#listings-content-target > div.fl-title-bar > div.fl-title-bar__section2 > div:nth-child(2) > div > a',
    TITLE_INPUT_SELECTORS: [ // Array of selectors for the title input
        'input[id*="title-field"]', // More generic title input
        '#s0-1-1-24-7-\\@keyword-\\@box-\\@input-textbox',
        '#s0-1-1-19-7-\\@keyword-\\@keywords-search-box-\\@keywords-box-\\@input-textbox',
        'input[id*="keyword"][id*="input-textbox"]',
        'input[data-testid*="search-box"]',
        'input[aria-label*="keyword" i]',
        'input[type="text"][name*="keyword"]',
        '.search-box-input input[type="text"]', // More specific search box input
        '#inpTitle', // Common ID for title
    ],
    TITLE_SUGGESTION_BUTTON_CONTAINER: '#mainContent > div > div > div.keyword-suggestion',
    TITLE_SUGGESTION_BUTTON: '#mainContent > div > div > div.keyword-suggestion > button',
    CONTINUE_WITHOUT_MATCH_TEXT: 'Continue without match',
     // --- START: New Selector Key ---
    SIMILAR_PRODUCTS_CONTINUE_BUTTON: '#mainContent > div > div > div.prelist-radix__next-container > button',
    // --- END: New Selector Key ---
    // Condition Selection (New Flow)
    CONDITION_PAGE_DETECTORS: [
        '.prelist-radix__body-container.prelist-radix__condition-grading',
        '.condition-button-list',
        '.condition-picker-radix',
        'div[data-testid="condition-selector"]'
        // 'button:contains("New without tags")' // This is more of a text search, handle separately
    ],
    CONDITION_NEW_WITHOUT_TAGS_BUTTON_SELECTOR: '#mainContent > div > div > div.prelist-radix__body-container.prelist-radix__condition-grading > div > div > div > div.condition-grading-type__content > ul > li:nth-child(2) > button',
    // Specific selector for the "Continue" button on this page
    CONDITION_CONTINUE_BUTTON_SELECTOR: '#mainContent > div > div > div.prelist-radix__next-container > button',
    // Specific selector for the "New without tags" text
    CONDITION_NEW_WITHOUT_TAGS_TEXT: 'New without tags',
    CONDITION_CONTINUE_BUTTON_TEXT: 'Continue',

    // Condition Selection (Old/Popup Flow)
    CONDITION_POPUP_SELECTOR: '.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active',
    CONDITION_PICKER_RADIO_GROUP: '.condition-picker-radix__radio-group',
    CONDITION_NEW_WITH_BOX_TEXT: 'New with box',
    CONTINUE_TO_LISTING_BUTTON_TEXT: 'Continue to listing',

    // Category Selection
    CATEGORY_POPUP_SELECTOR: '#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker',
    CATEGORY_SUGGESTED_ITEM: '#mainContent > div > div > div.prelist-radix__body-container > div.aspects-category-radix > div.category-picker-radix__sidepane > div > div > div.lightbox-dialog__window.lightbox-dialog__window--animate.keyboard-trap--active > div.lightbox-dialog__main > div > div > div.category-picker > div > div.se-panel-container__body > div > div.se-panel-section.category-picker__suggested-section > div:nth-child(2) > button',

    // Images
    IMAGES_UPLOAD_CONTAINER: '#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__photos.summary__photos-image-guidance.summary__photos--photo-framework > div:nth-child(2) > div > div.uploader-ui.empty > div:nth-child(1) > div.uploader-thumbnails-ux.uploader-thumbnails-ux--inline.uploader-thumbnails-ux--inline-edit > div',
    IMAGE_FILE_INPUT: 'input[type="file"]',

    // Item Specifics
    ITEM_SPECIFICS_VIEW_MORE_BUTTON: '#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__attributes > div.summary__attributes--container > button',
    ITEM_SPECIFICS_LABEL_CLASS: 'summary__attributes--label',
    ITEM_SPECIFICS_VALUE_CLASS: 'summary__attributes--value',
    ITEM_SPECIFICS_ADD_CUSTOM_TEXT: 'Add custom item specific',
    ITEM_SPECIFICS_CUSTOM_NAME_INPUT_SELECTORS: [ // Array for custom name input
        '#s0-0-0-24-8-11-0-0-dialog-11-2-7-2-0-17-8-custom-attribute-name-se-textbox', // Example, might be dynamic
        'input[name="customAttributeName"]',
        'input[data-testid="custom-attribute-name"]',
        '#custom-specific-name-input' // Generic fallback
    ],
    ITEM_SPECIFICS_CUSTOM_VALUE_INPUT_SELECTORS: [ // Array for custom value input
        '#s0-0-0-24-8-11-0-0-dialog-11-2-7-2-0-17-8-custom-attribute-value-se-textbox', // Example, might be dynamic
        'input[name="customAttributeValue"]',
        'input[data-testid="custom-attribute-value"]',
        '#custom-specific-value-input' // Generic fallback
    ],
    ITEM_SPECIFICS_SAVE_BUTTON_TEXT: 'Save',
    ITEM_SPECIFICS_SIZE_TYPE_LIST: 'ul[aria-label="Size Type"]',
    ITEM_SPECIFICS_REQUIRED_SECTION: ".summary__attributes--section-container",


    // Description Template
    TEMPLATE_SHOW_HTML_BUTTON: 'input[name="descriptionEditorMode"][value="html"]',
    TEMPLATE_HTML_INPUT_BOX_SELECTORS: [ // Array for HTML input box
        'textarea.se-rte__button-group-editor__html',
        '#wc0-w0-LIST_EDITOR_DESCRIPTION_EDITOR textarea', // A common pattern for rich text editors
        'textarea[data-testid="html-editor-textarea"]'
    ],

    // Pricing
    PRICING_FORMAT_DROPDOWN_BUTTON: '.listbox-button button[aria-haspopup="listbox"]',
    PRICING_BUY_IT_NOW_OPTION_TEXT: 'Buy It Now',
    PRICING_SEE_OPTIONS_BUTTON_TEXT: 'See pricing options',
    PRICING_PRICE_INPUT_SELECTORS: [ // Array for price input
        'input[name="price"]',
        'input[id*="priceBase"]',
        'input[data-testid="price-input"]',
        '#priceSugg', // Example
        '#binPrice'
    ],
    PRICING_QUANTITY_INPUT_SELECTORS: [ // Array for quantity input
        'input[name="quantity"]',
        'input[id*="quantityBase"]',
        'input[data-testid="quantity-input"]',
        '#qtyInput'
    ],

    // Promoted Listings
    PROMOTED_GENERAL_TOGGLE: '.fai-program-wrapper:first-child .switch__control',
    PROMOTED_AD_RATE_INPUT_SELECTORS: [ // Array for ad rate input
        'input[name="adRate"]',
        'input[data-testid="adRateInput"]',
        '#adRateInput'
    ],

    // Shipping
    SHIPPING_EDIT_BUTTON: '.summary__header-edit-button.summary__header-edit-button--icon-only.icon-btn',
    SHIPPING_REGION_INPUT_XPATH: "//input[@name='itemLocationCountry']", // XPath selectors are single strings
    SHIPPING_CITY_INPUT_XPATH: "//input[@name='itemLocationCityState']",
    SHIPPING_DONE_BUTTON_XPATH: "//button[@_track='0.shippingSettings.2.Done']",
};

export class EbayListingAutomator {
    constructor(loadingOverlay) {
        this.pageInfo = {
            /*
                specifics: {
                    key: {
                        valueDiv,
                        element,
                        value,
                        type
                    }
                }
                types: search, text
            */
            specifics:{}
        };
        this.actionHandlers = {
            'clickElement': this.clickElement.bind(this),
            'clickElementText': this.clickElementText.bind(this),
            'findText': this.findText.bind(this),
            'navigateToPage': this.navigateToPage.bind(this),
            'fillValue': this.fillValue.bind(this),
            'detectElement':this.detectElement.bind(this),
            'handleConditionSelectionNew': this.handleConditionSelectionNew.bind(this),
            'selectOption': this.selectOption.bind(this),
            'uploadImages': this.uploadImages.bind(this),
            'getSpecifics': this.getSpecifics.bind(this),
            'fillSpecifics': this.fillSpecifics.bind(this),
            'selectDropdownOption': this.selectDropdownOption.bind(this),
            'fillPricing': this.fillPricing.bind(this),
            'setTemplate': this.setTemplate.bind(this),
            'setPromotedListing': this.automatePromotedListingSettings.bind(this),
            'fillShipping': this.fillShipping.bind(this),
            'listingComplete': this.listingComplete.bind(this),
        };
        console.log('EbayListingAutomator initialized.');
        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        this.loadingOverlay = loadingOverlay;
    }
    // Message handler to route actions
    async handleMessage(request, sender, sendResponse) {
        console.log('Content script received message:', request);
        // Handle individual step actions if needed
        const actionHandler = this.actionHandlers[request.action];
        if (actionHandler) {
            try {
                const result = await actionHandler(request);
                if(!result) {
                    throw new Error(`Action ${request.action} failed`);
                }
                // sendResponse({ success: true, data: result });
                sendResponse({ success: true, message: 'Action completed successfully' });
            } catch (error) {
                console.error(`Action ${request.action} failed:`, error);
                sendResponse({ 
                    success: false, 
                    error: error.toString() 
                });
            }
            return true;
        }
        return false;
    }

    async clickElement(requestData) {
        console.log(`[EbayLister.clickElement] Attempting to click element with key "${requestData.selectorKey}" or selector "${requestData.selector}"`);
        let selector = SELECTORS[requestData.selectorKey] || requestData.selector;
        if (!selector) {
            throw new Error(`Selector key "${requestData.selectorKey}" not found and no direct selector provided.`);
        }

        // If selector is an array, try each one until success
        if (Array.isArray(selector)) {
            for (const sel of selector) {
                try {
                    const element = await this.waitAndFindElement(sel, requestData.timeout, requestData.selectorType || 'query');
                    if (element) {
                        console.log(`[EbayLister.clickElement] Element found with selector: "${sel}". Clicking.`);
                        element.click();
                        return { success: true };
                    }
                } catch (error) {
                    console.warn(`[EbayLister.clickElement] Failed to click element with selector "${sel}": ${error.message}. Trying next...`);
                }
            }
            throw new Error(`Element not found after trying all selectors for key: ${requestData.selectorKey}`);
        } else {
            // Single selector logic
            const element = await this.waitAndFindElement(selector, requestData.timeout, requestData.selectorType || 'query');
            if (!element) {
                throw new Error(`Element not found with selector: ${selector}`);
            }
            console.log(`[EbayLister.clickElement] Element found with selector: "${selector}". Clicking.`);
            element.click();
            return { success: true };
        }
    }

    async clickElementText(requestData) {
        console.log(`[EbayLister.clickElementText] Attempting to click element with text key "${requestData.textKey}" or text "${requestData.text}"`);
        const textToFind = SELECTORS[requestData.textKey] || requestData.text;
        if (!textToFind) {
            throw new Error(`Text key "${requestData.textKey}" not found and no direct text provided.`);
        }
        console.log(`[EbayLister.clickElementText] Searching for text: "${textToFind}"`);

        const elements = document.querySelectorAll('button, a, span, div, li, h1, h2, h3, p'); // Common interactive or text-holding elements
        let targetElement = null;

        for (const element of elements) {
            // Check if element is visible and has text content
            if (element.offsetParent !== null && element.textContent) {
                if (element.textContent.trim().includes(textToFind.trim())) {
                    targetElement = element;
                    console.log(`[EbayLister.clickElementText] Found matching element:`, targetElement);
                    break;
                }
            }
        }

        if (!targetElement) {
            const errorMessage = `[EbayLister.clickElementText] Element not found with text: "${textToFind}"`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        targetElement.click();
        console.log(`[EbayLister.clickElementText] Successfully clicked element with text: "${textToFind}"`);
        return { success: true };
    }

    async findText(requestData) {
        //incomplete
        const xPath = `//*[contains(text(), "${requestData.text}")]`;
        const element = await this.waitAndFindElement(xPath, 5000, 'xpath')
        console.log("text element found", element);


    }

    async navigateToPage(requestData) {
        if(!requestData.url) {
            throw new Error('URL is required to navigate to a page');
        }
        window.location.href = requestData.url;
        return true;
    }

    // In EbayLister.js
async fillValue(requestData) {
    const { value, selectorKey, selector: directSelector, timeout, selectorType = 'query' } = requestData;
    console.log(`[EbayLister.fillValue] Attempting to fill value for key "<span class="math-inline">\{selectorKey\}" or direct selector "</span>{directSelector}"`);

    let selectorsToTry = [];
    if (selectorKey && SELECTORS[selectorKey]) {
        const selEntry = SELECTORS[selectorKey];
        selectorsToTry = Array.isArray(selEntry) ? selEntry : [selEntry];
    } else if (directSelector) {
        selectorsToTry = [directSelector]; // Fallback to direct selector if key not found or provided
    } else {
        throw new Error(`No selectorKey or direct selector provided for fillValue action.`);
    }

    for (const sel of selectorsToTry) {
        try {
            // Use the timeout from requestData if provided, otherwise default in waitAndFindElement
            const element = await this.waitAndFindElement(sel, timeout, selectorType);
            if (element) {
                console.log(`[EbayLister.fillValue] Element found with selector: "${sel}". Filling value.`);
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                // element.dispatchEvent(new Event('blur', { bubbles: true })); // Consider if blur is always needed
                return { success: true, usedSelector: sel }; // Return success and the selector that worked
            }
        } catch (error) {
            console.warn(`[EbayLister.fillValue] Failed to find/fill element with selector "${sel}": ${error.message}. Trying next...`);
        }
    }
    // If loop completes without returning, no selector worked
    throw new Error(`Element not found or action failed after trying all selectors for key: ${selectorKey || 'N/A'} / direct: ${directSelector || 'N/A'}`);
}

    async detectElement(requestData){
        /*
            requestData: {
                selector: ""
            }
        */
        const element = await this.waitAndFindElement(requestData.selector);
        return !!element;   
    }

    // Function to select an option from the dropdown
    async selectDropdownOption(requestData) {
        /*
            requestData: {
                selector: "",
                optionText: ""
            }
        */
        const {selector, optionText} = requestData;
        const dropdown = document.querySelector(selector);

        if (!dropdown) {
            console.error('Dropdown element not found');
            return;
        }

        // Find the button that opens the dropdown
        const dropdownButton = dropdown.querySelector('button[aria-haspopup="listbox"]');

        if (!dropdownButton) {
            console.error('Dropdown button not found');
            return;
        }
        console.log('dropdown found', dropdownButton);
        // Simulate a click to open the dropdown
        dropdownButton.click();

        // Wait for the dropdown options to be visible
        setTimeout(() => {
            // Find all the options within the dropdown
            const options = dropdown.querySelectorAll('.listbox__option');

            if (!options || options.length === 0) {
                console.error('No options found in the dropdown');
                return;
            }

            // Iterate through the options to find the one with the desired text
            let desiredOption = null;
            options.forEach(option => {
                const optionTextElement = option.querySelector('.listbox__value');
                console.log('optionTextElement', optionTextElement.textContent.trim(), optionText);
                if (optionTextElement && optionTextElement.textContent.trim() === optionText) {
                    desiredOption = option;
                }
            });

            if (!desiredOption) {
                console.error('Desired option not found');
                return;
            }

            desiredOption.click();

            console.log(`Option "${optionText}" selected successfully`);
        }, 100);
        return true;
    }

    async selectOption(requestData) {
        /*
            requestData: {
                selector: "",  // Selector for the overall radio button/option group
                text: ""            // Text of the option to select
                index: number // will be used if text not provided or text not found
            }
        */
        const optionGroup = await this.waitAndFindElement(requestData.selector);
        if (!optionGroup) {
            throw new Error(`Option group not found: ${requestData.selector}`);
        }

        const radioInputs = optionGroup.querySelectorAll('input[type="radio"]');
        let targetRadioInput;
        let textFound = false;
        if(requestData.text){
            const labels = optionGroup.querySelectorAll('label');
            
            // Find the label that matches the option text
            const targetLabel = Array.from(labels).find(label => 
                label.textContent.trim() === requestData.text.trim()
            );
            if (!targetLabel) {
                textFound = false;
            }else{
                targetRadioInput = targetLabel.previousElementSibling?.querySelector('input[type="radio"]') || 
                targetLabel.querySelector('input[type="radio"]');
            }
        }
        
        if(!requestData.text || !textFound){
            // Select the radio input by index
            targetRadioInput = radioInputs[requestData.index];
        }
    
        if (!targetRadioInput) {
            throw new Error(`Radio input not found for option: ${requestData.optionText}, ${requestData.index}`);
        }
    
        // Click the radio input
        targetRadioInput.click();
    
        // Dispatch change event to ensure any attached event listeners are triggered
        targetRadioInput.dispatchEvent(new Event('change', { bubbles: true }));
    
        return true;
    }
    
    async uploadImages(requestData) {
        /*
            requestData: {
                selector: "",
                images: [],
                addBorder: bool
            }
        */

        async function addBorderToImage(blob){
            return new Promise((resolve)=>{
                const img = new Image();
                const url = URL.createObjectURL(blob);

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const borderW = 50;
                    canvas.width = img.width + borderW * 2;
                    canvas.height = img.height + borderW * 2;

                    ctx.fillStyle = '#ff0000'; // Border color
                    ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw border

                    ctx.drawImage(img, borderW, borderW, img.width, img.height); // Draw image

                    canvas.toBlob((newBlob) => {
                        URL.revokeObjectURL(url);
                        resolve(newBlob);
                    }, blob.type||'image/jpeg');
                }
                img.src = url;
            })
        }
        try {
            const uploadContainer = await this.waitAndFindElement(requestData.selector, 100000);
            let firstImage = requestData.addBorder;
            for (const imageUrl of requestData.images) {
                const uploadButton = uploadContainer.querySelector('button');
                if (!uploadButton) {
                    throw new Error('Upload button not found');
                }
     
                let fileInput = null;
                const observer = new MutationObserver((mutations, obs) => {
                    const foundInput = document.querySelector('input[type="file"]');
                    if (foundInput) {
                        fileInput = foundInput;
                        obs.disconnect();
                    }
                });
     
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
     
                uploadButton.click();
     
                await new Promise((resolve) => {
                    const checkInput = setInterval(() => {
                        const input = document.querySelector('input[type="file"]');
                        if (input) {
                            fileInput = input;
                            clearInterval(checkInput);
                            observer.disconnect();
                            resolve();
                        }
                    }, 100);
     
                    setTimeout(() => {
                        clearInterval(checkInput);
                        observer.disconnect();
                        resolve();
                    }, 5000);
                });
     
                if (!fileInput) {
                    throw new Error('File input element not found after clicking upload button');
                }
                let imageFile
                try{
                    imageFile = await fetch(imageUrl);
                }
                catch (error) {
                    console.error('Error fetching image:', error);
                    continue;
                }
                let blob = await imageFile.blob();

                if(firstImage){
                    blob = await addBorderToImage(blob);
                    firstImage = false;
                }

                const file = new File([blob], `product-image-${requestData.images.indexOf(imageUrl)}.jpg`, { type: blob.type });
     
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
     
                await new Promise(resolve => setTimeout(resolve, 400));
            }
     
            return true;
        } catch (error) {
            console.error('Error in uploadImages:', error);
            throw error;
        }
    }

    async getSpecifics() {
        
        //click on view more
        const viewMoreBtn = document.querySelector('#mainContent > div > div > div.main__container--form > div.summary__container > div.smry.summary__attributes > div.summary__attributes--container > button');
        if(viewMoreBtn){
            viewMoreBtn.click();
        }
        await new Promise(resolve => setTimeout(resolve, 100));

        //append 2 different element lists:
        const specificLabelElements = document.getElementsByClassName('summary__attributes--label');
        const specificsInputs = document.getElementsByClassName('summary__attributes--value');
        console.log('Specifics:', specificLabelElements, specificsInputs);
        for (let i = 0; i < specificLabelElements.length; i++) {
            const text = specificLabelElements[i].innerText;
            const key = text.split('\n')[0];
            let inputElement =  specificsInputs[i].querySelector('input') || 
                                specificsInputs[i].querySelector('select') ||
                                specificsInputs[i].querySelector('textArea');
            // console.log('Specific:', key, 'Element:', inputElement);

            let type = 'text'; // Default type

            if(inputElement === undefined || inputElement === null){
                //might be select type
                const ulElement = specificsInputs[i].lastElementChild;
                if(ulElement && ulElement.tagName === 'UL'){
                    type = 'select';
                    inputElement = ulElement;
                }
            }
            else{
                if (inputElement.name.includes('search-box')) {
                    type = 'search';
                }

            }

    
            this.pageInfo.specifics[key] = {
                valueDiv: specificsInputs[i],
                element: inputElement,
                type: type
            };
        }
        console.log('Specifics on page:', this.pageInfo);
        return true;
    }

    async fillSpecifics(requestData) {
        await this.getSpecifics();
        const specifics = requestData.specifics;
        const customSpecifics = {};
        for (const key in specifics) {
            const specific = this.pageInfo.specifics[key];
            if (!specific) {
                console.error(`Specific not found in page: ${key}`);
                customSpecifics[key] = specifics[key];
                continue;
            }
    
            const { valueDiv, element, type } = specific;
            const value = specifics[key];
            console.log('Filling specific:', key, 'with value:', value, 'type:', type);
            switch (type) {
                case 'text':

                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('Filling specific:', key, 'with value:', value, 'Element:', element);
                    break;
    
                case 'select':
                    // Select the option with the given value
                    // console.log("hello");
                    const options = element.getElementsByTagName('button');
                    console.log(options);
                    let targetOption;
                    for (const option of options) {
                        const optionText = option.innerText.trim();
                        console.log(optionText, value);
                        if (optionText === value) {

                            targetOption = option;
                            // break;
                        }
                    }
                    if(targetOption){
                        targetOption.click();
                        targetOption.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('Selected option:', targetOption);
                    }
                    else{
                        console.error(`Option not found for specific: ${key}, value: ${value}`);
                    }

                    // element.value = value;
                    // element.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
    
                case 'search':
                    await this.handleSearchInput(valueDiv, element, value);
                    break;
    
                default:
                    console.error(`Unsupported input type: ${type}`);
                    break;
            }
        }

        //select suggested required specifics
        const requiredSpecsDiv = document.querySelector(".summary__attributes--section-container")
        const frequentlySelectedElements = Array.from(
            requiredSpecsDiv.querySelectorAll('legend'))
            .filter(el => el.textContent.includes('Frequently selected'))
        
        frequentlySelectedElements.forEach(async(el) => {
            const buttonLink = el.parentElement.querySelector('button.fake-link');
            if(buttonLink){
                buttonLink.click();
            }
            //timeout for 100ms:
            await new Promise(resolve => setTimeout(resolve, 100));

        })
            try {
                
                const sizeTypeList = document.querySelector('ul[aria-label="Size Type"]');
                if (!sizeTypeList) {
                    console.error('Size Type list not found.');
                    // return { success: false, error: 'Size Type list not found' };
                    throw new Error('Size Type list not found');
                }
        
                // Find the first button within the <ul> element
                const firstButton = sizeTypeList.querySelector('button');
                if (!firstButton) {
                    console.error('No buttons found in the Size Type list.');
                    // return { success: false, error: 'No buttons found in the Size Type list' };
                    throw new Error('No buttons found in the Size Type list');
                }
        
                
                firstButton.click();
                console.log('Clicked the first button in the Size Type list.');
        
                
                await new Promise(resolve => setTimeout(resolve, 100));
        
                return { success: true };
            } catch (error) {
                console.error('Error clicking the first button in the Size Type list:', error);
            }

        // Fill custom specifics
        for(const key in customSpecifics){
            console.log('Filling custom specific:', key, 'with value:', customSpecifics[key]);
            this.clickElementText({text: 'Add custom item specific'});
            await new Promise(resolve => setTimeout(resolve, 500));
            const nameInput = document.querySelector('#s0-0-0-24-8-11-0-0-dialog-11-2-7-2-0-17-8-custom-attribute-name-se-textbox');
            const valueInput = document.querySelector('#s0-0-0-24-8-11-0-0-dialog-11-2-7-2-0-17-8-custom-attribute-value-se-textbox');
            if(!nameInput || !valueInput){
                console.error('Custom specific inputs not found');
                return;
            }
            nameInput.value = key;
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));

            valueInput.value = customSpecifics[key];
            valueInput.dispatchEvent(new Event('input', { bubbles: true }));

            await new Promise(resolve => setTimeout(resolve, 500));
            this.clickElementText({text: 'Save'});
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return true;
    }

    async handleSearchInput(searchDiv,searchInput, value) {
        // Set the search input value
        searchInput.value = value;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
        // Wait for the search results to appear
        await new Promise(resolve => setTimeout(resolve, 100));
    
        // Select the first search result
        const firstResult = searchDiv.querySelector('.menu__item[role="menuitemradio"]');
        if (firstResult) {
            console.log('Selecting first search result:', firstResult);
            firstResult.click();
        } else {
            console.error('No search results found');
            console.log("Adding custom detail");
            const customDetailBtn = searchDiv.getElementsByClassName('se-filter-menu-button__add-custom-value fake-link btn btn--fluid btn--secondary');
            if(!customDetailBtn || customDetailBtn.length === 0){
                console.error('Custom detail button not found');
                return;
            }
            customDetailBtn[0].click();
        }
    }

    async setTemplate(requestData){
        //requestData: {template: ""}
        // if((!requestData.template) || requestData.template === "" || requestData.template === undefined){
        //     throw new Error('Template not provided');
        // }

        //input with name descriptionEditorMode
        const showHTMLButton = await this.waitAndFindElement('input[name="descriptionEditorMode"]');
        if(!showHTMLButton){
            throw new Error(`showHTML Button not found`);
        }
        showHTMLButton.click();
        // const htmlInpBox = await this.waitAndFindElement('textarea[class="se-rte__button-group-editor__html"]');
        await new Promise(resolve => setTimeout(resolve, 500));
        const htmlInpBox = document.querySelector('textarea[class="se-rte__button-group-editor__html"]');
        console.log('HTML input box:', htmlInpBox);
        htmlInpBox.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        htmlInpBox.value = requestData.template;
        htmlInpBox.dispatchEvent(new Event('input', { bubbles: true }));
        htmlInpBox.dispatchEvent(new Event('change', { bubbles: true }));
        htmlInpBox.dispatchEvent(new Event('blur', { bubbles: true }));

        // Simulate user interaction
        htmlInpBox.focus();
        htmlInpBox.click();
        return true
    }

    async fillPricing(requestData) {
        /*
            requestData: {
                price: "",
                quantity: ""
            }
        */
       
        console.log('Filling pricing:', requestData);
        // const pricingOptionsButton = document.getElementById('nid-sys-28');
        // xpath: //button[@type='submit' and span='New']
        const xpathExpression = "//button[span='See pricing options']";
        const pricingOptionsButton = document.evaluate(
            xpathExpression,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
        console.log('Pricing options button:', pricingOptionsButton);
        
        const pricingLoaded = async()=>{
            // const pricingContainer = this.findElement('summary__price-fields-container', 'class');
            // if(!pricingContainer){
            //     console.error('Pricing container not found');
            //     return;
            // }
            const priceInput = this.findElement('input[name="price"]');
            if(!priceInput){
                console.error('Price input not found');
                return;
            }
            console.log('Price input:', priceInput);
            //wait 400ms:
            await new Promise(resolve => setTimeout(resolve, 600));
            priceInput.value = requestData.price;
            // console.log('Price input:', priceInput.value, requestData.price);
            priceInput.dispatchEvent(new Event('change', { bubbles: true }));

            const quantityInput = this.findElement('input[name="quantity"]');
            if(!quantityInput){
                console.error('Quantity input not found');
                // return;
            }else{
                quantityInput.value = requestData.quantity;
                quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            console.log('Pricing filled');
        }

        return new Promise((resolve, reject)=>{
            const config = { attributes: true, childList: false, subtree: false };
            //callback for observer
            const pricingLoadedCallback = (mutationsList, observer) => {
                for(const mutation of mutationsList) {
                    if(mutation.type === 'attributes' && mutation.attributeName === 'disabled' && !pricingOptionsButton.disabled) {
                        pricingLoaded();
                        console.log('Pricing form loaded!!');
                        observer.disconnect();
                        resolve(true);
                    }
                }
            }
            const observer = new MutationObserver(pricingLoadedCallback);
            observer.observe(pricingOptionsButton, config);
        });

        
        
    }
    async listingComplete(requestData){
        this.loadingOverlay.hide();
        return true;
    }
    // Promoted listing settings automation
    async automatePromotedListingSettings(requestData) {
        try {
            const adRate = requestData.adRate||12;
            // Step 1: Find and toggle the General section if it's not already checked
            const generalToggle = document.querySelector('.fai-program-wrapper:first-child .switch__control');
            if (generalToggle && !generalToggle.checked) {
                console.log('Toggling General section on');
                generalToggle.click();
                // Wait for any animations or state changes
                await new Promise(resolve => setTimeout(resolve, 300));
            } else {
                console.log('General section is already toggled on');
            }
    
            // Step 2: Find the ad rate input field and set its value
            const adRateInput = document.querySelector('input[name="adRate"]');
            if (adRateInput) {
                console.log(`Setting ad rate to: ${adRate}%`);
                
                // Clear existing value
                // adRateInput.value = '';
                // adRateInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Set new value
                adRateInput.value = adRate.toString();
                adRateInput.dispatchEvent(new Event('input', { bubbles: true }));
                adRateInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Optional: Check if there's a "Apply suggested ad rate" button to click
                // const suggestedRateButton = document.querySelector('.pl-inline-edit-input-suggested');
                // if (suggestedRateButton && suggestedRateButton.textContent.includes(adRate)) {
                //     console.log('Clicking suggested ad rate button');
                //     suggestedRateButton.click();
                // }
                
                console.log('Ad rate updated successfully');
            } else {
                console.error('Ad rate input field not found');
            }
        } catch (error) {
            console.error('Error automating promoted listing settings:', error);
        }
        return true;
    }

    async fillShipping(requestData) {
        /*
            requestData:{
                city:"",
                region:"",
            }
        */

        // click edit button
        // list of found elements:
        const editButtonFound = document.getElementsByClassName('summary__header-edit-button summary__header-edit-button--icon-only icon-btn');
        if(editButtonFound.length > 0){
            editButtonFound[0].click();
        }
        else{
            console.error('Edit button not found');
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        const regionInput = await this.waitAndFindElement("//input[@name='itemLocationCountry']", 5000, 'xpath');
        if(regionInput){
            regionInput.value = requestData.region;
            regionInput.dispatchEvent(new Event('blur', { bubbles: true }));
            // regionInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else{
            console.error('Region input not found');
        }

        const cityInput = await this.waitAndFindElement("//input[@name='itemLocationCityState']", 5000, 'xpath');
        if(cityInput){
            cityInput.value = requestData.city;
            cityInput.dispatchEvent(new Event('input', { bubbles: true }));
            cityInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else{
            console.error('City input not found');
        }
        const doneButton = await this.waitAndFindElement("//button[@_track='0.shippingSettings.2.Done']", 5000, 'xpath');
        if(doneButton){
            doneButton.click();
        }
        else{
            console.error('Done button not found');
        }

        return true;
    }

    // Utility methods
    findElement(selector, selectorType = 'query', context = document){
        let element;
        switch(selectorType){
            case 'query':
                element = context.querySelector(selector);
                break;
            case 'id':
                element = context.getElementById(selector);
                break;
            case 'class':
                element = context.getElementsByClassName(selector);
                break;
            case 'xpath':
                element = document.evaluate(
                    selector,
                    context,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                break;
                default:
                    element = context.querySelector(selector);
        }
        return element;
    }
    /* async waitAndFindElement(selector, timeout = 20000, selectorType = 'query', context = document) {
        console.log('Waiting for element:', selector);
    
        return new Promise((resolve, reject) => {
            let timer = null;
    
            const checkForElement = () => {
                let element = null;
                switch (selectorType) {
                    case 'query':
                        element = context.querySelector(selector);
                        break;
                    case 'id':
                        element = context.getElementById(selector);
                        break;
                    case 'class':
                        element = context.getElementsByClassName(selector)[0];
                        break;
                    case 'xpath':
                        element = document.evaluate(
                            selector,
                            context,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                        break;
                    default:
                        element = context.querySelector(selector);
                }
    
                if (element) {
                    console.log('Element found:', element);
                    if (timer) clearTimeout(timer);
                    observer.disconnect();
                    resolve(element);
                }
            };
    
            const observer = new MutationObserver(checkForElement);
            observer.observe(context, { childList: true, subtree: true });
    
            // Initial check
            checkForElement();
    
            if (timeout) {
                timer = setTimeout(() => {
                    observer.disconnect();
                    console.error("Timeout error");
                    reject(new Error(`Element not found: ${selector}`));
                }, timeout);
            }
        });
    }
    
    */
    async waitAndFindElement(selector, timeout = 5000, selectorType = 'query', context = document) {
        console.log('Waiting for element:', selector);
        const checkForElement = () => {
            let element = null;
            switch(selectorType){
                case 'query':
                    element = context.querySelector(selector);
                    break;
                case 'id':
                    element = context.getElementById(selector);
                    break;
                case 'class':
                    element = context.getElementsByClassName(selector)[0];
                    break;
                case 'xpath':
                    element = document.evaluate(
                        selector,
                        context,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    break;
                    default:
                        element = context.querySelector(selector);
            }

            return element;

        }
                
        return new Promise((resolve, reject) => {
            let element = checkForElement();
            if (element) {
                resolve(element);
            }
            const interval = setInterval(() => {
                element = checkForElement();
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 500);
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error(`Element not found: ${selector}`));
            }, timeout);
        });
 
    }
async handleConditionSelectionNew(requestData) {
        console.log('[EbayLister.handleConditionSelectionNew] Processing new condition selection flow...');

        // 1. Detect if the specific condition selection UI is present
        let pageUiDetected = false;
        const detectors = SELECTORS.CONDITION_PAGE_DETECTORS || []; // Ensure detectors is an array
        for (const detector of detectors) {
            try {
                if (await this.waitAndFindElement(detector, 1000)) {
                    console.log(`[EbayLister.handleConditionSelectionNew] Condition UI detected with: ${detector}`);
                    pageUiDetected = true;
                    break;
                }
            } catch (e) { /* Selector not found, try next */ }
        }

        if (!pageUiDetected) {
            console.log('[EbayLister.handleConditionSelectionNew] Relevant condition selection UI not detected. Skipping step.');
            return { success: true, skipped: true, message: 'Condition selection UI not found, skipped.' };
        }

        // 2. Attempt to select "New without tags" using the specific selector
        let conditionClicked = false;
        try {
            if (!SELECTORS.CONDITION_NEW_WITHOUT_TAGS_BUTTON_SELECTOR) {
                throw new Error("CONDITION_NEW_WITHOUT_TAGS_BUTTON_SELECTOR is not defined in SELECTORS.");
            }
            await this.clickElement({ selector: SELECTORS.CONDITION_NEW_WITHOUT_TAGS_BUTTON_SELECTOR, timeout: 3000 });
            console.log('[EbayLister.handleConditionSelectionNew] "New without tags" option clicked using specific selector.');
            conditionClicked = true;
            await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UI to react
        } catch (error) {
            console.warn(`[EbayLister.handleConditionSelectionNew] Could not click "New without tags" using specific selector: ${error.message}. Attempting text fallback.`);
            // Fallback to text-based click if specific selector fails
            try {
                await this.clickElementText({ textKey: 'CONDITION_NEW_WITHOUT_TAGS_TEXT', timeout: 2000 });
                console.log('[EbayLister.handleConditionSelectionNew] "New without tags" option clicked using text fallback.');
                conditionClicked = true;
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (textError) {
                console.warn(`[EbayLister.handleConditionSelectionNew] Text fallback for "New without tags" also failed: ${textError.message}. Will attempt to continue.`);
            }
        }

        // 3. Attempt to click the "Continue" button using the specific selector
        try {
            if (!SELECTORS.CONDITION_CONTINUE_BUTTON_SELECTOR) {
                throw new Error("CONDITION_CONTINUE_BUTTON_SELECTOR is not defined in SELECTORS.");
            }
            await this.clickElement({ selector: SELECTORS.CONDITION_CONTINUE_BUTTON_SELECTOR, timeout: 3000 });
            console.log('[EbayLister.handleConditionSelectionNew] "Continue" button clicked using specific selector.');
            return { success: true, message: 'Condition flow handled, "Continue" clicked via specific selector.' };
        } catch (error) {
            console.warn(`[EbayLister.handleConditionSelectionNew] Could not click "Continue" button using specific selector: ${error.message}. Attempting text fallback.`);
            // Fallback to text-based click for "Continue"
            try {
                await this.clickElementText({ textKey: 'CONDITION_CONTINUE_BUTTON_TEXT', timeout: 2000 });
                console.log('[EbayLister.handleConditionSelectionNew] "Continue" button clicked using text fallback.');
                return { success: true, message: 'Condition flow handled, "Continue" clicked via text fallback.' };
            } catch (textError) {
                const errorMessage = `[EbayLister.handleConditionSelectionNew] Failed to click "Continue" button using specific selector and text fallback: ${textError.message}`;
                console.error(errorMessage);
                // If the condition was definitely clicked, but "Continue" failed, this is an issue.
                if (conditionClicked) {
                    throw new Error(errorMessage + " (Condition was selected but could not continue)");
                } else {
                    // If condition wasn't clicked and continue also failed, still problematic if UI was detected.
                    console.warn('[EbayLister.handleConditionSelectionNew] Neither condition nor continue button could be reliably actioned, though UI was present.');
                    // Depending on strictness, you might throw or return a soft failure/skip.
                    // For now, let's indicate a failure to proceed with this step.
                    throw new Error(errorMessage + " (Could not complete condition step)");
                }
            }
        }
    }
}
