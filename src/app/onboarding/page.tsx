import { OnboardingForm } from "@/components/auth/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <OnboardingForm />
    </main>
  );
}
