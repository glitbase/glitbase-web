import { useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";

export function debounce<T>(
  callback: (...args: T[]) => void,
  delay: number
): (...args: T[]) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: T[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

export const useTmpStorage = (storableStore?: any) => {
  const storeData = (data: any) => {
    if (data) {
      let tmpDataStr = localStorage.getItem("tmpData");
      let tmpData = tmpDataStr ? JSON.parse(tmpDataStr) : {};
      tmpData = JSON.stringify({ ...tmpData, ...data });
      localStorage.setItem("tmpData", tmpData);
    }
  };

  useBeforeUnload(
    useCallback(() => {
      storeData(storableStore);
    }, [storableStore])
  );

  const getData = (key: string) => {
    let tmpDataStr = localStorage.getItem("tmpData");
    let tmpData = tmpDataStr ? JSON.parse(tmpDataStr) : {};
    return tmpData[key];
  };

  const setData = (data: any) => {
    storeData(data);
  };

  return { getData, setData };
};
