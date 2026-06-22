import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { routes } from './app.routes';
import { DemoVersionSettingsService } from './demo-version-settings.service';

export function demoSettingsInitializer(demo: DemoVersionSettingsService) {
  return () => demo.loadFromServer();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    HighContrastModeDetector,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: APP_INITIALIZER,
      useFactory: demoSettingsInitializer,
      deps: [DemoVersionSettingsService],
      multi: true,
    },
  ],
};
