/** App base path from <base href> (e.g. /apps/roundtable-v1/). Empty when hosted at /. */
export function getAppBaseHref(): string {
  const href = document.querySelector('base')?.getAttribute('href') ?? '/';
  if (href === '/' || href === '') {
    return '';
  }

  return href.endsWith('/') ? href.slice(0, -1) : href;
}

/** Prefixes root-relative app paths so they work behind the portal edge proxy. */
export function resolveUnderAppBase(path: string): string {
  if (!path.startsWith('/')) {
    return path;
  }

  const base = getAppBaseHref();
  return base ? `${base}${path}` : path;
}
