// ============================================================================
// supabaseServer.ts — Supabase client chạy trên SERVER (Route Handlers)
// ----------------------------------------------------------------------------
// - getServerSupabase(): client theo phiên đăng nhập của user (RLS bật).
//   Dùng cho mọi thao tác thay mặt user.
// - getServiceSupabase(): client service_role (BYPASS RLS).
//   CHỈ dùng trong Route Handlers cho: ghi xp_events (append-only),
//   form public ẩn danh, cron, thao tác admin đã kiểm tra quyền.
//   KHÔNG BAO GIỜ import file này từ client component.
// ============================================================================
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Bỏ qua khi gọi từ Server Component (không set được cookie)
        }
      },
    },
  });
}

let serviceClient: ReturnType<typeof createClient> | null = null;

/** Service-role client: bypass RLS. Chỉ dùng trong Route Handlers. */
export function getServiceSupabase() {
  if (serviceClient) return serviceClient;
  serviceClient = createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
