import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {missingEnv && (
        <div className="w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          إعدادات Supabase غير مكتملة على السيرفر. أضف{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
          <code className="font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          في Vercel ثم أعد النشر.
        </div>
      )}
      <LoginForm />
    </main>
  );
}
