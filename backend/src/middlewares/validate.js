// Generic request-body validation middleware factory.
// Usage: router.post("/route", validate(someZodSchema), controllerFn)
//
// On success: req.body is replaced with the parsed/sanitized data
// returned by Zod (so controllers/services only ever see clean data).
//
// On failure: no response is sent here. A plain Error carrying
// statusCode/message/errors is passed to next(error), so the existing
// central error handler (errorHandler.js) remains the single place
// that ever writes an HTTP response for a failure.
export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const validationError = new Error("Validation failed");

      validationError.statusCode = 400;

      // Safe, minimal shape only — never forward the raw ZodError
      // object or anything with internal schema/stack detail.
      validationError.errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      }));

      return next(validationError);
    }

    req.body = result.data;

    next();
  };
};