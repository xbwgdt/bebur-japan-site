const kanaLetterPattern =
  /[\u3041-\u3096\u30a1-\u30fa\u31f0-\u31ff\uff66-\uff9d]/u;
const allowedJapaneseTextPattern =
  /^[\u0009\u000a\u000d\u0020-\u007e\u00b0\u00b1\u00b2\u00b3\u00b5\u00d7\u00d8\u0370-\u03ff\u2000-\u206f\u2100-\u22ff\u3000-\u30ff\u31f0-\u31ff\u3300-\u33ff\u3400-\u9fff\uf900-\ufaff\uff01-\uffef]+$/u;

const invalidJapaneseTextMessage = "请输入安全的日文、CJK 或技术符号内容";
const missingKanaMessage = "请输入至少包含一个日文平假名或片假名的内容";

export function validateJapaneseText(value: unknown): true | string {
  if (typeof value !== "string" || value.length === 0) {
    return true;
  }

  if (!allowedJapaneseTextPattern.test(value)) {
    return invalidJapaneseTextMessage;
  }

  // Japanese and Chinese share Han characters, so a Kanji-only company name,
  // address, technical label, or unit cannot be language-discriminated from its
  // Unicode characters alone. Keep this validator to safe CJK/Japanese and
  // approved technical symbols; use validateJapaneseProse only for fields that
  // are known to contain narrative Japanese language.
  return true;
}

export function validateJapaneseProse(value: unknown): true | string {
  const textValidation = validateJapaneseText(value);
  if (textValidation !== true || typeof value !== "string" || value === "") {
    return textValidation;
  }

  return kanaLetterPattern.test(value) || missingKanaMessage;
}
