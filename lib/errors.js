export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function throwIf(error, fallbackMessage = "Request failed", status = 400) {
  if (!error) return;
  const message = error.message || error.error || fallbackMessage;
  throw new AppError(message, error.status || status);
}
