"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { regenerateLoginCode } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginCodeCard({ studentId, initialCode }: { studentId: string; initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateLoginCode(studentId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCode(result.data.loginCode);
      toast.success("New code generated — the old one no longer works.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Student portal login code</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-semibold tracking-[0.3em]">{code}</span>
        <Button type="button" variant="outline" size="sm" onClick={handleRegenerate} disabled={isPending}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {isPending ? "Generating..." : "Regenerate"}
        </Button>
      </CardContent>
    </Card>
  );
}
