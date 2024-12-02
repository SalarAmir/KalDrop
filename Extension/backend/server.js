const express = require('express');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const app = express();

// Add timestamp to console logs
const logWithTimestamp = (message, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data);
};

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
    logWithTimestamp(`Incoming ${req.method} request to ${req.url}`);
    logWithTimestamp('Request body:', req.body);
    next();
});

class EbayAutomation {
    constructor() {
        this.driver = null;
        logWithTimestamp('EbayAutomation instance created');
    }

    async initialize() {
        try {
            logWithTimestamp('Initializing Chrome WebDriver...');
            const options = new chrome.Options();
            options.addArguments('--headless');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            logWithTimestamp('Chrome options configured:', options);
            
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
                
            logWithTimestamp('WebDriver successfully initialized');
            return true;
        } catch (error) {
            logWithTimestamp('ERROR during initialization:', error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            logWithTimestamp('Attempting to log in to eBay...');
            logWithTimestamp(`Using username: ${username.substring(0, 3)}***`);
            
            logWithTimestamp('Navigating to eBay login page');
            await this.driver.get('https://signin.ebay.com');
            
            logWithTimestamp('Waiting for username field');
            const userField = await this.driver.findElement(By.id('userid'));
            logWithTimestamp('Entering username');
            await userField.sendKeys(username);
            
            logWithTimestamp('Waiting for password field');
            const passField = await this.driver.findElement(By.id('pass'));
            logWithTimestamp('Entering password');
            await passField.sendKeys(password);
            
            logWithTimestamp('Clicking sign in button');
            await this.driver.findElement(By.id('sgnBt')).click();
            
            logWithTimestamp('Waiting for successful login (eBay title)');
            await this.driver.wait(until.titleContains('eBay'), 5000);
            
            logWithTimestamp('Successfully logged in to eBay');
            
            // Get and log current URL to verify login success
            const currentUrl = await this.driver.getCurrentUrl();
            logWithTimestamp('Current URL after login:', currentUrl);
            
        } catch (error) {
            logWithTimestamp('ERROR during login:', error);
            throw error;
        }
    }

    calculatePrice(aliPrice) {
        logWithTimestamp('Calculating eBay price from:', aliPrice);
        const basePrice = parseFloat(aliPrice.replace(/[^0-9.]/g, ''));
        const calculatedPrice = (basePrice * 1.3 + 5).toFixed(2);
        logWithTimestamp('Calculated price:', calculatedPrice);
        return calculatedPrice;
    }

    async createListing(productData) {
        try {
            logWithTimestamp('Starting to create eBay listing');
            logWithTimestamp('Product data received:', productData);
            
            logWithTimestamp('Navigating to eBay listing page');
            await this.driver.get('https://bulksell.ebay.com/ws/eBayISAPI.dll?SingleList');
            
            // Log current URL to verify navigation
            const listingUrl = await this.driver.getCurrentUrl();
            logWithTimestamp('Current listing page URL:', listingUrl);
            
            logWithTimestamp('Entering product title');
            const titleField = await this.driver.findElement(By.id('editpane_title'));
            await titleField.sendKeys(productData.title);
            
            const calculatedPrice = this.calculatePrice(productData.price);
            logWithTimestamp('Entering product price:', calculatedPrice);
            const priceField = await this.driver.findElement(By.id('editpane_price'));
            await priceField.sendKeys(calculatedPrice);
            
            logWithTimestamp('Locating description iframe');
            const frame = await this.driver.findElement(By.id('editpane_description_iframe'));
            
            logWithTimestamp('Switching to description iframe');
            await this.driver.switchTo().frame(frame);
            
            logWithTimestamp('Entering product description');
            await this.driver.findElement(By.tagName('body')).sendKeys(productData.description);
            
            logWithTimestamp('Switching back to main content');
            await this.driver.switchTo().defaultContent();
            
            logWithTimestamp('Starting image upload process');
            logWithTimestamp('Number of images to upload:', productData.images.length);
            for (const [index, imageUrl] of productData.images.slice(0, 12).entries()) {
                logWithTimestamp(`Uploading image ${index + 1}/${productData.images.length}:`, imageUrl);
                await this.uploadImage(imageUrl);
            }
            
            logWithTimestamp('Looking for submit button');
            const submitButton = await this.driver.findElement(By.id('saveListing'));
            
            logWithTimestamp('Clicking submit button');
            await submitButton.click();
            
            logWithTimestamp('Waiting for listing confirmation');
            await this.driver.wait(until.titleContains('Listing confirmed'), 10000);
            
            logWithTimestamp('Listing created successfully');
            return true;
        } catch (error) {
            logWithTimestamp('ERROR creating listing:', error);
            // Log the current URL when error occurs
            try {
                const errorUrl = await this.driver.getCurrentUrl();
                logWithTimestamp('URL at time of error:', errorUrl);
                
                // Try to get page source for debugging
                const pageSource = await this.driver.getPageSource();
                logWithTimestamp('Page source at time of error:', pageSource.substring(0, 500) + '...');
            } catch (secondaryError) {
                logWithTimestamp('ERROR getting debug information:', secondaryError);
            }
            return false;
        }
    }

    async uploadImage(imageUrl) {
        try {
            logWithTimestamp('Starting image upload for URL:', imageUrl);
            // Implement actual image upload logic here
            logWithTimestamp('Image upload completed');
        } catch (error) {
            logWithTimestamp('ERROR uploading image:', error);
            throw error;
        }
    }

    async close() {
        if (this.driver) {
            logWithTimestamp('Closing WebDriver session');
            await this.driver.quit();
            logWithTimestamp('WebDriver session closed successfully');
        }
    }
}

const automation = new EbayAutomation();

app.post('/api/list', async (req, res) => {
    logWithTimestamp('Received listing request');
    try {
        if (!automation.driver) {
            logWithTimestamp('No active WebDriver session, initializing...');
            await automation.initialize();
            
            logWithTimestamp('Checking for eBay credentials');
            if (!process.env.EBAY_USERNAME || !process.env.EBAY_PASSWORD) {
                throw new Error('eBay credentials not found in environment variables');
            }
            
            logWithTimestamp('Starting eBay login process');
            await automation.login(process.env.EBAY_USERNAME, process.env.EBAY_PASSWORD);
        }
        
        logWithTimestamp('Starting listing creation');
        const success = await automation.createListing(req.body);
        
        if (success) {
            logWithTimestamp('Listing creation successful');
            res.json({ message: 'Product listed successfully on eBay!' });
        } else {
            logWithTimestamp('Listing creation failed');
            res.status(500).json({ message: 'Failed to create listing' });
        }
    } catch (error) {
        logWithTimestamp('SERVER ERROR:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logWithTimestamp(`Server started on port ${PORT}`);
    logWithTimestamp('Environment:', process.env.NODE_ENV || 'not set');
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    logWithTimestamp('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logWithTimestamp('UNHANDLED REJECTION:', error);
});