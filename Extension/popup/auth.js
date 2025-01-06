class Auth{
    constructor(){
        this.authenticated = false;
    }
    async verifyAuth(){
        const access_token = await chrome.storage.local.get('access_token');
        if(!access_token){
            this.authenticated = false;
            this.redirectLogin();
            return this.authenticated;
        }
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
        return this.authenticated;
    }

    redirectLogin(){
        window.location.href = 'popup_login.html';
    }
}
export const auth = new Auth();
(async () => {
    await auth.verifyAuth();
})();