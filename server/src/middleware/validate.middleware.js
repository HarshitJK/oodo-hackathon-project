const { ZodError } = require("zod");

/**
 * Zod schema validation middleware factory.
 *
 * Usage:
 *   router.post("/signup", validate(signupSchema), authController.signup);
 *
 * Validates req.body against the provided schema.
 * On failure, returns 422 with structured field errors.
 *
 * @param {import("zod").ZodSchema} schema - Zod schema to validate against.
 * @param {"body" | "query" | "params"} [source="body"] - Request property to validate.
 * @returns Express middleware function
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Replace with parsed/coerced data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res.status(422).json({
          success: false,
          message: "Validation failed.",
          errors,
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
