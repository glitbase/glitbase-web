import * as amplitude from "@amplitude/analytics-browser";

export const trackAction = (action: string, payload: any) => {
  amplitude.track(action, {
    ...payload,
    env: import.meta.env.PROD ? "PROD" : "DEV",
  });
};
