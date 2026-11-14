import en from "./en.json";
import mn from "./mn.json";

export type Locale = "en" | "mn";
export type MessageKey = keyof typeof en;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, mn };

/**
 * Translate a key. Falls back to English, then to the key itself, so a missing
 * Mongolian string never renders blank. mn.json is type-checked against en.json.
 */
export function t(key: MessageKey, locale: Locale = "en"): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
