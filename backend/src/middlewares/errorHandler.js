// Runs after every route has been checked and none matched.
// Must be mounted after all route mounts in app.js.
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

// Central error handler. Only reached when something calls next(error)
// (e.g. express.json() failing to parse a malformed body), or when an
// unexpected runtime error is thrown outside an existing try/catch.
// Existing controller try/catch blocks are untouched and keep handling
// their own errors exactly as before — this is purely a safety net for
// everything outside that pattern.
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // express.json() throws a SyntaxError with a `body` property when it
  // fails to parse malformed JSON in the request body.
  const isJsonParseError =
    err.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && "body" in err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong.";

  if (isJsonParseError) {
    statusCode = 400;
    message = "Invalid JSON in request body.";
  }

  // Never leak a raw 200 from an error path.
  if (statusCode < 400) {
    statusCode = 500;
  }

  const response = {
    success: false,
    message,
    statusCode,
  };

  // Only ever forward the safe, pre-shaped { field, message } array that
  // validate.js attaches — never the raw ZodError or any other object.
  if (Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  if (!isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};