// TODO(aaron): update default return type to be {data: null, error: null}

import { ActionResponse } from "@/types/action.types";

const getActionResponse = <T = null>({
  data,
  error: errorParam,
}: {
  data?: T | null;
  error?: any;
} = {}): ActionResponse<T> => {
  let error: null | string = null;
  if (errorParam instanceof Error || typeof errorParam?.message === "string")
    error = errorParam.message;
  else if (typeof errorParam === "string") error = errorParam;
  else if (errorParam) error = "An error occurred";
  if (error) console.error(`server error: ${error}`);
  return {
    error,
    data: data ?? null,
  };
};

export default getActionResponse;
