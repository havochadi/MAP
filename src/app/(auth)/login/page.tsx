"use client";

import { useActionState } from "react";
import { loginAction, studentLoginAction, quickLoginAction } from "@/actions/coaches";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [coachState, coachFormAction, isCoachPending] = useActionState(loginAction, undefined);
  const [studentState, studentFormAction, isStudentPending] = useActionState(studentLoginAction, undefined);
  const [quickCoachState, quickCoachAction, isQuickCoachPending] = useActionState(quickLoginAction.bind(null, "coach"), undefined);
  const [quickAdminState, quickAdminAction, isQuickAdminPending] = useActionState(quickLoginAction.bind(null, "admin"), undefined);
  const [quickStudentState, quickStudentAction, isQuickStudentPending] = useActionState(
    quickLoginAction.bind(null, "student"),
    undefined,
  );
  const quickLoginError = quickCoachState?.error ?? quickAdminState?.error ?? quickStudentState?.error;

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-sky-50 via-muted/30 to-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo size={56} />
          <div>
            <h1 className="text-lg font-semibold">MAP Coach Portal</h1>
            <p className="text-sm text-muted-foreground">MENDAKI Achievement Programme</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-muted-foreground">Quick demo login</p>
          <div className="grid grid-cols-3 gap-2">
            <form action={quickCoachAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickCoachPending}>
                Coach
              </Button>
            </form>
            <form action={quickAdminAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickAdminPending}>
                Admin
              </Button>
            </form>
            <form action={quickStudentAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isQuickStudentPending}>
                Student
              </Button>
            </form>
          </div>
          {quickLoginError ? (
            <p role="alert" className="text-center text-xs text-destructive">
              {quickLoginError}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Signs in instantly with a seeded demo account.</p>
          )}
        </div>

        <Card>
          <Tabs defaultValue="coach">
            <CardHeader>
              <TabsList className="w-full">
                <TabsTrigger value="coach" className="flex-1">
                  Coach
                </TabsTrigger>
                <TabsTrigger value="student" className="flex-1">
                  Student
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="coach" className="space-y-4">
                <CardDescription>Sign in to take attendance and manage your classes.</CardDescription>
                <form action={coachFormAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  {coachState?.error && (
                    <p role="alert" className="text-sm text-destructive">
                      {coachState.error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isCoachPending}>
                    {isCoachPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <CardDescription>Enter the code your coach gave you to see your own attendance and progress.</CardDescription>
                <form action={studentFormAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Your code</Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      autoComplete="off"
                      autoCapitalize="characters"
                      placeholder="e.g. GHW7UD"
                      className="text-center text-lg tracking-[0.3em] uppercase"
                    />
                  </div>
                  {studentState?.error && (
                    <p role="alert" className="text-sm text-destructive">
                      {studentState.error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isStudentPending}>
                    {isStudentPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
