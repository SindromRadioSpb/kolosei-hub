import { facts } from './linguistpro';
const site = 'https://kolosei.com';
export function structuredData({ title, description, path, lang, product = false }: { title: string; description: string; path: string; lang: string; product?: boolean }) {
  const url = site + path;
  const graph: Record<string, unknown>[] = [
    { '@type': 'Organization', '@id': site + '/#organization', name: 'Kolosei', url: site + '/', logo: site + '/favicon.svg', email: 'peter@kolosei.com', founder: { '@id': site + '/#founder' }, sameAs: ['https://github.com/SindromRadioSpb'] },
    { '@type': 'Person', '@id': site + '/#founder', name: 'Peter Kolosei', url: site + '/about/', sameAs: ['https://github.com/SindromRadioSpb'] },
    { '@type': 'WebSite', '@id': site + '/#website', name: 'Kolosei', alternateName: 'Kolosei — LinguistPro', url: site + '/', publisher: { '@id': site + '/#organization' }, inLanguage: ['en', 'ru'] },
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: lang, isPartOf: { '@id': site + '/#website' }, publisher: { '@id': site + '/#organization' }, ...(product ? { about: { '@id': site + '/#linguistpro' } } : {}) },
  ];
  if (product) graph.push({ '@type': 'SoftwareApplication', '@id': site + '/#linguistpro', name: 'LinguistPro', alternateName: 'LinguistPro by Kolosei', url: facts.studio, description: facts.summary[lang as 'en' | 'ru'], applicationCategory: 'EducationalApplication', operatingSystem: 'Web browser', publisher: { '@id': site + '/#organization' }, featureList: ['Hebrew study tables', 'Niqqud and Russian translation', 'Contextual word review with FSRS-6', 'Studio and Reading Room'], sameAs: [facts.repository] });
  if (path !== '/' && path !== '/ru/') {
    const localizedHome = lang === 'ru' ? '/ru/' : '/';
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Kolosei', item: site + localizedHome },
      ...(path.includes('/products/') ? [{ '@type': 'ListItem', position: 2, name: lang === 'ru' ? 'Продукты' : 'Products', item: site + (lang === 'ru' ? '/ru' : '') + '/products/' }] : []),
      { '@type': 'ListItem', position: path.includes('/products/') ? 3 : 2, name: title, item: url },
    ] });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
