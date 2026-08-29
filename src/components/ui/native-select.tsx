import * as React from "react";
import { cn } from "@/lib/utils";

// A plain native <select>, deliberately not the shadcn/Base UI Select — that
// primitive is a controlled listbox without guaranteed native form-field
// (name/FormData) integration, and these are simple admin forms submitting
// straight to a Server Action via FormData, not the core attendance UX.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
