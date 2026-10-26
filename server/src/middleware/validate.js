/**
 * Middleware factory to validate request body, query, or params with a Zod schema
 */
export function validate(schema, source = "body") {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsedData = await schema.parseAsync(dataToValidate);
      req[source] = parsedData;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
