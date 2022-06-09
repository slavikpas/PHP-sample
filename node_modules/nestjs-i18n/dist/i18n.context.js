"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nContext = void 0;
class I18nContext {
    constructor(detectedLanguage, service) {
        this.detectedLanguage = detectedLanguage;
        this.service = service;
    }
    translate(key, options) {
        options = Object.assign({ lang: this.detectedLanguage }, options);
        return this.service.translate(key, options);
    }
    t(key, options) {
        return this.translate(key, options);
    }
}
exports.I18nContext = I18nContext;
//# sourceMappingURL=i18n.context.js.map