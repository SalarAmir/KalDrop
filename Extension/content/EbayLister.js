

//automator v0.2
export class EbayListingAutomator {
    constructor(loadingOverlay) {
        this.actionHandlers = {
            'clickElement': this.clickElement.bind(this),
            'clickElementText': this.clickElementText.bind(this),
            'navigateToPage': this.navigateToPage.bind(this),
            'fillValue': this.fillValue.bind(this),
            'detectElement':this.detectElement.bind(this),
            'selectOption': this.selectOption.bind(this),
            'uploadImages': this.uploadImages.bind(this),
            'listingComplete': this.listingComplete.bind(this)
        };
        console.log('EbayListingAutomator initialized.');
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        this.loadingOverlay = loadingOverlay;
        // Set up message listener
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
        for (const element of elements) {
            if (element.textContent.trim() === requestData.text.trim()) {
                targetElement = element;
                break;
            }
        }

        if (!targetElement) {
            throw new Error(`Element not found with text: ${requestData.text}`);
        }

        targetElement.click();
        return true;
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
        
            // Find the associated radio input
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
            const uploadContainer = await this.waitAndFindElement(requestData.selector);
            
            //limit images to 25:
            if(requestData.images.length > 25){
                requestData.images = requestData.images.slice(0,25);
            }

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
     
                const imageFile = await fetch(imageUrl);
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
    async listingComplete(requestData){
        this.loadingOverlay.hide();
        return true;
    }
    
    // Utility methods
    async waitAndFindElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkForElement = () => {
                const element = document.querySelector(selector);
                
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element not found: ${selector}`));
                } else {
                    setTimeout(checkForElement, 500);
                }
            };

            checkForElement();
        });
    }
}