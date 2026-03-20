import { useRef } from "react";

export default function usePriceLookupCache() {
  const cacheRef = useRef({});
  const expiryRef = useRef({});
  const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

  const getCacheKey = (description, zipCode) => `${description}|${zipCode}`;

  const get = (description, zipCode) => {
    const key = getCacheKey(description, zipCode);
    const now = Date.now();

    if (cacheRef.current[key] && expiryRef.current[key] > now) {
      return cacheRef.current[key];
    }

    // Clear expired entry
    if (cacheRef.current[key]) {
      delete cacheRef.current[key];
      delete expiryRef.current[key];
    }

    return null;
  };

  const set = (description, zipCode, value) => {
    const key = getCacheKey(description, zipCode);
    cacheRef.current[key] = value;
    expiryRef.current[key] = Date.now() + CACHE_DURATION;
  };

  return { get, set };
}