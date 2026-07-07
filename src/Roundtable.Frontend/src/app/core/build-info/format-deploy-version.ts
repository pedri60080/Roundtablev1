const DEPLOY_VERSION_RE = /^(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})$/;

export function formatDeployVersion(raw: string, locale = 'nl-NL'): string {
  if (raw === '__DEPLOY_VERSION__') {
    return raw;
  }

  const match = DEPLOY_VERSION_RE.exec(raw);
  if (!match) {
    return raw;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4];
  const minute = match[5];
  const second = match[6];
  const date = new Date(year, month - 1, day, Number(hour), Number(minute), Number(second));

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(date);

  const dayPart = parts.find((part) => part.type === 'day')?.value ?? String(day);
  const monthPart = parts.find((part) => part.type === 'month')?.value ?? String(month);
  const yearPart = parts.find((part) => part.type === 'year')?.value ?? String(year);

  return `${dayPart} ${monthPart} ${yearPart} - ${hour}:${minute}:${second}`;
}
