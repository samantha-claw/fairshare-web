import { z } from "zod";

/**
 * Parses data with a Zod schema and returns either the parsed result
 * or a flat error map keyed by field name.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path.join(".") || "general";
    if (!errors[key]) errors[key] = issue.message;
  });
  return { success: false, errors };
}
