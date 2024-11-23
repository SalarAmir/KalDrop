class AliExpressScraper {
    constructor() {
      this.productData = null;
    }
  
    async scrapeProduct() {
      try {
        const data = {
          title: this.getTitle(),
          description: this.getDescription(),
          price: this.getPrice(),
          images: this.getImages(),
          shipping: this.getShipping(),
          variants: this.getVariants(),
          specifications: this.getSpecifications()
        };
  
        const profitCalculation = this.calculateProfit(data.price, data.shipping.cost);
        this.productData = { ...data, ...profitCalculation };
        
        return { success: true, data: this.productData };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  
    getTitle() {
      const titleElement = document.querySelector('.product-title-text');
      if (!titleElement) throw new Error('Title not found');
      return titleElement.textContent.trim();
    }
  
    getDescription() {
      const descElement = document.querySelector('.product-description');
      return descElement ? descElement.innerHTML : '';
    }
  
    getPrice() {
      const priceElement = document.querySelector('.product-price-value');
      if (!priceElement) throw new Error('Price not found');
      return parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
    }
  
    getImages() {
      const images = Array.from(document.querySelectorAll('.images-view-item img'));
      return images.map(img => img.src).filter(Boolean);
    }
  
    getShipping() {
      const shippingElement = document.querySelector('.product-shipping-price');
      return {
        cost: shippingElement ? parseFloat(shippingElement.textContent.replace(/[^0-9.]/g, '')) : 0,
        method: 'Standard'
      };
    }
  
    getVariants() {
      const variantElements = document.querySelectorAll('.sku-property-item');
      return Array.from(variantElements).map(element => ({
        name: element.querySelector('.sku-title')?.textContent.trim(),
        value: element.querySelector('.sku-value')?.textContent.trim(),
        price: element.querySelector('.sku-price')?.textContent.trim()
      }));
    }
  
    getSpecifications() {
      const specElements = document.querySelectorAll('.product-specs-item');
      return Array.from(specElements).map(element => ({
        key: element.querySelector('.specs-key')?.textContent.trim(),
        value: element.querySelector('.specs-value')?.textContent.trim()
      }));
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
        fees: fees.toFixed(2)
      };
    }
  }