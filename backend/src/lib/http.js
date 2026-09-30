export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorMiddleware(err, _req, res, _next) {
  const status = err.status || 500;
  const safe =
    status >= 500
      ? "Something went wrong. Please try again."
      : err.message || "Request failed.";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: safe });
}
