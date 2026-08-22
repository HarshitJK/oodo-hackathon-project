import { ZodError } from "zod";

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
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
