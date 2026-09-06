import { registerStudent } from "@/actions/registration";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { AppLogo } from "@/components/app-logo";

export default function PublicRegisterPage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-[color-mix(in_oklch,var(--gradient-primary-start),white_88%)] to-background px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <AppLogo size={48} />
          <h1 className="text-lg font-semibold">Study Space Registration</h1>
          <p className="text-sm text-muted-foreground">
            One-time sign-up — after this you&apos;ll get a QR code to bring on every future visit.
          </p>
        </div>
        <RegistrationFlow onSubmitAction={registerStudent} />
      </div>
    </div>
  );
}
