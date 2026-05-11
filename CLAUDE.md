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

Языковая игра для изучения английского через Web Speech API. Пользователи создают темы со словами, играют в игры с произношением.

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
    admin/                    # Панель администратора
    reports/
  actions/                    # Server Actions
    admin-actions.ts
    game-actions.ts
    locale-action.ts
    theme-actions.ts
    word-actions.ts
    user-actions.ts             # saveGeminiKeyAction, getGeminiKeyStatusAction, generateWordsWithAIAction, addGeneratedWordsAction
  api/
    auth/callback/            # OAuth callback
    auth/logout/
  play/[id]/                  # Игровой экран (публичный)

components/
  LanguageSwitcher.tsx        # Переключатель языка интерфейса
  MobileBottomNav.tsx         # Нижняя навигация мобильных
  PlayContainer.tsx           # Игровой контейнер (Web Speech API)
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
      themes.ts               # themesService (CRUD тем через Prisma)
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

**Поле `gemini_api_key`** в модели `User` — персональный ключ Gemini AI (опциональный, зашифрован в БД)

**Статусы темы:** `draft` → `pending` → `published`

**Роли пользователей:** `USER`, `ADMIN` / `ADMINISTRATOR`

---

## Аутентификация

- JWT токен в cookie `session`
- Middleware (`middleware.ts`) верифицирует токен и добавляет заголовки `x-user-id`, `x-user-role`
- Получение пользователя на сервере: `getServerUser()` из `lib/auth/server-auth.ts`
- Внешний OAuth: `AUTH_SERVICE_URL` (env)
- Публичные пути: `/`, `/api/auth/callback`, `/play/`

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

## Важные соглашения

1. **Server Actions** — все мутации через файлы в `app/actions/`, не через API routes
2. **`lib/firebase/services/`** — несмотря на имя папки, сервисы используют Prisma, не Firebase напрямую
3. **`export const dynamic = 'force-dynamic'`** — добавляй на страницы, которые читают из БД (SQLite недоступен при build)
4. **Tailwind v4** — конфиг через `postcss.config.mjs`, не через `tailwind.config.js`
5. **Docker** — БД монтируется как volume, не включена в образ

---

## Обновление этого файла

После изменений в проекте обнови нужный раздел выше:
- Новый компонент → добавь в "Структура файлов"
- Новая env переменная → добавь в таблицу
- Изменение лимитов → обнови "База данных"
- Новая локаль → обнови "i18n"
