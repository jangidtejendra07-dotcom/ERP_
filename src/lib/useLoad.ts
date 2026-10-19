"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { peek, subscribe } from "./cache";

// Data mangwane ka tarika jo page ko turant dikhata hai:
// 1) pehle se saved data ho to usi waqt dikha deta hai (Loading nahi dikhta)
// 2) piche se naya data mangwa ke chupke se badal deta hai
// 3) window par wapas aane par dobara check karta hai (dusre log ne kuch badla ho to dikhe)
// key = service ka cache key, fetcher = service ka fetch function
export function useLoad<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(() => peek<T>(key));
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    setData(peek<T>(key));
    fetchRef
      .current()
      .then((d) => {
        if (!alive) return;
        // Sabse naya saved data lo (is request ka jawab purana ho sakta hai agar beech me kuch badla ho)
        setData(peek<T>(key) ?? d);
        setError("");
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [key, tick]);

  // Piche se naya data aate hi (save ke baad ya dusre log ke badlav se) screen apne-aap badal jaye
  useEffect(() => {
    return subscribe(key, () => {
      const v = peek<T>(key);
      if (v !== undefined) setData(v);
    });
  }, [key]);

  useEffect(() => {
    const again = () => setTick((t) => t + 1);
    window.addEventListener("focus", again);
    return () => window.removeEventListener("focus", again);
  }, []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  // Save/delete ke turant baad screen par badlav dikhane ke liye (server ka wait nahi)
  const mutate = useCallback((fn: (d: T) => T) => setData((d) => (d === undefined ? d : fn(d))), []);
  return { data, error, reload, mutate };
}