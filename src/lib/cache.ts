// Speed ka dil. Teen kaam:
// 1) Jo data ek baar mangwa liya use 30 second yaad rakhte hain (page badalne par dobara internet nahi).
// 2) Aakhri mili value hamesha rakhte hain, taaki page badalte hi turant dikhe (Loading nahi) aur piche se naya aa jaye.
// 3) Koi bhi save/delete hone par jo data dekha ja chuka hai use piche se chupke se dobara mangwa lete hain,
//    aur khule hue pages apne-aap naya data dikha dete hain.
type Entry = { at: number; p: Promise<unknown>; load: () => Promise<unknown> };

const store = new Map<string, Entry>();
const values = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function run(key: string, load: () => Promise<unknown>): Promise<unknown> {
  const p = load();
  const entry: Entry = { at: Date.now(), p, load };
  store.set(key, entry);
  p.then((v) => {
    if (store.get(key) === entry) {
      values.set(key, v);
      notify(key);
    }
  }).catch(() => {
    if (store.get(key) === entry) store.delete(key); // fail hua to agli baar dobara koshish
  });
  return p;
}

export function cached<T>(key: string, load: () => Promise<T>, ttlMs = 30_000): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.p as Promise<T>;
  return run(key, load) as Promise<T>;
}

// Filter object se stable key (undefined / "" / "all" / khali object hata ke, sorted)
export function stable(v: unknown): string {
  const clean = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(clean);
    if (x && typeof x === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(x as object).sort()) {
        const c = clean((x as Record<string, unknown>)[k]);
        if (c === undefined || c === "" || c === "all" || c === null) continue;
        if (typeof c === "object" && !Array.isArray(c) && Object.keys(c as object).length === 0) continue;
        out[k] = c;
      }
      return out;
    }
    return x;
  };
  return JSON.stringify(clean(v ?? {}));
}

// Aakhri mili value (purani ho sakti hai) - turant dikhane ke liye
export function peek<T>(key: string): T | undefined {
  return values.get(key) as T | undefined;
}

// Kisi page ko is key ka data chahiye; naya data aate hi callback chalega. Wapas hatane ka function milta hai.
export function subscribe(key: string, fn: () => void): () => void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) listeners.delete(key);
  };
}

// Is key ko piche se dobara mangwao (purani value screen par rehti hai jab tak naya na aa jaye)
export function revalidate(key: string) {
  const e = store.get(key);
  if (e) void run(key, e.load).catch(() => undefined);
}

// Abhi khule hue pages ka data taaza karo (dusre log ke badlav dikhane ke liye)
export function revalidateActive() {
  for (const key of listeners.keys()) revalidate(key);
}

// Value ko seedha badal do (save ke turant baad screen par dikhane ke liye). prefix se shuru hone wali sab keys par.
export function patch<T>(prefix: string, fn: (v: T, key: string) => T) {
  for (const [key, v] of values) {
    if (!key.startsWith(prefix)) continue;
    values.set(key, fn(v as T, key));
    notify(key);
  }
}

// Kuch bhi badalne ke baad ye bulao: jo data dekha ja chuka hai wo sab piche se naya mangwa lo
export function mutated() {
  for (const [key, e] of [...store]) {
    void run(key, e.load).catch(() => undefined);
  }
}

export function invalidate(...keys: string[]) {
  for (const k of keys) store.delete(k);
}

export function clearCache() {
  store.clear();
  values.clear();
}