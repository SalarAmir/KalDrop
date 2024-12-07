export class EbayListingAutomator {
    constructor(productData) {
        if (!productData) throw new Error('Product data is required to create a listing');
        this.productData = productData;
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
        window.location.href = 'https://www.ebay.com/sell/create';
        await this.waitForPageLoad();
    }

    async startNewListing() {
        const newListingBtn = await this.waitAndFindElement('a[data-test-id="create-listing-btn"]');
        newListingBtn.click();
        await this.waitForPageLoad();
    }

    async fillTitle() {
        const titleInput = await this.waitAndFindElement('.textbox.textbox--large.textbox--fluid.se-textbox--input input');
        titleInput.value = this.productData.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async setBrand() {
        const brandInput = await this.waitAndFindElement('.fake-menu-button');
        brandInput.value = 'Unbranded';
        brandInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Simulate pressing Enter to confirm
        const enterKeyEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true
        });
        brandInput.dispatchEvent(enterKeyEvent);
    }

    async setListingType() {
        const buyNowButton = await this.waitAndFindElement('.fake-link');
        buyNowButton.click();
        await this.waitForPageLoad();
    }

    async fillDescription() {
        try {
            // Try to find and switch to HTML edit mode
            const htmlEditButton = await this.waitAndFindElement('.se-rte__button-group-editor__html.hidden');
            htmlEditButton.click();

            // Find description textarea
            const descriptionTextarea = await this.waitAndFindElement('textarea');
            descriptionTextarea.value = this.productData.description;
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (error) {
            console.error('Error setting description:', error);
        }
    }

    async uploadImages() {
        const fileInput = await this.waitAndFindElement('input[type="file"][accept="image/*"]');
        
        // Convert image URLs to File objects
        const imageFiles = await Promise.all(
            this.productData.images.map(async (imageUrl) => {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                return new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
            })
        );

        // Create a DataTransfer object to simulate file selection
        const dataTransfer = new DataTransfer();
        imageFiles.forEach(file => dataTransfer.items.add(file));
        
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for images to upload
        await this.waitForImageUpload();
    }

    async setCategoryAndCondition() {
        // Select category
        const categoryInput = await this.waitAndFindElement('#category-input');
        categoryInput.value = this.productData.categoryId;
        categoryInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Select condition (e.g., New)
        const conditionSelect = await this.waitAndFindElement('select[name="condition"]');
        conditionSelect.value = 'new';
        conditionSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async setPricing() {
        // Select listing format (Buy Now)
        const listingFormatButton = await this.waitAndFindElement('.listbox-button.listbox-button--fluid.listbox-button--form');
        listingFormatButton.click();

        // Wait for Buy Now option and select it
        const buyNowOption = await this.waitAndFindElement('button[data-value="buy-now"]');
        buyNowOption.click();

        // Set price
        const priceInput = await this.waitAndFindElement('.textbox.textbox--fluid.se-textbox--input input');
        priceInput.value = this.productData.price;
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async setListingOptions() {
        // Configuration options
        const options = this.productData.listingOptions || {};

        // Immediate payment option
        if (options.requireImmediatePayment) {
            const immediatePaymentCheckbox = await this.waitAndFindElement('input[name="immediate-payment"]');
            immediatePaymentCheckbox.checked = true;
            immediatePaymentCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set quantity
        if (options.quantity) {
            const quantityInput = await this.waitAndFindElement('input[name="quantity"]');
            quantityInput.value = options.quantity;
            quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Allow offers option
        if (options.allowOffers) {
            const allowOffersCheckbox = await this.waitAndFindElement('input[name="allow-offers"]');
            allowOffersCheckbox.checked = true;
            allowOffersCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    async setShippingOptions() {
        // More flexible shipping option selection
        try {
            const freeShippingOption = await this.waitAndFindElement('input[value="free-shipping"]');
            freeShippingOption.click();
        } catch (error) {
            console.log('Could not set free shipping, using default options');
        }
    }

    async reviewAndSubmitListing() {
        // Click review button
        const reviewBtn = await this.waitAndFindElement('#review-listing-btn');
        reviewBtn.click();

        // Wait for review page
        await this.waitForPageLoad();

        // Submit listing
        const submitBtn = await this.waitAndFindElement('#submit-listing-btn');
        submitBtn.click();

        // Wait for confirmation
        await this.waitForListingConfirmation();
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
                    setTimeout(checkForElement, 100);
                }
            };

            checkForElement();
        });
    }

    async waitForPageLoad(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkPageLoad = () => {
                if (document.readyState === 'complete') {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Page load timeout'));
                } else {
                    setTimeout(checkPageLoad, 100);
                }
            };

            checkPageLoad();
        });
    }

    async waitForImageUpload(timeout = 30000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkImageUpload = () => {
                const uploadedImages = document.querySelectorAll('.image-thumbnail');
                if (uploadedImages.length > 0) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Image upload timeout'));
                } else {
                    setTimeout(checkImageUpload, 100);
                }
            };

            checkImageUpload();
        });
    }

    async waitForListingConfirmation(timeout = 20000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkConfirmation = () => {
                const confirmationMessage = document.querySelector('.listing-confirmation');
                if (confirmationMessage) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Listing submission timeout'));
                } else {
                    setTimeout(checkConfirmation, 100);
                }
            };

            checkConfirmation();
        });
    }
}