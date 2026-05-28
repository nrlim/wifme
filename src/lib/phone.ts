export function formatWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let formatted = phone.replace(/\D/g, "");
  
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  } else if (formatted.startsWith("8")) {
    formatted = "62" + formatted;
  }
  
  return formatted;
}
