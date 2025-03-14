export const conditionalLog = (
  name: string,
  data: any,
  isServer = false,
  sliceCount: number | null = 20,
) => {
  const isVerbose = process.env.NEXT_PUBLIC_VERBOSE_LOGS === "true";
  const serverShouldLog = process.env.SERVER_DEBUG === "true" && isServer;
  const clientShouldLog =
    process.env.NEXT_PUBLIC_CLIENT_DEBUG === "true" && !isServer;

  if (serverShouldLog || clientShouldLog) {
    const formattedData = Object.entries(data)
      .map(([key, value]) => {
        let valueStr =
          typeof value === "object"
            ? JSON.stringify(value, null, 0).replace(/[{}\[\]]/g, "")
            : String(value);

        if (sliceCount !== null && !isVerbose) {
          valueStr = valueStr.slice(0, sliceCount);
        }

        return `${key}:${valueStr}`;
      })
      .join(", ");

    console.log(
      `[${name}]${isServer ? "[SERVER]" : "[CLIENT]"}`,
      formattedData,
    );
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

export const getErrorMessage = (
  minifiedError: string | { message: string },
) => {
  return typeof minifiedError === "string"
    ? minifiedError
    : minifiedError.message;
};
