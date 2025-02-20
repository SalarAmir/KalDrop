console.log("Background script initialized");
import ProductService from "./productService.js";
import API from "./API.js";
import StorageService from "./storageService.js";
import {createListingService, saveProductService} from "./listingService.js";
import tabCommunication from "./tabCommunication.js";

//clear products:
// StorageService.remove('extractedProducts');

class Auth{
    constructor(){
        this.frontendDomain = process.env.FRONTEND_DOMAIN;
        this.authCookieName = process.env.AUTH_COOKIE_NAME;
        if(!this.frontendDomain || !this.authCookieName){
            console.error('[Auth] Environment variables not found');
            console.error('[Auth] FRONTEND_DOMAIN:', this.frontendDomain);
            console.error('[Auth] AUTH_COOKIE_NAME:', this.authCookieName);
        }
        this.access_token = null
        this.logged_in = false
        this.subscribed = false

        this.initAuth().then(async () => {
            await this.verifyToken();
        })
        
    }
    async initAuth(){
        const cookies = await chrome.cookies.getAll({
            name:this.authCookieName,
            domain:this.frontendDomain
        });
        if(cookies.length === 0){
            console.log('[initAuth] No auth cookie found.');
            return;
        }

        //convert to json obj:
        const authObj = JSON.parse(decodeURIComponent(cookies[0].value));
        console.log('[initAuth] Auth cookie found:', authObj);
        // const authObj = decodeURIComponent(cookies[0].value);
        const {access_token} = authObj;
        console.log('[initAuth] Logged in user found:',authObj.user.email);
        await StorageService.set('access_token', access_token);
        this.access_token = access_token;
        
    }

    async verifyToken(request=null){
        const response = await API.get('/verify');
        const subscriptionResponse = await API.get('/user-subscription');
        const subscribed = subscriptionResponse.status === "active";
        console.log('[verifyToken] Response:', response);
        if(response.message !== "Authenticated"){
            console.error('[verifyToken] Unauthorized. Clearing auth token.');
            await StorageService.remove('access_token');
            return {authenticated:false, subscribed};
        }
        return {authenticated:true, subscribed};

    }

    //callback:
    async cookieChanged(changeInfo){
        if(changeInfo.cookie.domain !== this.frontendDomain) return;
        if(changeInfo.cookie.name !== this.authCookieName) return;
        if(changeInfo.removed){
            console.log('[onCookieChanged] Auth cookie removed. Clearing local storage.');
            await StorageService.remove('access_token');
            return;
        }
    
        const {access_token:cookieToken} = JSON.parse(decodeURIComponent(changeInfo.cookie.value));
        const currentToken = await StorageService.get('access_token');
        // const umm = await supabase.auth.getUser(cookieToken);
        if(!currentToken){
            console.log('[onCookieChanged] No current token found. Setting local storage.');
            await StorageService.set('access_token', cookieToken);
        }
        if(currentToken !== cookieToken){
            console.log('[onCookieChanged] Token changed. Updating local storage.');
            await StorageService.set('access_token', cookieToken);
        }
    }
}
const auth = new Auth();
// auth.initAuth();
chrome.cookies.onChanged.addListener((changeInfo)=>auth.cookieChanged(changeInfo));



class ContentScriptError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContentScriptError';
    }
}

class ElementNotFoundError extends Error {
    constructor(selector) {
        super(`Element not found: ${selector}`);
        this.name = 'ElementNotFoundError';
        this.selector = selector;
    }
}

// Communication services:

// Action to service mapping
const actionToServiceMap = {
    'getProduct': (request) => ProductService.getProduct(request),
    'getAllProducts': (request) => ProductService.getProducts(request),
    'extractProduct': (request) => ProductService.extractProduct(request),
    'updateProduct': (request) => ProductService.updateProduct(request),
    'listProduct': createListingService,
    'saveProduct': saveProductService,
    'verifyAuth': (request) => auth.verifyToken(request),
    'contentLoaded': (request) => tabCommunication.handleReload(request),
};

// Debugging helper to log all available actions
console.log('Available actions in actionToServiceMap:', Object.keys(actionToServiceMap));

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[onMessage] Received message:', request);

    const action = request.action;
    // console.log('[onMessage] Action received:', action);

    if (!actionToServiceMap[action]) {
        console.error('[onMessage] Unknown action received:', action);
        sendResponse({ success: false, error: 'Unknown action' });
        return true;
    }

    console.log(`[onMessage] Processing action: ${action}`);
    actionToServiceMap[action](request)
        .then(response => {
            console.log(`[onMessage] Action ${action} processed successfully, response:`, response);
            sendResponse({ success: true, data: response });
        })
        .catch(error => {
            console.error(`[onMessage] Error processing action ${action}:`, error);
            sendResponse({
                success: false,
                error: error.toString()
            });
        });

    return true; // Allow asynchronous response
});