import API from './API.js';
import StorageService from './storageService.js';

export default class ProductService {
	static async extractProduct(request){
		try{
			console.log("[extractProductService] Request:", request);
			const added = await StorageService.addProductToArray(request.data);
			// const lastProd = await StorageService.getLatestProduct()	
			console.log("[extractProductService] Added:", added);
			if(added){

				await ProductService.saveProduct(request.data);
			}
			return {success:true, data:request.data}
		}
		catch(err){
			console.error("[extractProductService] error: ",err);
			return {success:false, data:request.data}
		}
	}
	static async saveProduct(product){
		try{
			console.log("[saveProductService] Request:", product);
			const response = await API.post('/products', product);
			return {success:true, data:response.data}
		}
		catch(err){
			console.error("[saveProductService] error: ",err);
			return {success:false, data:product}
		}
	}

}