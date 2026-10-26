// Facts for the Instructor for SOLIDWORKS pages. Numbers come from the project repository
// (docs/course/README.md, docs/course/robot-report.md, web/lesson.json); update them together with `reviewed`.
export const instructor = {
  reviewed: '2026-10-26',
  lessonPage: '/products/solidworks-instructor/bolt-m8x40',
  player: '/play/solidworks-instructor/bolt-m8x40/',
  img: {
    addin: '/img/solidworks-instructor/addin-panel.webp',
    final: '/img/solidworks-instructor/bolt-final.webp',
    step: '/img/solidworks-instructor/bolt-step.webp',
  },
  bolt: { steps: 71, blocks: 6, sw: 'SOLIDWORKS 2026 SP4.1' },
  course: { lessons: 175, steps: 1312, checked: 532 },
  robot: { ok: 342, show: 734, manual: 144, fail: 1 },
  changelogRu: [
    { date: '2026-10-26', text: 'Урок «Болт М8×40» переснят в SOLIDWORKS 2026 SP4.1 на чистой модели и опубликован как веб-урок.' },
    { date: '2026-10-25', text: 'Надстройка на C# внутри SOLIDWORKS; генератор уроков и робот-ученик; 175 черновых уроков курса для начинающих.' },
    { date: '2026-10-24', text: 'Первый прототип: урок «Болт М8×40», сгенерированный из готовой детали, веб-плеер и живой инструктор.' },
  ],
  roadmap: [
    {
      state: 'done', stateEn: 'Done · October 2026', stateRu: 'Готово · октябрь 2026',
      titleEn: 'Foundation', titleRu: 'Фундамент',
      textEn: 'Lesson generator from a finished part, browser player, instructor add-in with model checks, robot learner and a local “Report a problem” loop.',
      textRu: 'Генератор урока из готовой детали, веб-плеер, надстройка-инструктор с проверками модели, робот-ученик и локальный цикл «Сообщить о проблеме».',
    },
    {
      state: 'now', stateEn: 'Now', stateRu: 'Сейчас',
      titleEn: 'First public lesson', titleRu: 'Первый открытый урок',
      textEn: '“Bolt M8×40”: passed manually in the add-in, re-captured in SOLIDWORKS 2026 SP4.1 and published here as a browser lesson. Feedback from first learners goes into the generator rules.',
      textRu: '«Болт М8×40»: пройден вручную в надстройке, переснят в SOLIDWORKS 2026 SP4.1 и опубликован здесь как веб-урок. Отзывы первых учеников превращаются в правила генератора.',
    },
    {
      state: 'next', stateEn: 'Next', stateRu: 'Далее',
      titleEn: 'A verified lesson series', titleRu: 'Проверенная серия уроков',
      textEn: 'Manual review of the beginner curriculum section by section — sketches, features, assemblies, drawings. Each fix is pinned by a robot check so the class of error does not return. Browser lessons are published on our own parts: fasteners, revolved and sheet parts.',
      textRu: 'Ручная проверка курса для начинающих по разделам — эскизы, элементы, сборки, чертежи. Каждое исправление закрепляется проверкой робота, чтобы класс ошибки не возвращался. Веб-уроки публикуются на собственных деталях: крепёж, тела вращения, листовые детали.',
    },
    {
      state: 'next', stateEn: 'Next', stateRu: 'Далее',
      titleEn: 'Add-in pilot', titleRu: 'Пилот надстройки',
      textEn: 'Signed installer, lesson catalogue inside the panel, saved progress, English SOLIDWORKS interface and earlier versions (2024–2025). Pilot with individual learners and one training group.',
      textRu: 'Подписанный установщик, каталог уроков в панели, сохранение прогресса, английский интерфейс SOLIDWORKS и предыдущие версии (2024–2025). Пилот с отдельными учениками и одной учебной группой.',
    },
    {
      state: 'later', stateEn: 'Later', stateRu: 'Позже',
      titleEn: 'Tools for teachers', titleRu: 'Инструменты преподавателя',
      textEn: 'Turn your own part into a lesson without programming, review a draft step by step, and get a completion report (time, errors, hints). A test mode without highlighting for assessment.',
      textRu: 'Превратить свою деталь в урок без программирования, просмотреть черновик по шагам и получить отчёт о прохождении (время, ошибки, подсказки). Режим зачёта без подсветки.',
    },
    {
      state: 'later', stateEn: 'Exploring', stateRu: 'Исследуется',
      titleEn: 'Beyond one CAD system', titleRu: 'Шире одной CAD-системы',
      textEn: 'The lesson format separates steps, checks and interface layout. Whether the approach transfers to other CAD systems with an open API will be decided after the pilot.',
      textRu: 'Формат урока разделяет шаги, проверки и раскладку интерфейса. Переносить ли подход на другие CAD-системы с открытым API, решим по итогам пилота.',
    },
  ],
};
