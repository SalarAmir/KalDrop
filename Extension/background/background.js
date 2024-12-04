class StorageService {
	static get(key) {
		return new Promise((resolve) => {
			chrome.storage.local.get([key], function (result) {
				console.log(`${key}:`, result[key]);
				resolve(result[key]);
			});
		});
	}

	static set(key, value) {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [key]: value }, function () {
				console.log(`${key} set to:`, value);
				resolve();
			});
		});
	}
};


//communication with extension pages: popup, content
const actionToServiceMap = {
	// 'signup': UserService.signup,
	// 'login': UserService.login,
	// 'getLoggedInEmail': UserService.getLoggedInEmail,
	// 'checkLogin':UserService.checkLogin,
	// 'getCart': CartService.get,
	// 'addToCart': CartService.addToCart,
	// 'removeFromCart': CartService.removeFromCart,
	// 'submitOrder': CartService.submitOrder,
};

//
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