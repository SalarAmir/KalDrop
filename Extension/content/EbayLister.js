export class EbayListingAutomatorOld {
    constructor(productData) {
        console.log('Initializing EbayListingAutomator...');
        if (!productData) throw new Error('Product data is required to create a listing');
        this.productData = productData;
        console.log('EbayListingAutomator initialized with productData:', productData);
    }

    async createListing() {
        try {
            console.log('Starting eBay listing process...');
            await this.navigateToSellPage();
            await this.startNewListing();
            await this.fillTitle();
            await this.setBrand();
            await this.setListingType();
            await this.fillDescription();
            await this.uploadImages();
            await this.setCategoryAndCondition();
            await this.setPricing();
            await this.setListingOptions();
            await this.setShippingOptions();
            await this.reviewAndSubmitListing();
            console.log('eBay listing created successfully!');
        } catch (error) {
            console.error('Error creating eBay listing:', error);
            throw error;
        }
    }

    async navigateToSellPage() {
        // console.log('Navigating to the eBay Sell page...');
        // window.location.href = 'https://www.ebay.com/sell/create';
        // await this.waitForPageLoad();
        // console.log('Navigated to the Sell page.');
    }

    async startNewListing() {
        console.log('Starting a new eBay listing...');
        // const newListingBtn = await this.waitAndFindElement('a[textual-display fake-btn fake-btn--primary"]');
        const newListingBtn = await this.waitAndFindElement('#mainContent > div.container__content > div.menu > div > nav > ul > li.header-links__item-button > a');
        newListingBtn.click();
        await this.waitForPageLoad();
        console.log('New eBay listing started.');
    }

    async fillTitle() {
        console.log('Filling the title...');
        const titleInput = await this.waitAndFindElement('.textbox.textbox--large.textbox--fluid.se-textbox--input input');
        titleInput.value = this.productData.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Title filled with:', this.productData.title);
    }

    async setBrand() {
        console.log('Setting brand...');
        const brandInput = await this.waitAndFindElement('.fake-menu-button');
        brandInput.value = 'Unbranded';
        brandInput.dispatchEvent(new Event('input', { bubbles: true }));

        const enterKeyEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
        });
        brandInput.dispatchEvent(enterKeyEvent);
        console.log('Brand set to "Unbranded".');
    }

    async setListingType() {
        console.log('Setting listing type...');
        const buyNowButton = await this.waitAndFindElement('.fake-link');
        buyNowButton.click();
        await this.waitForPageLoad();
        console.log('Listing type set to "Buy Now".');
    }

    async fillDescription() {
        console.log('Filling description...');
        try {
            const htmlEditButton = await this.waitAndFindElement('.se-rte__button-group-editor__html.hidden');
            htmlEditButton.click();

            const descriptionTextarea = await this.waitAndFindElement('textarea');
            descriptionTextarea.value = this.productData.description;
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Description filled with:', this.productData.description);
        } catch (error) {
            console.error('Error setting description:', error);
        }
    }

    async uploadImages() {
        console.log('Uploading images...');
        const fileInput = await this.waitAndFindElement('input[type="file"][accept="image/*"]');

        const imageFiles = await Promise.all(
            this.productData.images.map(async (imageUrl) => {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                console.log('Fetched image from URL:', imageUrl);
                return new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
            })
        );

        const dataTransfer = new DataTransfer();
        imageFiles.forEach((file) => dataTransfer.items.add(file));

        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Images uploaded:', this.productData.images);

        await this.waitForImageUpload();
    }

    async setCategoryAndCondition() {
        console.log('Setting category and condition...');
        const categoryInput = await this.waitAndFindElement('#category-input');
        categoryInput.value = this.productData.categoryId;
        categoryInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Category set to:', this.productData.categoryId);

        const conditionSelect = await this.waitAndFindElement('select[name="condition"]');
        conditionSelect.value = 'new';
        conditionSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Condition set to: New');
    }

    async setPricing() {
        console.log('Setting pricing...');
        const listingFormatButton = await this.waitAndFindElement('.listbox-button.listbox-button--fluid.listbox-button--form');
        listingFormatButton.click();

        const buyNowOption = await this.waitAndFindElement('button[data-value="buy-now"]');
        buyNowOption.click();

        const priceInput = await this.waitAndFindElement('.textbox.textbox--fluid.se-textbox--input input');
        priceInput.value = this.productData.price;
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Price set to:', this.productData.price);
    }

    async setListingOptions() {
        console.log('Setting listing options...');
        const options = this.productData.listingOptions || {};

        if (options.requireImmediatePayment) {
            const immediatePaymentCheckbox = await this.waitAndFindElement('input[name="immediate-payment"]');
            immediatePaymentCheckbox.checked = true;
            immediatePaymentCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Immediate payment option enabled.');
        }

        if (options.quantity) {
            const quantityInput = await this.waitAndFindElement('input[name="quantity"]');
            quantityInput.value = options.quantity;
            quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Quantity set to:', options.quantity);
        }

        if (options.allowOffers) {
            const allowOffersCheckbox = await this.waitAndFindElement('input[name="allow-offers"]');
            allowOffersCheckbox.checked = true;
            allowOffersCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Allow offers option enabled.');
        }
    }

    async setShippingOptions() {
        console.log('Setting shipping options...');
        try {
            const freeShippingOption = await this.waitAndFindElement('input[value="free-shipping"]');
            freeShippingOption.click();
            console.log('Free shipping enabled.');
        } catch (error) {
            console.log('Could not set free shipping, using default options.');
        }
    }

    async reviewAndSubmitListing() {
        console.log('Reviewing and submitting listing...');
        const reviewBtn = await this.waitAndFindElement('#review-listing-btn');
        reviewBtn.click();
        console.log('Review button clicked.');

        await this.waitForPageLoad();

        const submitBtn = await this.waitAndFindElement('#submit-listing-btn');
        submitBtn.click();
        console.log('Submit button clicked.');

        await this.waitForListingConfirmation();
        console.log('Listing submitted and confirmed.');
    }

    // utils:
    //wait for page load:
    async waitForPageLoad() {
        return new Promise((resolve) => {
            window.addEventListener('load', resolve);
        });
    }

    async waitAndFindElement(selector) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                }
            }, 1000);
        });
    }
}

//automator v0.2
export class EbayListingAutomator {
    constructor() {
        this.actionHandlers = {
            'clickElement': this.clickElement.bind(this),
            'navigateToPage': this.navigateToPage.bind(this),
            'fillValue': this.fillValue.bind(this),
        };
        console.log('EbayListingAutomator initialized.');
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

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