export const activityCopy = {
  ru: { title: 'Активность Kolosei', period: 'уникальные посетители по Cloudflare',
    window: 'За 30 завершённых дней · UTC', loading: 'Загрузка…', unavailable: 'Данные временно недоступны', noJs: 'Для счётчика нужен JavaScript',
    definition: 'Учёт по IP, включая автоматический трафик и проксируемые поддомены kolosei.com. Не число людей и не просмотры.',
    detail: 'Показатель Unique Visitors из HTTP-аналитики Cloudflare за 30 завершённых суток UTC, по методике источника. Не подтверждает индексацию. Кэш до 15 минут; текущие сутки не включены. ≈ обозначает округление числа.' },
  en: { title: 'Kolosei activity', period: 'unique visitors reported by Cloudflare',
    window: 'Over 30 complete days · UTC', loading: 'Loading…', unavailable: 'Data temporarily unavailable', noJs: 'The counter requires JavaScript',
    definition: 'IP-based, including automated traffic and proxied kolosei.com subdomains. Not a people or pageview count.',
    detail: 'Cloudflare HTTP Traffic Unique Visitors over 30 complete UTC days, using the source methodology. Not proof of indexing. Cached for up to 15 minutes; today is excluded. ≈ indicates a rounded number.' },
};

export function activityView(data, lang = 'en', now = Date.now()) {
  const copy = activityCopy[lang] ?? activityCopy.en;
  const start = Date.parse(data?.period?.start), end = Date.parse(data?.period?.end);
  const fetched = Date.parse(data?.fetchedAt), expiry = Date.parse(data?.expiresAt);
  const valid = data?.schemaVersion === 2 && data.state === 'available' &&
    data.source === 'cloudflare-http-traffic' && data.domain === 'kolosei.com' && data.scope === 'zone' &&
    data.metric === 'unique-visitors' && data.aggregation === 'source-period-aggregate' && data.periodKind === 'complete-utc-days' &&
    data.period?.days === 30 && data.period?.timeZone === 'UTC' && end - start === 30 * 86400000 &&
    start % 86400000 === 0 && end % 86400000 === 0 &&
    Number.isFinite(fetched) && fetched <= now + 60000 && end <= fetched && fetched - end < 86400000 &&
    expiry > now && expiry > fetched && expiry - fetched <= 900000 &&
    Number.isSafeInteger(data.uniqueVisitors) && data.uniqueVisitors >= 0;
  if (!valid) return { state: 'unavailable', value: copy.unavailable };
  const compact = data.uniqueVisitors >= 1000;
  const format = new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', compact ? { notation: 'compact', maximumFractionDigits: 2 } : {});
  return { state: 'available', value: `${compact ? '≈ ' : ''}${format.format(data.uniqueVisitors)}` };
}
