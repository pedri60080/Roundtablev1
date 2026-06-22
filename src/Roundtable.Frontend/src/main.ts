import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error('Bootstrap failed:', err);
  document.body.innerHTML = `<pre style="padding:1rem;color:red;white-space:pre-wrap;">Bootstrap failed: ${err instanceof Error ? err.message : String(err)}\n\n${err instanceof Error && err.stack ? err.stack : ''}</pre>`;
});
