import { GoogleGenAI } from "@google/genai";

export interface GeneratedWord {
  word: string;
  translation: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  tr: "Turkish",
  zh: "Chinese",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  ko: "Korean",
  ja: "Japanese",
  ky: "Kyrgyz",
};

export async function generateWordsForTheme(
  apiKey: string,
  themeTitle: string,
  themeLanguage: string,
  existingWords: string[] = [],
  customDescription = "",
): Promise<GeneratedWord[]> {
  const langName = LANG_NAMES[themeLanguage] || "English";
  const skipLine =
    existingWords.length > 0
      ? `\nAlready added words (do NOT repeat these): ${existingWords.slice(0, 30).join(", ")}`
      : "";
  const customDescriptionLine = customDescription.trim()
    ? `\nTeacher's additional description/request: ${customDescription.trim()}`
    : "";

  const prompt = `You are a professional vocabulary teacher creating word lists for language learners.

Theme/Topic: "${themeTitle}"
Target language of words: ${langName}
Translation language: Kyrgyz (Кыргызча)
${customDescriptionLine}
${skipLine}

Your task: Generate exactly 10 useful vocabulary words for this topic.

IMPORTANT RULES:
- Return ONLY a valid JSON array, no markdown, no explanation, no extra text
- Each item must have "word" (in ${langName}) and "translation" (in Kyrgyz)
- Words must be directly related to "${themeTitle}"
- If the teacher provided an additional description/request, follow it when choosing words
- Choose practical, common words a learner would actually use
- Mix word types: nouns, verbs, adjectives when appropriate
- Kyrgyz translations must be accurate and natural

Example format:
[
  {"word": "apple", "translation": "алма"},
  {"word": "banana", "translation": "банан"}
]

Now generate 10 words for topic "${themeTitle}":`;

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch {
    throw new Error("Жараксыз API ключ форматы. Ключди кайра текшериңиз.");
  }

  let responseText: string;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    responseText = response.text || "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      throw new Error(
        "Gemini API ключ жараксыз. https://aistudio.google.com/api-keys сайтынан жаңы ключ алыңыз.",
      );
    }
    if (msg.includes("QUOTA_EXCEEDED") || msg.includes("quota")) {
      throw new Error(
        "API лимити бүттү. Бир аздан кийин кайра аракет кылыңыз.",
      );
    }
    if (msg.includes("PERMISSION_DENIED")) {
      throw new Error("API ключке уруксат жок. Ключди кайра текшериңиз.");
    }
    throw new Error(
      `AI катасы: ${msg || "Белгисиз ката. Кайра аракет кылыңыз."}`,
    );
  }

  const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error("AI жооп форматы туура эмес. Кайра аракет кылыңыз.");
  }

  let words: GeneratedWord[];
  try {
    words = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(
      "AI жоопту иштеп чыгуу мүмкүн болбоду. Кайра аракет кылыңыз.",
    );
  }

  if (!Array.isArray(words) || words.length === 0) {
    throw new Error(
      "AI сөз генерациялай алган жок. Тема аталышын өзгөртүп аракет кылыңыз.",
    );
  }

  return words
    .filter((w) => w.word?.trim() && w.translation?.trim())
    .slice(0, 10);
}
