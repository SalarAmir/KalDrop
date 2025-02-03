class Auth{
    constructor(){
        this.authenticated = false;
        this.subscribed = false;
    }
    async verifyAuth(){
        const access_token = await chrome.storage.local.get('access_token');
        if(!access_token){
            this.authenticated = false;
            this.redirectLogin();
            return this.authenticated;
        }
        console.log('access_token:', access_token);
        const response = await chrome.runtime.sendMessage({
            action: 'verifyAuth'
        });
        console.log('verify auth response:', response);
        if(!response.data.authenticated){
            this.authenticated = false;
            this.redirectLogin();
            return this.authenticated;
        }
        this.authenticated = true;

        if(!response.data.subscribed){
            this.subscribed = false;
            this.redirectSubscription();
            return this.subscribed;
        }
        this.subscribed = true;

        return this.authenticated;
    }

    redirectLogin(){
        window.location.href = 'popup_login.html';
    }

    redirectSubscription(){
        window.location.href = 'popup_subscribe.html';
    }
}
export const auth = new Auth();
(async () => {
    await auth.verifyAuth();
})();