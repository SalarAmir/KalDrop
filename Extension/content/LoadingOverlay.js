export class LoadingOverlay {
    constructor() {
        this.overlay = null;
        this.messageTimer = null;
        this.initialize();
    }

    initialize() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'listing-overlay';
        
        // Create loading spinner and message
        const content = document.createElement('div');
        content.className = 'listing-overlay-content';
        content.innerHTML = `
            <div class="listing-spinner"></div>
            <div class="listing-message">Processing listing...</div>
        `;
        
        this.overlay.appendChild(content);
        const styles = document.createElement('style');
        styles.textContent = `
            .listing-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1000000;
            }
            
            .listing-overlay-content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
            }
            
            .listing-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            .listing-message {
                color: #333;
                font-size: 18px;
                font-weight: bold;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(styles);
    }

    show(message = 'Processing listing...') {
        if (!document.body.contains(this.overlay)) {
            document.body.appendChild(this.overlay);
        }
        this.overlay.querySelector('.listing-message').textContent = message;
        this.overlay.style.display = 'flex';
        
        // Clear any existing timer
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
        }
        
        // Set reassurance message after a delay
        this.messageTimer = setTimeout(() => {
            this.updateMessage('Don\'t worry, this may take a moment...');
        }, 5000); // 10 seconds
    }

    hide() {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }
        this.overlay.style.display = 'none';
    }

    updateMessage(message) {
        this.overlay.querySelector('.listing-message').textContent = message;
    }
}