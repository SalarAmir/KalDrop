export class AliExpressScraper {
  constructor() {
    this.productData = null;
  }

  async scrapeProduct() {
    console.log('Scraping product data...');
    try {
      const data = {
        url:this.getUrl(),
        title: this.getTitle(),
        descriptionImages: this.getDescriptionImages(),
        description: this.getDescription(),
        price: this.getPrice(),
        originalPrice: this.getOriginalPrice(),
        discount: this.getDiscount(),
        images: await this.getImages(),
        shipping: this.getShipping(),
        variants: this.getVariants(),
        rating: this.getRating(),
        reviews: this.getReviews(),
        soldCount: this.getSoldCount(),
        specifications: this.getSpecifications(),
      };

      const profitCalculation = this.calculateProfit(data.price, data.shipping.cost);
      this.productData = { ...data, ...profitCalculation };
      console.log('Scraped Product Data:', this.productData);
      return { success: true, data: this.productData };
    } catch (error) {
      console.error('Error scraping product data:', error);
      return { success: false, error: error.message };
    }
  }
  getUrl() {
    const fullUrl = window.location.href;
    const strippedUrl = fullUrl.split('?')[0];
    return strippedUrl;
  }
  getTitle() {
    let titleElement = document.querySelector('[data-pl="product-title"]');
    if (!titleElement) {
      titleElement = document.querySelector('.title--wrap--UUHae_g h1');
    }
    if (!titleElement) {
      const titleDiv = document.querySelector('.title--wrap--UUHae_g');
      if (titleDiv) {
      titleElement = titleDiv.querySelector('h1');
      }
    }
    if (!titleElement) throw new Error('Title not found');
    return titleElement.textContent.trim();
  }

  getDescriptionImages() {
    document.querySelector("a.comet-v2-anchor-link.comet-v2-anchor-link-active").click();

    const container = document.querySelector('#product-description') || document.querySelector('.detail-desc-decorate-richtext');
    if (!container) {
      console.error('Description container  not found.');
      return [];
    }

    const images = container.querySelectorAll('img');
    const imageUrls = Array.from(images) 
      .slice(0, 5)
      .map(img => img.src)
      .filter(Boolean);
    console.log('Description Images:', imageUrls);
    return imageUrls;
  }
  getDescription() {
    const container = document.querySelector('#product-description') || document.querySelector('.detail-desc-decorate-richtext');
    if (!container) {
      console.error('Description container  not found.');
      return '';
    }
    const description = container.innerText.trim();
    return description;

  }

  getPrice() {
    const priceElement = document.querySelector('.product-price-current .product-price-value');
    if (!priceElement) throw new Error('Price not found');
    return parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
  }

  getOriginalPrice() {
    const originalPriceElement = document.querySelector('.price--originalText--gxVO5_d');
    return originalPriceElement ? parseFloat(originalPriceElement.textContent.replace(/[^0-9.]/g, '')) : null;
  }

  getDiscount() {
    const discountElement = document.querySelector('.price--discount--Y9uG2LK');
    return discountElement ? discountElement.textContent.trim() : null;
  }

  async getImages() {
    //get slider buttons:
    const sliderElements = document.querySelectorAll('[class*="slider--item"] img');
    if (!sliderElements) console.error('Slider elements not found');
    const images = [];
    for (const sliderElement of sliderElements) {
      const moveoverEvent = new MouseEvent('mouseover',{
        bubbles: true,
        cancelable: true,
        view: window
      });
      sliderElement.dispatchEvent(moveoverEvent);
      await new Promise(resolve => setTimeout(resolve, 300));
      const [imageElement] = document.querySelectorAll('[class*="magnifier--image"]');
      if (!imageElement) {
        console.error('Image element not found');
        continue;
      }
      images.push(imageElement.src);
    }
    return images;
  }

  getShipping() {
    return {
      cost: 0,
      method: 'Standard',
      note: 'Tax excluded, add at checkout if applicable',
    };
  }

  getVariants() {
    const colorVariants = Array.from(document.querySelectorAll('.sku-item--image--jMUnnGA img')).map(img => ({
      type: 'Color',
      value: img.alt,
      image: img.src,
    }));

    const sizeVariants = Array.from(document.querySelectorAll('.sku-item--text--hYfAukP span')).map(size => ({
      type: 'Size',
      value: size.textContent.trim(),
    }));

    return {
      colors: colorVariants,
      sizes: sizeVariants,
    };
  }

  getRating() {
    const ratingElement = document.querySelector('.reviewer--rating--xrWWFzx strong');
    return ratingElement ? parseFloat(ratingElement.textContent.trim()) : null;
  }

  getReviews() {
    const reviewElement = document.querySelector('.reviewer--reviews--cx7Zs_V');
    return reviewElement ? parseInt(reviewElement.textContent.replace(/[^0-9]/g, '')) : 0;
  }

  getSoldCount() {
    const soldElement = document.querySelector('.reviewer--sold--ytPeoEy');
    return soldElement ? parseInt(soldElement.textContent.replace(/[^0-9]/g, '')) : 0;
  }

  getSpecifications() {
    const specList = document.querySelectorAll('.specification--prop--Jh28bKu');
    if (!specList) {
      return {}; // Return an empty object if no specifications are found
    }

    const specifications = {};

    specList.forEach(spec => {
      const titleElement = spec.querySelector('.specification--title--SfH3sA8 span');
      const valueElement = spec.querySelector('.specification--desc--Dxx6W0W span');

      if (titleElement && valueElement) {
        const key = titleElement.textContent.trim(); // Get the specification title
        const value = valueElement.textContent.trim(); // Get the corresponding value
        specifications[key] = value; // Store in the object
      }
    });

    return specifications;
  }

  calculateProfit(price, shippingCost) {
    const markup = 1.25; // 25% markup
    const ebayFee = 0.1; // 10% eBay fee
    const paypalFee = 0.029; // 2.9% PayPal fee

    const basePrice = price + shippingCost;
    const sellingPrice = basePrice * markup;
    const fees = (sellingPrice * ebayFee)  ;
    const profit = sellingPrice - basePrice - fees;

    return {
      sellingPrice: parseFloat(sellingPrice.toFixed(2)),
      estimatedProfit: parseFloat(profit.toFixed(2)),
      fees: parseFloat(fees.toFixed(2)),
    };
  }
}
