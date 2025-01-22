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
