import { ValidationError } from "./errors";
import type { Branch, BranchInput } from "@/types/branch";

export function cleanBranch(input: BranchInput, branches: Branch[], selfId?: string) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 60) throw new ValidationError("name is required (max 60 characters)");
  if (branches.some((b) => b.id !== selfId && b.name.toLowerCase() === name.toLowerCase())) {
    throw new ValidationError(`A branch named "${name}" already exists`);
  }

  let code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  if (code.length > 12) throw new ValidationError("code can be at most 12 characters");
  if (!code) {
    let n = 1;
    do {
      code = `BR-${String(n++).padStart(2, "0")}`;
    } while (branches.some((b) => b.id !== selfId && b.code === code));
  }
  if (branches.some((b) => b.id !== selfId && b.code.toUpperCase() === code)) {
    throw new ValidationError(`Code "${code}" is already used`);
  }

  const text = (v: unknown, max: number, label: string) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (s.length > max) throw new ValidationError(`${label} is too long (max ${max})`);
    return s;
  };

  return {
    name,
    code,
    address: text(input.address, 200, "address"),
    phone: text(input.phone, 20, "phone"),
    manager: text(input.manager, 60, "manager"),
  };
}