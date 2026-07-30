const kanaLetterPattern =
  /[\u3041-\u3096\u30a1-\u30fa\u31f0-\u31ff\uff66-\uff9d]/u;
const allowedJapaneseTextPattern =
  /^[\u0020-\u007e\u3000-\u30ff\u31f0-\u31ff\u3400-\u9fff\uf900-\ufaff\uff01-\uffef\r\n\t]+$/u;

export function validateJapaneseText(value: unknown): true | string {
  if (typeof value !== "string" || value.length === 0) {
    return true;
  }

  if (!allowedJapaneseTextPattern.test(value)) {
    return "只能使用日文、汉字、英数字和常用标点";
  }

  return (
    kanaLetterPattern.test(value) ||
    "请输入至少包含一个日文平假名或片假名的内容"
  );
}
