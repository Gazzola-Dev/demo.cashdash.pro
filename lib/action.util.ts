import { ActionResponse } from "@/types/action.types";

const getActionResponse = <T = null>({
  data,
  error: errorParam,
}: {
  data?: T | null;
  error?: any;
} = {}): ActionResponse<T> => {
  let error: null | string = null;

  if (errorParam instanceof Error || typeof errorParam?.message === "string") {
    error = errorParam.message;
  } else if (typeof errorParam === "string") {
    error = errorParam;
  } else if (errorParam) {
    // Handle Supabase error object format
    if (errorParam.code && errorParam.message) {
      error = `${errorParam.code}: ${errorParam.message}`;
    } else {
      error = "An error occurred";
    }
  }

  if (error) console.error(`server error: ${error}`);

  return {
    error,
    data: data ?? null,
  };
};

export default getActionResponse;
