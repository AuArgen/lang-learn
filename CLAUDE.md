@AGENTS.md

# CLAUDE ИНСТРУКЦИИ — ЧИТАЙ ПЕРВЫМ

> Перед любой работой прочти весь этот файл. После изменений в проекте обнови соответствующий раздел здесь.

## Принципы экономии токенов

- Читай только нужные файлы (используй Grep/Glob, не читай всё подряд)
- Меняй только конкретные строки через Edit, не переписывай файл целиком
- Не добавляй комментарии, docstring, README без явной просьбы
- Не рефакторь то, чего не просили

---

## Проект: BilimAi Learn Lang

Языковая игра для изучения языков. Учителя создают темы со словами, ученики играют в игры с произношением (голос или текст).

**Стек:**
- Next.js **16.2.2** (нестандартная версия — читай `node_modules/next/dist/docs/` перед изменением API)
- React 19.2.4, TypeScript 5
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- Prisma 5.21.1 + SQLite (`data/dev.db`)
- next-intl 4.x (i18n)
- Firebase (клиент), jose (JWT)
- Docker deployment (`output: "standalone"`)

---

## Структура файлов

```
app/
  page.tsx                    # Лендинг (публичный)
  layout.tsx                  # Root layout с NextIntlClientProvider
  globals.css                 # Стили
  (dashboard)/                # Защищённые страницы (требуют auth)
    layout.tsx
    themes/                   # Список тем пользователя
      page.tsx                # Показывает только темы текущего юзера (admin — все)
      ThemesClient.tsx        # CRUD тем, кнопки публикации
      [id]/
        page.tsx              # Детальная страница темы (слова)
        WordsClient.tsx       # Добавление/редактирование/удаление слов + AI
        edit/page.tsx
        history/page.tsx
    admin/                    # Панель администратора
    reports/
  actions/                    # Server Actions — все мутации только здесь
    admin-actions.ts
    game-actions.ts
    locale-action.ts
    theme-actions.ts
    word-actions.ts           # assertThemeOwner() — только владелец/admin может менять слова
    user-actions.ts           # saveGeminiKeyAction, getGeminiKeyStatusAction,
                              # generateWordsWithAIAction, addGeneratedWordsAction
  api/
    auth/callback/            # OAuth callback
    auth/logout/
    assess-pronunciation/route.ts # POST: Azure/Groq проверка речи; GET: { available, hasAssessment }
  play/
    [themeId]/page.tsx        # Игровой экран (публичный, без авторизации)
    local/page.tsx            # Игра без сохранения (браузерный localStorage)

components/
  LanguageSwitcher.tsx        # Переключатель языка интерфейса
  MobileBottomNav.tsx         # Нижняя навигация мобильных
  PlayContainer.tsx           # Игровой контейнер — см. раздел "Игра" ниже
  GeminiKeyForm.tsx           # Форма добавления/редактирования Gemini API ключа
  auth/                       # Auth компоненты

lib/
  auth/
    jwt.ts                    # verifyJwtToken()
    server-auth.ts            # getServerUser(), hasReachedThemeLimit(), hasReachedWordLimit()
  gemini/
    service.ts                # generateWordsForTheme() — генерация слов через Gemini AI
  db/
    prisma.ts                 # Prisma client singleton
  firebase/
    client.ts                 # Firebase client init
    services/
      themes.ts               # themesService (CRUD тем через Prisma, не Firebase)
      words.ts                # wordsService
      games.ts                # gamesService
  types/                      # TypeScript типы

messages/
  kg.json                     # Кыргызский (язык по умолчанию)
  ru.json                     # Русский
  en.json                     # Английский

prisma/schema.prisma          # Схема БД
middleware.ts                 # Auth middleware
i18n/request.ts               # i18n конфигурация
next.config.ts                # Next.js конфиг
```

---

## База данных (Prisma + SQLite)

**Модели:** `User`, `Theme`, `Word`, `GameSession`, `GameResult`

**Лимиты:**
- 1 тема на пользователя (`hasReachedThemeLimit` — лимит 1)
- 100 слов на тему (`hasReachedWordLimit` — лимит 100)

**Поле `gemini_api_key`** в модели `User` — персональный ключ Gemini AI (опциональный)

**Статусы темы:** `draft` → `pending` → `published`

**Роли пользователей:** `USER`, `ADMIN` / `ADMINISTRATOR`

---

## Аутентификация

- JWT токен в cookie `session`
- Middleware (`middleware.ts`) верифицирует токен и добавляет заголовки `x-user-id`, `x-user-role`
- Получение пользователя на сервере: `getServerUser()` из `lib/auth/server-auth.ts`
- Внешний OAuth: `AUTH_SERVICE_URL` (env)
- Публичные пути: `/`, `/api/auth/callback`, `/play/`, `/api/assess-pronunciation`

---

## i18n (next-intl)

- Локали: `kg` (по умолчанию), `ru`, `en`
- Локаль хранится в cookie `NEXT_LOCALE`
- Переводы в `messages/{locale}.json`
- На сервере: `getTranslations('Section')`, `getLocale()`
- На клиенте: `useTranslations('Section')`
- **При добавлении нового текста** — добавить ключ во все три файла: `kg.json`, `ru.json`, `en.json`

---

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `AUTH_SERVICE_URL` | URL внешнего OAuth сервиса |
| `APP_URL` | Публичный URL приложения |
| `DATABASE_URL` | (опционально) путь к SQLite |
| `GROQ_API_KEY` | (опционально) Groq API ключ для Whisper распознавания — fallback в `app/api/assess-pronunciation/route.ts` |
| `AZURE_SPEECH_KEY` | (опционально) Azure Cognitive Services ключ — оценка произношения |
| `AZURE_SPEECH_REGION` | (опционально) Azure регион (например `eastus`) — нужен вместе с `AZURE_SPEECH_KEY` |

---

## Команды разработки

```bash
npm run dev       # Запуск dev сервера
npm run build     # Сборка
npm run lint      # ESLint
npx prisma studio # GUI для БД
npx prisma db push # Применить изменения схемы
```

---

## Игра (PlayContainer.tsx)

### Распознавание речи — четыре уровня (автоматическое переключение)

1. **Azure Pronunciation Assessment** (если `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` заданы) — основной режим проверки произношения.
   - Клиент записывает WAV 16 kHz и отправляет на `POST /api/assess-pronunciation`
   - Сервер передаёт `referenceText`, возвращает transcript + score
   - Пустое распознавание не считается ошибкой: ученик повторяет слово

2. **Groq Whisper** (если `GROQ_API_KEY` задан, а Azure нет) — fallback распознавания через `whisper-large-v3-turbo`, работает во всех браузерах.

3. **Web Speech API** (Chrome/Android, без ключей) — берёт `maxAlternatives = 5` и проверяет все варианты.

4. **Текстовый ввод** — если браузер не поддерживает Speech API (iOS Safari, Firefox), показывается поле ввода для всех слов.

### Алгоритм сравнения ответа

`isSpeechMatch(transcript, word)` — используется и для голоса, и при выборе лучшей альтернативы:
- `transcript.includes(word)` — точное слово внутри распознанной фразы
- `word.includes(transcript)` допускается только если сказано ≥ 80% слова
- Levenshtein distance ≤ `max(1, floor(word.length × 0.2))` — нечёткое совпадение
- Для Azure используется независимое распознавание без `referenceText`, чтобы `referenceText` не подменял сказанное слово

### UX-механики (solo режим)

- **Progress bar** — тонкая полоска вверху, показывает прогресс по словам
- **Сердечки** — 5 ❤, при 0 игра заканчивается досрочно
- **Streak** — 🔥 показывается при 2+ правильных ответах подряд
- **Правильный ответ при пропуске** — после 3 ошибок показывается "Туура жооп: [слово]"
- **Экран результатов** — статистика (точность, очки, время) + список всех слов с ✓/✗

---

## Важные соглашения

1. **Server Actions** — все мутации через файлы в `app/actions/`, не через API routes
2. **`assertThemeOwner(themeId, user)`** в `word-actions.ts` — вызывать перед любой мутацией слов; пропускает только ADMIN/ADMINISTRATOR
3. **`lib/firebase/services/`** — несмотря на имя папки, сервисы используют Prisma, не Firebase напрямую
4. **`export const dynamic = 'force-dynamic'`** — добавляй на страницы, которые читают из БД (SQLite недоступен при build)
5. **Tailwind v4** — конфиг через `postcss.config.mjs`, не через `tailwind.config.js`
6. **Docker** — БД монтируется как volume, не включена в образ
7. **Дубликаты слов** — проверяется только поле `word` (не перевод), регистронезависимо

---

## Обновление этого файла

После изменений в проекте обнови нужный раздел выше:
- Новый компонент → добавь в "Структура файлов"
- Новая env переменная → добавь в таблицу
- Изменение лимитов → обнови "База данных"
- Новая локаль → обнови "i18n"
- Изменение логики игры → обнови раздел "Игра"
