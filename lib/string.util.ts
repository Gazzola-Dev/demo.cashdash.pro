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

export const redactEmail = (email: string) => {
  const [localPart, domain] = email.split("@");
  const redactedLocal =
    localPart.slice(0, 2) + "*".repeat(localPart.length - 2);
  const [domainName, tld] = domain.split(".");
  const redactedDomain =
    domainName.slice(0, 2) + "*".repeat(domainName.length - 2);
  return `${redactedLocal}@${redactedDomain}.${tld}`;
};
