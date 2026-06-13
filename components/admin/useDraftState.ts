"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * Form state that autosaves to localStorage so edits survive a reload, a
 * navigation, or a Server Action 404 (e.g. after a deploy/restart invalidates
 * the action id). Restores any unsaved draft on mount; clear it on a
 * successful save.
 */
export function useDraftState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const dirty = useRef(false);

  // Restore a draft (prior unsaved edits) on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
        setRestored(true);
        dirty.current = true;
      }
    } catch {
      /* ignore */
    }
  }, [key]);

  // Persist after the user has actually edited.
  useEffect(() => {
    if (!dirty.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / unavailable — ignore */
    }
  }, [key, value]);

  const set: Dispatch<SetStateAction<T>> = (v) => {
    dirty.current = true;
    setValue(v);
  };

  const clearDraft = () => {
    dirty.current = false;
    setRestored(false);
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  const discard = () => {
    clearDraft();
    setValue(initial);
  };

  return { value, set, restored, clearDraft, discard };
}
