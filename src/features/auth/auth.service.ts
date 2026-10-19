import { clearCache } from "@/lib/cache";
import { supabase } from "@/lib/supabase";

// Supabase Auth (email + password). Role 'profiles' table se aata hai.
export type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Staff";
};

const KEY = "erp.user";
function readSaved(id: string): User | null {
  try {
    const u = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as User | null;
    return u && u.id === id ? u : null;
  } catch {
    return null;
  }
}
function save(u: User | null) {
  try {
    if (u) sessionStorage.setItem(KEY, JSON.stringify(u));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

async function loadUser(id: string, email: string): Promise<User | null> {
  const u = await fetchUser(id, email);
  save(u);
  return u;
}

async function fetchUser(id: string, email: string): Promise<User | null> {
  const { data } = await supabase.from("profiles").select("full_name, role").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id,
    email,
    name: data.full_name || email.split("@")[0],
    role: data.role === "admin" ? "Admin" : "Staff",
  };
}

// Page khulte hi: pehle se login hai ya nahi (session browser me saved hota hai)
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  // Profile pehle se saved ho to turant use karo (network ka wait nahi), piche se refresh
  const saved = readSaved(u.id);
  if (saved) {
    void loadUser(u.id, u.email ?? "").then((fresh) => {
      if (!fresh) void supabase.auth.signOut();
    });
    return saved;
  }
  const user = await loadUser(u.id, u.email ?? "");
  if (!user) await supabase.auth.signOut();
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password" : error.message);
  }
  const user = await loadUser(data.user.id, data.user.email ?? email);
  if (!user) {
    await supabase.auth.signOut();
    throw new Error("Aapka account ERP me add nahi hua hai. Admin se baat karo.");
  }
  return user;
}

export async function signOut(): Promise<void> {
  clearCache();
  save(null);
  await supabase.auth.signOut();
}