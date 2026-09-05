import * as React from "react";
import { Popover as P } from "radix-ui";
import { cn } from "./cn";

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;

export function PopoverContent({ className, align = "start", ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none", className)}
        {...props}
      />
    </P.Portal>
  );
}
