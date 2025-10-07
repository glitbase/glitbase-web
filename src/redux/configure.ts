import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { navigateTo } from "./navigationSlice";
import { Tokens } from "../AuthContext";
import { setLoading } from "./auth/authSlice";

let hasHandledSessionError = false;

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  timeout: 180000,
  prepareHeaders: (headers) => {
    const tokensString = localStorage.getItem("tokens");
    const tokens: Tokens = tokensString ? JSON.parse(tokensString) : null;

    if (tokens && tokens.accessToken) {
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
    }
    return headers;
  },
});

const refreshAccessToken = async (refreshToken: string): Promise<Tokens> => {
  try {
    const refreshResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-user-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!refreshResponse.ok) {
      throw new Error(`HTTP error! status: ${refreshResponse.status}`);
    }

    const data = await refreshResponse.json();
    console.log(data);
    return data.data.tokens;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

export const baseQueryWithReauth = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const tokensString = localStorage.getItem("tokens");
    const tokens: Tokens = tokensString ? JSON.parse(tokensString) : null;
    console.log(tokens);
    if (tokens?.refreshToken) {
      api.dispatch(setLoading(true));
      console.log("refreshing token");
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken);

        localStorage.setItem("tokens", JSON.stringify(newTokens));

        result = await baseQuery(
          {
            ...args,
            headers: {
              ...args.headers,
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
          },
          api,
          extraOptions
        );
        api.dispatch(setLoading(false));
      } catch (refreshError) {
        handleApiErrors(result.error, api);
      }
    } else {
      handleApiErrors(result.error, api);
    }
  }

  return result;
};

const handleApiErrors = (error: any, api: any) => {
  let errorMessage = "";

  switch (error.data?.message) {
    case "Invalid Token":
    case "Session expired":
    case "You have been logged out":
      if (!hasHandledSessionError) {
        hasHandledSessionError = true;
        errorMessage = "Your session has expired. Please log in again.";

        api.dispatch(
          navigateTo({
            path: `/auth/login`,
            message: errorMessage,
          })
        );
      }
      break;
    case "ThrottlerException: Too Many Requests":
      errorMessage = "Too many requests. Please try again later.";
      // Display a notification or alert here if desired
      break;
    default:
      console.log("API error", error);
      return;
  }
};
