"use client";

import { useActionState, useState, type ReactNode } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { LEVELS } from "@/validations/student";
import { EMERGENCY_CONTACT_RELATIONSHIPS, REFERRAL_SOURCES } from "@/validations/registration";
import { formatLevel, EMERGENCY_CONTACT_LABELS, REFERRAL_SOURCE_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { QrDisplay } from "@/components/registration/qr-display";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
type RegisteredResult = { name: string; loginCode: string; qrDataUrl: string };
type FormState = { error?: string } | undefined;

export function RegistrationFlow({
  onSubmitAction,
  footer,
}: {
  onSubmitAction: (input: unknown) => Promise<ActionResult<{ studentId: string; loginCode: string }>>;
  footer?: (result: RegisteredResult) => ReactNode;
}) {
  const [result, setResult] = useState<RegisteredResult | null>(null);
  const [isMapStudent, setIsMapStudent] = useState(true);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const res = await onSubmitAction({
      name: formData.get("name"),
      level: formData.get("level"),
      contactNumber: formData.get("contactNumber"),
      schoolName: formData.get("schoolName"),
      email: formData.get("email"),
      isMapStudent: formData.get("isMapStudent"),
      emergencyContactName: formData.get("emergencyContactName"),
      emergencyContactRelationship: formData.get("emergencyContactRelationship"),
      emergencyContactPhone: formData.get("emergencyContactPhone"),
      referralSource: formData.get("referralSource") || undefined,
    });
    if (!res.success) return { error: res.error };

    const qrDataUrl = await generateQrDataUrl(res.data.loginCode);
    setResult({ name: String(formData.get("name")), loginCode: res.data.loginCode, qrDataUrl });
    return undefined;
  }

  const [state, formAction, isPending] = useActionState(action, undefined);

  if (result) {
    return (
      <div className="space-y-4">
        <QrDisplay name={result.name} loginCode={result.loginCode} qrDataUrl={result.qrDataUrl} />
        {footer?.(result)}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="isMapStudent" value={isMapStudent ? "true" : "false"} />

      <div className="space-y-2">
        <Label htmlFor="name">Student name</Label>
        <Input id="name" name="name" required minLength={2} autoComplete="name" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="level">School level</Label>
          <NativeSelect id="level" name="level" required defaultValue="">
            <option value="" disabled>
              Select level
            </option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {formatLevel(level)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactNumber">Contact number</Label>
          <Input id="contactNumber" name="contactNumber" type="tel" required autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolName">School name</Label>
        <Input id="schoolName" name="schoolName" required minLength={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-2">
        <Label>Are you an MAP student?</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={isMapStudent ? "default" : "outline"}
            onClick={() => setIsMapStudent(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={!isMapStudent ? "default" : "outline"}
            onClick={() => setIsMapStudent(false)}
          >
            No
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">Emergency contact name</Label>
        <Input id="emergencyContactName" name="emergencyContactName" required minLength={2} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
          <NativeSelect id="emergencyContactRelationship" name="emergencyContactRelationship" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {EMERGENCY_CONTACT_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {EMERGENCY_CONTACT_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Contact number</Label>
          <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" required autoComplete="tel" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralSource">How did you hear about Study Space? (optional)</Label>
        <NativeSelect id="referralSource" name="referralSource" defaultValue="">
          <option value="">Prefer not to say</option>
          {REFERRAL_SOURCES.map((r) => (
            <option key={r} value={r}>
              {REFERRAL_SOURCE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[var(--gradient-primary-start)] to-[var(--gradient-primary-end)] text-white hover:opacity-90"
      >
        {isPending ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
