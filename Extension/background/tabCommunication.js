export default class tabCommunication {
    static async sendMessage(tabId, message) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, message);
            if (!response) {
                throw new ContentScriptError('No response from content script');
            }
            if (!response.success) {
                if (response.error && response.error.includes('Element not found')) {
                    throw new ElementNotFoundError(message.selector);
                }
                throw new Error(response.error || 'Content script failed to process message');
            }
            return response;
        } catch (error) {
            if (error.message.includes('Receiving end does not exist')) {
                throw new ContentScriptError('Content script not loaded');
            }
            throw error; // Re-throw other errors
        }
    }

    static async sendMessageRetries(tabId, message, maxRetries = 5, retryDelay = 2000) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.sendMessage(tabId, message);
            } catch (error) {
                const isLastAttempt = attempt >= maxRetries;
                const errorType = error instanceof ContentScriptError ? 'Content Script Error' :
                                error instanceof ElementNotFoundError ? 'Element Not Found' :
                                'Unknown Error';
                
                console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed - ${errorType}:`, error.message);

                if (isLastAttempt) {
                    return { success: false, error: error };
                }

                // Only retry for if not element not found error
                if (error instanceof ElementNotFoundError) {
                    return { success: false, error: error };
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    static async sendMessageWaitReload(tabId, message){
        waitingForReload = true;
        const startTime = Date.now();
        await Promise.race([
            new Promise(resolve => setTimeout(resolve, 60000)),
            new Promise(resolve => {
                const checkFlag = setInterval(() => {
                    if(!waitingForReload){
                        clearInterval(checkFlag);
                        resolve();
                    }
                }, 100);
            })
                
        ]);
        waitingForReload = false;
        console.log('[sendMessageWaitReload] Waiting for reload resolved:', Date.now() - startTime);
        return await this.sendMessage(tabId, message);
        
    }
    static async waitForReload(){
        waitingForReload = true;
        const startTime = Date.now();
        await Promise.race([
            new Promise(resolve => setTimeout(resolve, 60000)),
            new Promise(resolve => {
                const checkFlag = setInterval(() => {
                    if(!waitingForReload){
                        clearInterval(checkFlag);
                        resolve();
                    }
                }, 100);
            })
                
        ]);
        waitingForReload = false;
        console.log('[waitForReload] Waiting for reload resolved:', Date.now() - startTime);
        return true;
    }
    static async handleReload(request){
        /*
        request:{
            action: 'contentLoaded',
            data: ''
        }   
        */

       let message = '';
       let currentlyListing = currentListingService !== undefined;
        console.log('[resolveHandleReload] Request:', request);
        if(waitingForReload){
            // console.log('[resolveHandleReload] Waiting for reload:', request);
            message = 'no longer waiting for reload';
        }else{
            // waitingForReload = true;
            message = 'wasnt waiting for reload';
        }
        waitingForReload = false;
        return {success:true, message, currentlyListing};

    }
}