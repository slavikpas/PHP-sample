import { DynamicModule } from '@nestjs/common';
import { I18nService } from './services/i18n.service';
import { I18nAsyncOptions, I18nOptions } from './interfaces/i18n-options.interface';
import { OnModuleInit } from '@nestjs/common/interfaces';
export declare class I18nModule implements OnModuleInit {
    private readonly i18n;
    constructor(i18n: I18nService);
    onModuleInit(): Promise<void>;
    static forRoot(options: I18nOptions): DynamicModule;
    static forRootAsync(options: I18nAsyncOptions): DynamicModule;
    private static createAsyncOptionsProvider;
    private static createAsyncParserOptionsProvider;
    private static createAsyncTranslationProvider;
    private static createAsyncLanguagesProvider;
    private static sanitizeI18nOptions;
    private static createResolverProviders;
}
