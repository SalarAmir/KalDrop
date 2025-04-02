class Auth{
    constructor(){
        this.authenticated = false;
        this.subscribed = false;
    }
    async verifyAuth(){
        try{
            const {authState} = await chrome.storage.local.get('authState');
            console.log('Auth state:', authState);
            if(!authState || !authState.access_token){
                console.log('No auth state found', authState);
                this.authenticated = false;
                this.redirectLogin();
                return false;
            }
            
            const currentTime = Math.floor(Date.now() / 1000);
            if(authState.expires_at < currentTime){
                console.log('Token expired');
                this.authenticated = false;
                this.redirectLogin();
                return false;
            }

            //token is valid:
            this.authenticated = true;
            this.subscribed = authState.subscribed;
            this.user = authState.user;

            if(!this.subscribed){
                console.log('User not subscribed');
                this.redirectSubscription();
                return false;
            }
            return true;
        }
        catch(error){
            console.error('Error verifying auth:', error);
            this.authenticated = false;
            this.redirectLogin();
            return false;
        }
    }

    redirectLogin(){
        window.location.href = 'popup_login.html';
    }

    redirectSubscription(){
        window.location.href = 'popup_subscribe.html';
    }
}
console.log('Auth script loaded');
export const auth = new Auth();
(async () => {
    await auth.verifyAuth();
})();