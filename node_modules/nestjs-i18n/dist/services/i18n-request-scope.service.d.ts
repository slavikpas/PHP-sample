import { I18nService, translateOptions } from './i18n.service';
export declare class I18nRequestScopeService {
    private readonly req;
    private readonly i18nService;
    constructor(req: any, i18nService: I18nService);
    translate(key: string, options?: translateOptions): Promise<any>;
    t(key: string, options?: translateOptions): Promise<any>;
}
