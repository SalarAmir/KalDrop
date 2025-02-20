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

export { ContentScriptError, ElementNotFoundError };