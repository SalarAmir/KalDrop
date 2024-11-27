export class BackgroundCommunication{
    static sendMessage(action, data) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action, ...data }, response => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(response.error);
                }
            });
        });
    }
}