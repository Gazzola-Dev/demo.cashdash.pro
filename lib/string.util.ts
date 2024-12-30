export function capitalizeFirstLetter(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
export function truncateString(str: string) {
  if (str.length <= 20) {
    return str;
  }
  return str.substring(0, 20) + "...";
}
