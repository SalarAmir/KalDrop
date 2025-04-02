console.log("Background script initialized");
import ProductService from "./productService.js";
import API from "./API.js";
import StorageService from "./storageService.js";
import {createListingService, saveProductService} from "./listingService.js";
import tabCommunication from "./tabCommunication.js";

//clear products:
// StorageService.remove('extractedProducts');
// StorageService.clearProducts().then(() => {
//     console.log('Storage cleared successfully.');
// }).catch((error) => {
//     console.error('Error clearing storage:', error);
// });
StorageService.get('extractedProducts').then((data)=>{
    console.log("[Background] Extracted products:", data);
})
class Auth{
    constructor(){
        this.frontendDomain = process.env.FRONTEND_DOMAIN;
        this.authCookieName = process.env.AUTH_COOKIE_NAME;
        if(!this.frontendDomain || !this.authCookieName){
            console.error('[Auth] Environment variables not found');
            console.error('[Auth] FRONTEND_DOMAIN:', this.frontendDomain);
            console.error('[Auth] AUTH_COOKIE_NAME:', this.authCookieName);
        }
        this.authState = {
            access_token: null,
            expires_at: null,
            user: null,
            subscribed: false
        };

        this.initAuth().then(() => {
            this.setupCookieListener();
        })
        
    }
    async initAuth(){

        const storedAuth = await StorageService.get('authState');
        if(storedAuth){
            this.authState = storedAuth;
            await this.checkSubscription();
            await StorageService.set('authState', this.authState);
            console.log('[initAuth] Stored auth state:', this.authState);
            return;
        }

        await this.checkCookie();
        
    }

    async checkCookie(){
        const cookies = await chrome.cookies.getAll({
            name: this.authCookieName,
            domain: this.frontendDomain
        });

        if (cookies.length === 0) {
            console.log('[checkCookie] No auth cookie found');
            await this.clearAuth();
            return;
        }

        const cookie = cookies[0];
        await this.processCookie(cookie);
    }

    async processCookie(cookie){
        try{
            const authObj = JSON.parse(decodeURIComponent(cookie.value));
            const {access_token, expires_at, user} = authObj;

            if(!access_token || !expires_at || !user){
                throw new Error('Invalid auth cookie format');
            }

            this.authState = {
                access_token,
                expires_at,
                user,
                subscribed: this.authState.subscribed
            }
            await StorageService.set('authState', this.authState);
            await this.checkSubscription();
            await StorageService.set('authState', this.authState);
        }
        catch(error){
            console.error('[processCookie] Error processing cookie:', error);
            await this.clearAuth();
        }
    }

    async checkSubscription() {
        try {
            const subscriptionResponse = await API.get('/user-subscription');
            this.authState.subscribed = subscriptionResponse.status === "active";
            // await StorageService.set('authState', this.authState);
        } catch (error) {
            console.error('[checkSubscription] Error checking subscription:', error);
            // Don't clear auth on subscription check failure
        }
    }

    async clearAuth() {
        this.authState = {
            access_token: null,
            expires_at: null,
            user: null,
            subscribed: false
        };
        await StorageService.remove('authState');
        console.log('[clearAuth] Cleared auth state');
    }

    setupCookieListener() {
        chrome.cookies.onChanged.addListener((changeInfo) => {
            if (changeInfo.cookie.domain !== this.frontendDomain) return;
            if (changeInfo.cookie.name !== this.authCookieName) return;

            if (changeInfo.removed) {
                console.log('[cookieListener] Auth cookie removed');
                this.clearAuth();
            } else {
                console.log('[cookieListener] Auth cookie changed');
                this.processCookie(changeInfo.cookie);
            }
        });
    }

    isTokenValid() {
        if (!this.authState.expires_at) return false;
        const now = Math.floor(Date.now() / 1000);
        return this.authState.expires_at > now;
    }

    async verifyToken(request=null){
        if(this.isTokenValid()){
            return {
                authenticated: true,
                subscribed: this.authState.subscribed,
            }
        }
        
        return {
            authenticated: false,
            subscribed: false,
        }
    }

    async getAuthState(){
        return {
            success: true,
            ...this.authState
        };
    }
}
const auth = new Auth();

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
    'getAuthState': (request) => auth.getAuthState(),
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