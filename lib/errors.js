export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function throwIf(error, fallbackMessage = "Request failed", status = 400) {
  if (error == null) return;
  const message =
    (typeof error === "object" && (error.message || error.error)) ||
    (typeof error === "string" ? error : null) ||
    fallbackMessage;
  const code =
    typeof error === "object" && error != null && "status" in error
      ? Number(error.status) || status
      : status;
  throw new AppError(String(message || fallbackMessage), code);
}
