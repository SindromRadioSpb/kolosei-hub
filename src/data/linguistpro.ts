/** Reviewed public facts. All public projections import this file; update only after source checks. */
export const facts = {
  reviewed: '2026-09-08',
  productSource: 'f9b8eb954d22c3c53f13e88e3e988045b3201320',
  name: 'LinguistPro',
  publisher: 'Kolosei',
  studio: 'https://linguistpro.kolosei.com/',
  room: 'https://linguistpro.kolosei.com/library.html',
  repository: 'https://github.com/SindromRadioSpb/tts-prototype-android',
  catalogSource: 'https://linguistpro.kolosei.com/data/benyehuda/corpus-catalog-v7.json',
  publicationSource: 'https://linguistpro.kolosei.com/api/public-corpora',
  catalogued: 26455,
  prepared: 796,
  agentAccess: 'owner-pilot',
  publicMcpSignup: false,
  summary: {
    en: 'LinguistPro is a Hebrew learning workspace by Kolosei. The Studio turns your own sources into bilingual study materials. The Reading Room offers literature, songs and technical problem books, with word explanations and contextual review.',
    ru: 'LinguistPro — среда для изучения иврита от Kolosei. Студия превращает ваши источники в двуязычные учебные материалы. Читальный зал предлагает литературу, песни и технические задачники с разбором слов и повторением в контексте.',
  },
  boundaries: {
    en: 'The core workspace stores learning data in the browser. Cloud processing requires the selected provider and credentials; optional account sync and connected agents have separate consent. Prepared catalog entries do not guarantee every enrichment or audio asset. MCP remains an authenticated owner pilot; public reference files do not grant tool access or redistribution rights.',
    ru: 'Основная учебная база хранится в браузере. Для облачной обработки нужны выбранный провайдер и ключ; синхронизация и подключённые агенты требуют отдельного согласия. Подготовленная запись каталога не гарантирует наличие всех обогащений и аудио. MCP остаётся авторизованным владельческим пилотом; публичная справка не даёт доступа к инструментам или прав на распространение материалов.',
  },
} as const;

export const corpora = [
  { slug: 'study-songs', count: 77, edition: 'ed_016c8b8a2bd06dd389bd9118',
    title: { en: 'Study Songs', ru: 'Учебные песни' },
    kind: { en: 'songs', ru: 'песен' },
    description: { en: 'Read the lyrics, reveal the Russian translation and listen to the original recording. Keep new words connected to the song.', ru: 'Читайте текст, открывайте русский перевод и слушайте оригинальную запись. Сохраняйте новые слова вместе с контекстом песни.' },
    guide: 'hebrew-through-songs', mark: 'שיר' },
  { slug: 'physics-year1-problems', count: 74, edition: 'ed_c345975244ff7bd33d86fcb9',
    title: { en: 'Physics, year one', ru: 'Физика, первый год' },
    kind: { en: 'problems', ru: 'задачи' },
    description: { en: 'Understand the Hebrew condition, check a reviewed answer, then follow the complete worked solution. Source PDFs stay attached.', ru: 'Разберите условие на иврите, проверьте ответ и изучите полное решение. Исходные PDF доступны рядом с задачей.' },
    guide: 'technical-hebrew', mark: 'F = ma' },
  { slug: 'materials-science-year1-problem-book-2', count: 60, edition: 'ed_336ad34ad1d41dc58bc8124b',
    title: { en: 'Materials science', ru: 'Материаловедение' },
    kind: { en: 'problems', ru: 'задач' },
    description: { en: 'Study technical vocabulary through bilingual conditions and separate exam-format solutions, with published Hebrew and Russian audio.', ru: 'Изучайте техническую лексику на двуязычных условиях и отдельных экзаменационных решениях, с опубликованной озвучкой на иврите и русском.' },
    guide: 'technical-hebrew', mark: 'σ = F/A' },
] as const;

export const capabilities = [
  { id: 'import', title: { en: 'Bring your own material', ru: 'Ваш материал становится учебным' }, text: { en: 'Import text, articles, DOCX, PDF, images, audio, video or VTT/SRT captions. OCR and transcription depend on the selected processing route; cloud routes use your provider key.', ru: 'Добавляйте текст, статьи, DOCX, PDF, изображения, аудио, видео и субтитры VTT/SRT. Распознавание зависит от выбранного способа обработки; облачным сервисам нужен ваш ключ.' } },
  { id: 'reading', title: { en: 'Read with the help you need', ru: 'Читайте с нужной вам поддержкой' }, text: { en: 'Aligned Hebrew, niqqud, transliteration and Russian translation let you move between the original and its meaning. Prepared audio and reliable media timing support listening alongside the text.', ru: 'Иврит, огласовки, транслитерация и русский перевод выстроены построчно. Подготовленная озвучка и надёжная привязка медиа помогают слушать одновременно с чтением.' } },
  { id: 'morphology', title: { en: 'See how a word works', ru: 'Понимайте устройство слова' }, text: { en: 'Tap for word meaning, root, binyan and inflection where the analysis supports them. Source labels and alternatives keep uncertain readings visible; the offline dictionary contains 9,279 paradigms.', ru: 'Нажмите на слово, чтобы увидеть значение, корень, биньян и формы, когда они подтверждены анализом. Источники и альтернативы показывают неоднозначность; офлайн-словарь содержит 9 279 парадигм.' } },
  { id: 'review', title: { en: 'Remember it in context', ru: 'Запоминайте в контексте' }, text: { en: 'Studio and Reading Room share personal word notes and FSRS-6 review. Saved words return with their source sentences. Anki export and review read-back are optional companion workflows.', ru: 'Студия и Зал используют общие заметки слов и повторение FSRS-6. Сохранённые слова возвращаются с исходными предложениями. Экспорт в Anki и чтение результатов повторения — дополнительные возможности.' } },
  { id: 'discovery', title: { en: 'Find your next text', ru: 'Находите следующий текст' }, text: { en: 'Search and filter collections, resume reading and sort supported materials by recorded vocabulary familiarity. That percentage reflects recorded word knowledge, not a test of comprehension.', ru: 'Ищите и фильтруйте коллекции, продолжайте чтение и сортируйте поддерживаемые материалы по знакомой лексике. Процент отражает записанное знание слов, а не результат проверки понимания.' } },
  { id: 'export', title: { en: 'Keep your study materials', ru: 'Сохраняйте учебные материалы' }, text: { en: 'Export portable learning packages or derived Markdown materials for Obsidian, with context, reference forms and available audio. LinguistPro remains the source for morphology decisions and review scheduling.', ru: 'Экспортируйте переносимые учебные пакеты или материалы Markdown для Obsidian: контекст, справочные формы и доступное аудио. Решения по морфологии и расписание повторений остаются в LinguistPro.' } },
] as const;

export const faqs = [
  { q: { en: 'Where should I start?', ru: 'С чего начать?' }, a: { en: 'Open the Reading Room if you want a prepared text or song. Open the Studio if you already have an article, document or recording you want to understand. Both use the same word notes and review system.', ru: 'Откройте Читальный зал, если хотите готовый текст или песню. Выберите Студию, если у вас уже есть статья, документ или запись. Заметки слов и система повторения у них общие.' } },
  { q: { en: 'Do I need an API key?', ru: 'Нужен ли мне API-ключ?' }, a: { en: 'You do not need your own provider key to browse published collections or read their prepared text and available cached audio. Creating new translations, OCR, transcription or fresh cloud audio can require your own key and provider charges. Availability is shown in the app.', ru: 'Для просмотра открытых коллекций, подготовленных текстов и доступного готового аудио собственный ключ провайдера не нужен. Новый перевод, OCR, распознавание речи или новая облачная озвучка могут требовать ваш ключ и оплату провайдеру. Доступность показана в приложении.' } },
  { q: { en: 'Can a beginner use it?', ru: 'Подойдёт ли начинающему?' }, a: { en: 'Niqqud, transliteration and Russian translation help with early reading. Start with short prepared material. Literary texts vary in period and difficulty; the whole catalog is not a beginner course. The Studio can create a separate A1–B2 retelling of a source.', ru: 'Огласовки, транслитерация и русский перевод помогают на первых шагах. Начните с короткого подготовленного материала. Литературные тексты различаются эпохой и сложностью; весь каталог не является курсом для начинающих. В Студии можно создать отдельный пересказ источника уровня A1–B2.' } },
  { q: { en: 'What works offline?', ru: 'Что работает без интернета?' }, a: { en: 'Previously loaded material, the installed offline dictionary and local study data support offline work. First downloads, uncached media, cloud generation, account sync and external assistants need a connection. Export backups before clearing browser data.', ru: 'Ранее загруженные материалы, установленный офлайн-словарь и локальная учебная база поддерживают работу без интернета. Первая загрузка, несохранённые медиа, облачная генерация, синхронизация и внешние ассистенты требуют сети. Перед очисткой данных браузера экспортируйте резервную копию.' } },
  { q: { en: 'Can I connect ChatGPT, Gemini or Claude?', ru: 'Можно ли подключить ChatGPT, Gemini или Claude?' }, a: { en: 'Web-enabled assistants can read the public website and its reference files. Direct access to LinguistPro tools over OAuth/MCP is a separate authenticated owner pilot. Public self-service connection and compatibility with every assistant are not announced.', ru: 'Ассистенты с веб-доступом могут читать открытый сайт и справочные файлы. Прямой доступ к инструментам LinguistPro через OAuth/MCP — отдельный авторизованный владельческий пилот. Общедоступное подключение и совместимость со всеми ассистентами не объявлены.' } },
] as const;

export const corpusUrl = (slug: string) => `${facts.room}?public_corpus=${slug}`;
export function localPath(lang: string, path: string) {
  const [pathname, hash] = path.split('#');
  const normalized = pathname.replace(/\/$/, '') + '/';
  return (lang === 'ru' ? '/ru' : '') + normalized + (hash ? '#' + hash : '');
}
