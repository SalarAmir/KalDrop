const scraper = new AliExpressScraper();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProduct') {
    scraper.scrapeProduct().then(sendResponse);
    return true; // Keep message channel open for async response
  }
});

// src/background/ebay-lister.js
class EbayLister {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null
    });
    this.page = await this.browser.newPage();
  }

  async createListing(productData) {
    try {
      await this.init();
      await this.page.goto('https://www.ebay.com/sl/sell');
      
      // Fill in listing details
      await this.fillBasicInfo(productData);
      await this.uploadImages(productData.images);
      await this.setPrice(productData.sellingPrice);
      await this.setupShipping();
      
      // Optional: auto-submit listing
      // await this.page.click('#submit-listing-button');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fillBasicInfo(data) {
    await this.page.type('#title', data.title);
    await this.page.type('#description', this.formatDescription(data));
    // Add category selection if needed
  }

  async uploadImages(images) {
    const imageInput = await this.page.$('input[type="file"]');
    for (const imageUrl of images) {
      const imageBuffer = await this.downloadImage(imageUrl);
      await imageInput.uploadFile(imageBuffer);
    }
  }

  async setPrice(price) {
    await this.page.type('#price', price.toString());
  }

  async setupShipping() {
    await this.page.click('#shipping-standard');
    await this.page.type('#shipping-cost', '0.00');
    await this.page.select('#handling-time', '20');
  }

  formatDescription(data) {
    return `
      ${data.description}
      
      Product Specifications:
      ${data.specifications.map(spec => `• ${spec.key}: ${spec.value}`).join('\n')}
      
      ✅ FREE Shipping
      ✅ Fast Delivery
      ✅ 30 Day Returns
      
      Note: Please allow 2-3 weeks for delivery.
    `;
  }

  async downloadImage(url) {
    const axios = require('axios');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }
}