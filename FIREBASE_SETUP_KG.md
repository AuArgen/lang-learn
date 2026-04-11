# Firebase Конфигурациясын баптап чыгуу боюнча Колдонмо

Бул колдонмо эң башкы Firebase сырсөздөрүн жана ачкычтарын кайдан таап, аларды `.env.local` жана `.env` файлдарына кантип орнотуу керектигин түшүндүрөт.

## 1. Firebase Admin SDK Ачкычтарын алуу (Бул Backend / API роуттар үчүн керек)

Бул маалыматтар Next.js серверинде гана (Firestore'го толук укук менен кирүү үчүн) колдонулат. Эч качан браузерге чыгарбаңыз!

1. [Firebase Console](https://console.firebase.google.com/) баракчасына кириңиз.
2. Тиешелүү долбооруңузду (Project) тандаңыз.
3. Сол жактагы менюдөн **Project Overview** жанындагы **Тиштүү дөңгөлөк** (Settings) белгисин басыңыз, анан **Project settings** (Настройки проекта) тандаңыз.
4. Үстүңкү менюден **Service accounts** (Сервисные аккаунты) барагына өтүңүз.
5. Ылдый жагында **Firebase Admin SDK** бөлүмү чыгат. `Node.js` тандалган бойдон турсун.
6. **Generate new private key** (Создать новый закрытый ключ) баскычын басыңыз.
7. Түшүрүлгөн `.json` файлын ачыңыз. Анын ичинде керектүү маалыматтар бар:
   - `project_id` -> **FIREBASE_PROJECT_ID** үчүн.
   - `client_email` -> **FIREBASE_CLIENT_EMAIL** үчүн.
   - `private_key` -> **FIREBASE_PRIVATE_KEY** үчүн.

**.env файлыңызга төмөнкүдөй кылып көчүрүңүз:**
```env
FIREBASE_PROJECT_ID=сиздин-firebase-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@сиздин-долбоор.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nСиздин\nУзун\nАчкычыңыз\n-----END PRIVATE KEY-----\n"
```
*(Эскертүү: `FIREBASE_PRIVATE_KEY` ичиндеги `\n` белгилери менен кашаага алынып `"` жазылганы маанилүү!)*

## 2. Firebase Client Ачкычтарын алуу (Frontend үчүн, мисалы, түз Firestore окусаңыз)

Бул ачкычтар браузерге чыгуучу (NEXT_PUBLIC_ менен башталган) ачкычтар.

1. Кайрадан **Project settings** (Настройки проекта) бөлүмүнүн башкы **General** (Общие) барагына өтүңүз.
2. Эң ылдый жакта **Your apps** (Ваши приложения) бөлүгү бар.
3. Эгер колдонмо түзүлө элек болсо, **Web** (</> сөлөкөтү) басып жаңы колдонмо түзүңүз.
4. Түзүлгөндөн кийин `firebaseConfig` деген объект көрүнүп калат:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:12345:web:abcd..."
};
```
5. Ушул маалыматтарды `.env` файлына тийиштүү `NEXT_PUBLIC_FIREBASE_...` өзгөчөлүктөнүп көчүрүңүз.

## 3. Аутентификация жана JWT ачкычтары

- **AUTH_SERVICE_URL**: Сиздин тышкы логин терезеңиздин URL дареги.
- **EXTERNAL_CHECK_USER_URL**: Колдонуучунун моонотун, ролун текшерке тиешелүү тышкы сервер URL'и.
- **EXTERNAL_API_KEY**: Сиздин серверге сурам жөнөтүүдөгү жашыруун ачкыч.
- **JWT_SECRET**: Next.js ичинде JWT (сессия) түзүү жана окуу үчүн колдонула турган купуя сөз. Муну татаал текст (мисалы, uuid) менен толтуруңуз.
