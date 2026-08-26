import { describe, expect, it } from "vitest";
import { createSupabaseStarterFiles } from "./supabaseStarter";

describe("Supabase website starter", () => {
  it("creates editable public-client guidance without a service-role secret", () => {
    const files = createSupabaseStarterFiles("موقع أطلس");
    expect(Object.keys(files)).toEqual(["supabase-config.js", "supabase-schema.sql", "SUPABASE_MOBILE_SETUP.md"]);
    expect(files["supabase-config.js"]).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(files["supabase-config.js"]).toContain("لا تضع service_role key");
    expect(files["supabase-schema.sql"]).toContain("enable row level security");
    expect(files["SUPABASE_MOBILE_SETUP.md"]).toContain("من الهاتف");
  });
});
