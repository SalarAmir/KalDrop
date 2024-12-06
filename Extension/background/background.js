console.log("Background script")

// class StorageService {

// 	static get(key) {
// 		return new Promise((resolve) => {
// 			chrome.storage.local.get([key], function (result) {
// 				console.log(`${key}:`, result[key]);
// 				resolve(result[key]);
// 			});
// 		});
// 	}

// 	static set(key, value) {
// 		return new Promise((resolve) => {
// 			chrome.storage.local.set({ [key]: value }, function () {
// 				console.log(`${key} set to:`, value);
// 				resolve();
// 			});
// 		});
// 	}
// };


//communication with extension pages: popup, content
const actionToServiceMap = {
	// 'extractProduct':extractProductService,
	// 'listProduct':createListingService
};

// async function extractProductService(request) {
//     try {
        
//         const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//         const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
        
//         if (!response.success) {
//             throw new Error(response.error);
//         }
        
//         return response.data;
//     } catch (error) {
//         console.error('Extract Product Service Error:', error);
//         throw error;
//     }
// }


// async function createListingService(request) {
//     try {
//         // Perform eBay listing creation logic
//         const response = await chrome.tabs.sendMessage(request.tab.id, { 
//             action: 'listProduct', 
//             productData: request.productData 
//         });
        
//         if (!response.success) {
//             throw new Error(response.error);
//         }
        
//         return response.data;
//     } catch (error) {
//         console.error('Create Listing Service Error:', error);
//         throw error;
//     }
// }



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  	console.log('Message received:', request.action);

	if(!actionToServiceMap[request.action]){
		console.error('Unknown action:', request.action);
		sendResponse({ success: false, error: 'Unknown action' });
		return true;
	}

	actionToServiceMap[request.action](request)
	.then(response => {
		sendResponse({ success: true, data: response });
	})
	.catch(error => {
		console.error('Error:', error);
		sendResponse({ success: false, error: error.toString() });
	});
  	return true;
	
});