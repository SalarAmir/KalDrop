export class AliExpressScraper {
  constructor() {
    this.productData = null;
  }

  async scrapeProduct() {
    console.log('Scraping product data...');
    try {
      const data = {
        title: this.getTitle(),
        description: this.getDescription(),
        price: this.getPrice(),
        originalPrice: this.getOriginalPrice(),
        discount: this.getDiscount(),
        images: this.getImages(),
        shipping: this.getShipping(),
        variants: this.getVariants(),
        rating: this.getRating(),
        reviews: this.getReviews(),
        soldCount: this.getSoldCount(),
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

  getTitle() {
    const titleElement = document.querySelector('[data-pl="product-title"]');
    if (!titleElement) throw new Error('Title not found');
    return titleElement.textContent.trim();
  }

  getDescription() {
    // AliExpress product pages typically don't show full description in the initial view
    return '';
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

  getImages() {
    const imageElements = document.querySelectorAll('.slider--item--FefNjlj img');
    return Array.from(imageElements).map(img => img.src).filter(Boolean);
  }

  getShipping() {
    // No specific shipping price element, assuming free or standard
    return {
      cost: 0,
      method: 'Standard',
      note: 'Tax excluded, add at checkout if applicable'
    };
  }

  getVariants() {
    const colorVariants = Array.from(document.querySelectorAll('.sku-item--image--jMUnnGA img')).map(img => ({
      type: 'Color',
      value: img.alt,
      image: img.src
    }));

    const sizeVariants = Array.from(document.querySelectorAll('.sku-item--text--hYfAukP span')).map(size => ({
      type: 'Size',
      value: size.textContent.trim()
    }));

    return {
      colors: colorVariants,
      sizes: sizeVariants
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

  calculateProfit(price, shippingCost) {
    const markup = 1.3; // 30% markup
    const ebayFee = 0.1; // 10% eBay fee
    const paypalFee = 0.029; // 2.9% PayPal fee

    const basePrice = price + shippingCost;
    const sellingPrice = basePrice * markup;
    const fees = (sellingPrice * ebayFee) + (sellingPrice * paypalFee);
    const profit = sellingPrice - basePrice - fees;

    return {
      sellingPrice: sellingPrice.toFixed(2),
      estimatedProfit: profit.toFixed(2),
      fees: fees.toFixed(2),
    };
  }
}
