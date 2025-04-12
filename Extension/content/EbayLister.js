//automator v0.2
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
        /*
            requestData: {
                selector: ""
            }
        */
        const element = await this.waitAndFindElement(requestData.selector);
        if (!element) {
            throw new Error(`Element not found: ${request.selector}`);
        }
        element.click();
        return true;
    }

    async clickElementText(requestData) {
        /*
            requestData: {
                text: ""
            }
        */
        const elements = document.querySelectorAll('*');
        let targetElement;
        let found = false;
        for (const element of elements) {
            if (element.textContent.trim() === requestData.text.trim()) {
                // console.log('Element found with text:', element);
                found = true;
                targetElement = element;
                if(found){
                    console.warn('Multiple elements found with the same text', requestData.text);
                }
                targetElement.click();
                // break;
            }
        }

        if (!targetElement) {
            throw new Error(`Element not found with text: ${requestData.text}`);
        }
        targetElement.click();

        return true;
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

    async fillValue(requestData) {
        /*
            requestData: {
                value: "",
                selector: ""
            }
        */
        console.log('Filling value:', requestData.value, 'in element:', requestData.selector);
        const element = await this.waitAndFindElement(requestData.selector);
        if (!element) {
            throw new Error(`Element not found: ${requestData.selector}`);
        }
        element.value = requestData.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
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
                images: []
            }
        */
        try {
            const uploadContainer = await this.waitAndFindElement(requestData.selector, 100000);

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
                const blob = await imageFile.blob();
                const file = new File([blob], `product-image-${requestData.images.indexOf(imageUrl)}.jpg`, { type: blob.type });
     
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
     
                await new Promise(resolve => setTimeout(resolve, 1000));
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
            let inputElement = specificsInputs[i].querySelector('input') || 
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
    /* 
    async waitAndFindElement(selector, timeout = 20000, selectorType = 'query', context = document) {
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

    
}
