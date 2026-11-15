const PAKISTANI_MOBILE_ERROR =
  "Enter a valid Pakistani mobile number (03XXXXXXXXX or +92XXXXXXXXXX).";

export function isValidPakistaniMobile(value) {
  const phone = String(value || "").replace(/[\s-]/g, "");
  if (/^0?3\d{9}$/.test(phone)) return true;
  if (/^\+92(?:0)?3\d{9}$/.test(phone)) return true;
  return false;
}

export { PAKISTANI_MOBILE_ERROR };
