import { I18nService, translateOptions } from './services/i18n.service';
export declare class I18nContext {
    readonly detectedLanguage: string;
    private readonly service;
    constructor(detectedLanguage: string, service: I18nService);
    translate(key: string, options?: translateOptions): Promise<any>;
    t(key: string, options?: translateOptions): Promise<any>;
}
