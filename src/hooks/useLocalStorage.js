import { useState, useEffect } from 'react';

/**
 * useLocalStorage — Persist state to localStorage with automatic sync
 * @param {string} key — localStorage key
 * @param {*} initialValue — Default value if key not found
 * @returns {[value, setValue]} — State and setter, persisted to localStorage
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' && window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.warn(`useLocalStorage error reading "${key}":`, err);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (err) {
      console.warn(`useLocalStorage error writing "${key}":`, err);
    }
  };

  return [storedValue, setValue];
}

/**
 * useSessionStorage — Persist state to sessionStorage (cleared on tab close)
 * @param {string} key — sessionStorage key
 * @param {*} initialValue — Default value
 * @returns {[value, setValue]} — State and setter, persisted to sessionStorage
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' && window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.warn(`useSessionStorage error reading "${key}":`, err);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (err) {
      console.warn(`useSessionStorage error writing "${key}":`, err);
    }
  };

  return [storedValue, setValue];
}