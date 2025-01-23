// log.utils.ts
export const minifyForLog = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => minifyForLog(item));
  }

  // Handle objects
  if (typeof data === "object") {
    const minified: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip null or undefined values
      if (value === null || value === undefined) continue;

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) continue;

      // Skip empty objects
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      )
        continue;

      // Truncate long strings
      if (typeof value === "string" && value.length > 50) {
        minified[key] = `${value.substring(0, 47)}...`;
        continue;
      }

      // Handle nested objects/arrays
      if (typeof value === "object") {
        minified[key] = minifyForLog(value);
        continue;
      }

      minified[key] = value;
    }
    return minified;
  }

  // Handle other primitive types
  return data;
};

// Helper function to format the output with a prefix
export const formatLogOutput = (prefix: string, data: any) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    prefix,
    data: minifyForLog(data),
  };
};

// Helper function to conditionally log data based on environment flags
export const conditionalLog = (
  prefix: string,
  { data, error }: { data?: any; error?: any } = {},
) => {
  const isClient = typeof window !== "undefined";
  const shouldLog = isClient
    ? process.env.NEXT_PUBLIC_CLIENT_DEBUG === "true"
    : process.env.SERVER_DEBUG === "true";

  if (!shouldLog) return;

  const output = formatLogOutput(prefix, {
    data: data ? minifyForLog(data) : undefined,
    error: error ? minifyForLog(error) : undefined,
  });

  // Using console.debug for better visibility in dev tools
  console.debug(JSON.stringify(output, null, 2));
};
