export const activityCopy = {
  ru: { title: 'Активность Kolosei', period: 'просмотры за последние 30 дней', loading: 'Загрузка…', unavailable: 'Данные временно недоступны', noJs: 'Для счётчика нужен JavaScript',
    definition: 'Просмотры страниц kolosei.com по Cloudflare Web Analytics, без поддоменов и распознанных ботов. Не число людей. Обновление примерно каждые 15 минут; данные могут поступать с задержкой. Знак ≈ обозначает оценку по выборке.' },
  en: { title: 'Kolosei activity', period: 'pageviews in the last 30 days', loading: 'Loading…', unavailable: 'Data temporarily unavailable', noJs: 'The counter requires JavaScript',
    definition: 'Pageviews on kolosei.com from Cloudflare Web Analytics, excluding subdomains and recognized bots. Not a people count. Refreshes approximately every 15 minutes; ingestion may be delayed. ≈ indicates a sampled estimate.' },
};

export function activityView(data, lang = 'en', now = Date.now()) {
  const copy = activityCopy[lang] ?? activityCopy.en;
  const start = Date.parse(data?.period?.start);
  const end = Date.parse(data?.period?.end);
  const fetched = Date.parse(data?.fetchedAt);
  const expiry = Date.parse(data?.expiresAt);
  const valid = data?.schemaVersion === 1 && data.state === 'available' &&
    data.source === 'cloudflare-web-analytics' && data.hostname === 'kolosei.com' &&
    data.period?.days === 30 && data.period?.timeZone === 'UTC' && end - start === 30 * 86400000 &&
    Number.isFinite(fetched) && fetched <= now + 60000 && end <= fetched && fetched - end <= 1200000 &&
    expiry > now && expiry - fetched <= 900000 && expiry > fetched &&
    Number.isSafeInteger(data.pageviews) && data.pageviews >= 0 && typeof data.estimated === 'boolean';
  if (!valid) return { state: 'unavailable', value: copy.unavailable };
  return { state: 'available', value: `${data.estimated ? '≈ ' : ''}${new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US').format(data.pageviews)}` };
}
