// shadcn-style Sheet and Dialog on Radix Dialog.
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "./cn";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

export function SheetContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <D.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-lg flex-col gap-0 overflow-y-auto border-l bg-background shadow-lg",
          className,
        )}
        {...props}
      >
        <D.Title className="sr-only">{title}</D.Title>
        <D.Description className="sr-only">Sitting details</D.Description>
        {children}
        <D.Close className="absolute top-3 right-3 rounded-sm p-1 opacity-70 hover:opacity-100 hover:bg-accent">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;

export function DialogContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof D.Content> & { title: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <D.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background shadow-xl",
          className,
        )}
        {...props}
      >
        <D.Title className="sr-only">{title}</D.Title>
        <D.Description className="sr-only">Sitting details</D.Description>
        {children}
        <D.Close className="absolute top-3 right-3 rounded-sm p-1 opacity-70 hover:opacity-100 hover:bg-accent">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
