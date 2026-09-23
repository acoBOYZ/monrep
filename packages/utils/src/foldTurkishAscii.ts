const TR_TO_ASCII: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};
const TR_TO_ASCII_RE = /[çÇğĞıİöÖşŞüÜ]/g;

/** Single-pass ğüşöçı / İ → ASCII. Does not lowercase the rest of the string. */
export function foldTurkishAscii(value: string): string {
  return value.replace(TR_TO_ASCII_RE, (ch) => TR_TO_ASCII[ch] ?? ch);
}
