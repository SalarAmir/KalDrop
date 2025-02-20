import API from './API.js';
import StorageService from './storageService.js';
import { createListingService } from './listingService.js';


export default class ProductService {
	static async extractProduct(request){
		try{
			console.log("[extractProductService] Request:", request);
			await StorageService.addProductToArray(request.data);
			
			// const lastProd = await StorageService.getLatestProduct()	
			// console.log("[extractProductService] Added:", added);
			// if(added){

			// 	await ProductService.saveProduct(request.data);
			// }

			//initiating listing service:
			await createListingService({action:'listProduct'});
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
	static async getProducts(request){
		try{
			const data = await API.get('/products');
			console.log("[getProductsService] api resp:", data);
			// await StorageService.appendToProductArray(data);
			await StorageService.set('extractedProducts', data);
			return {success:true, data}
		}
		catch(err){
			console.error("[getProductsService] error: ",err);
			return {success:false, data:[]}
		}
	};

	static async getProduct(request){
		/*
			request = {
				action: 'getProduct',
				id: 
			}
		*/
		try{
			const product = await StorageService.getProductById(request.id);
			console.log("[getProductService] product:", product);
			return {success:true, data:product}
		}
		catch(err){
			console.error("[getProductService] error: ",err);
			return {success:false, data:{}}
		}
	};

	static async updateProduct(request){
		/*
			request = {
				action: 'updateProduct',
				id: 
				data: 
			}
		*/
		try{
			console.log("[updateProductService] Request:", request);
			const response = await API.put(`/products/${request.id}`, request.product);
			console.log("[updateProductService] response:", response);
			return {success:true, data:response.data}
		}
		catch(err){
			console.error("[updateProductService] error: ",err);
			return {success:false, data:request.data}
		}
	};
}