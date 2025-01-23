export const conditionalLog = (name: string, data: any) => {
  if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === "true") {
    const formattedData = Object.entries(data)
      .map(([key, value]) => {
        const valueStr =
          typeof value === "object"
            ? JSON.stringify(value, null, 0).replace(/[{}\[\]]/g, "")
            : value;
        return `${key}:${valueStr}`;
      })
      .join(", ");
    console.log(`[${name}]`, formattedData);
  }
};

export const minifyForLog = (error: any) => {
  if (typeof error === "string") return { message: error };
  if (error instanceof Error) {
    const errorObj = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split("\n")[0],
    };
    return Object.entries(errorObj)
      .map(([key, value]) => `${key}:${value}`)
      .join(", ");
  }
  return Object.entries(error)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
};
