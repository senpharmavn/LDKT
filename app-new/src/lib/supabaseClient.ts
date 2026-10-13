// ============================================================================
// supabaseClient.ts — Supabase client chạy trên TRÌNH DUYỆT (client component)
// ----------------------------------------------------------------------------
// Dùng @supabase/ssr để session lưu trong cookie, đồng bộ với Route Handlers.
// Chỉ dùng 2 biến NEXT_PUBLIC_* (an toàn để lộ ở client).
// KHÔNG bao giờ import service role ở đây.
// ============================================================================
"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Thiếu cấu hình NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
