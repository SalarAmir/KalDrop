class EbayListingAutomator {
    constructor(productData) {
        this.productData = productData;
    }

    async createListing() {
        // Navigate to eBay's sell page
        await this.navigateToSellPage();
        
        // Start listing process
        await this.startNewListing();
        
        // Fill out listing details
        await this.fillTitle();
        await this.fillDescription();
        await this.uploadImages();
        await this.setCategoryAndCondition();
        await this.setPricing();
        await this.setShippingOptions();
        
        // Review and submit
        await this.reviewAndSubmitListing();
    }

    async navigateToSellPage() {
        // Programmatically navigate to eBay's sell page
        window.location.href = 'https://www.ebay.com/sell/create';
        await this.waitForPageLoad();
    }

    async startNewListing() {
        // Find and click "Create a new listing" button
        const newListingBtn = await this.waitAndFindElement('a[data-test-id="create-listing-btn"]');
        newListingBtn.click();
        await this.waitForPageLoad();
    }

    async fillTitle() {
        const titleInput = await this.waitAndFindElement('#itemTitle');
        titleInput.value = this.productData.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async fillDescription() {
        // Some eBay listing pages use different description input methods
        try {
            // Try rich text editor first
            const descriptionFrame = await this.waitAndFindElement('iframe[title="Rich Text Area"]');
            const descriptionBody = descriptionFrame.contentDocument.body;
            descriptionBody.innerHTML = this.productData.description;
        } catch {
            // Fallback to textarea
            const descriptionTextarea = await this.waitAndFindElement('#description');
            descriptionTextarea.value = this.productData.description;
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
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
        // Set price
        const priceInput = await this.waitAndFindElement('#price');
        priceInput.value = this.productData.price;
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Set quantity
        const quantityInput = await this.waitAndFindElement('#quantity');
        quantityInput.value = this.productData.quantity || 1;
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async setShippingOptions() {
        // Select shipping method
        const freeShippingRadio = await this.waitAndFindElement('input[value="free-shipping"]');
        freeShippingRadio.click();
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