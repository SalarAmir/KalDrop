export default class StorageService {
    static get(key) {
        console.log(`[StorageService.get] Fetching key: ${key}`);
        return new Promise((resolve) => {
            chrome.storage.local.get([key], function (result) {
                console.log(`[StorageService.get] Result for ${key}:`, result[key]);
                resolve(result[key]);
            });
        });
    }

    static set(key, value) {
        console.log(`[StorageService.set] Setting key: ${key} with value:`, value);
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, function () {
                console.log(`[StorageService.set] Successfully set ${key} to`, value);
                resolve();
            });
        });
    };

    static remove(key) {
        console.log(`[StorageService.remove] Removing key: ${key}`);
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, function () {
                console.log(`[StorageService.remove] Successfully removed ${key}`);
                resolve();
            });
        });
    };

    static async addProductToArray(product) {
        const products = await this.get('extractedProducts') || [];
        const isDuplicate = products.some(p => p.url === product.url);

        if (!isDuplicate) {
            products.push(product);
            await this.set('extractedProducts', products);
            await this.set('lastExtractedProduct', product);
            return true;
        };
        return false;
    };

    // static async appendToProductArray(products){
    //     const oldProducts = await this.get('extractedProducts') || [];
    //     //avoid duplicates:
    //     console.log('oldProducts:', products);
    //     const newProducts = products.filter(newProd => !oldProducts.some(oldProd => newProd.url === oldProd.url));
    //     console.log('newProducts:', newProducts);
    //     await this.set('extractedProducts', newProducts);
    // }

    static async getProductById(id) {
        console.log(`[StorageService.getProductById] Fetching product with id: ${id}`);
        const products = await this.get('extractedProducts') || [];
        return products.find(p => p.id === id);
    }

    static async getLatestProduct() {
        return await this.get('lastExtractedProduct');
    };
}
