import { HttpInterceptorFn } from '@angular/common/http';
import { resolveUnderAppBase } from './app-base-url';

/** Rewrites /api/* requests to include the deployed sub-path (e.g. /apps/roundtable-v1/). */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    return next(req.clone({ url: resolveUnderAppBase(req.url) }));
  }

  return next(req);
};
