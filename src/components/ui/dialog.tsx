"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(name: string): DialogContextValue {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error(`${name} must be used within <Dialog>.`);
  }
  return context;
}

type DialogProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
};

export function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChangeAction,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const titleId = React.useId();
  const descriptionId = React.useId();

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setUncontrolledOpen(nextOpen);
      onOpenChangeAction?.(nextOpen);
    },
    [isControlled, onOpenChangeAction],
  );

  const value = React.useMemo(
    () => ({ open, setOpen, titleId, descriptionId }),
    [open, setOpen, titleId, descriptionId],
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>(function DialogTrigger({ onClick, children, ...props }, ref) {
  const { setOpen } = useDialogContext("DialogTrigger");

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(true);
      }
    },
    [onClick, setOpen],
  );

  return (
    <button ref={ref} type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

DialogTrigger.displayName = "DialogTrigger";

type DialogPortalProps = {
  children: React.ReactNode;
};

export function DialogPortal({ children }: DialogPortalProps) {
  const { open } = useDialogContext("DialogPortal");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;
  return createPortal(children, document.body);
}

type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement>;

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  DialogOverlayProps
>(function DialogOverlay({ className, onClick, ...props }, ref) {
  const { open, setOpen } = useDialogContext("DialogOverlay");
  if (!open) return null;

  return (
    <div
      ref={ref}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(false);
        }
      }}
      className={cn(
        "fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]",
        className,
      )}
      {...props}
    />
  );
});

DialogOverlay.displayName = "DialogOverlay";

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(function DialogContent({ className, children, onKeyDown, ...props }, ref) {
  const { open, setOpen, titleId, descriptionId } =
    useDialogContext("DialogContent");
  if (!open) return null;

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </DialogPortal>
  );
});

DialogContent.displayName = "DialogContent";

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  DialogCloseProps
>(function DialogClose({ onClick, children, ...props }, ref) {
  const { setOpen } = useDialogContext("DialogClose");

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(false);
      }
    },
    [onClick, setOpen],
  );

  return (
    <button ref={ref} type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

DialogClose.displayName = "DialogClose";

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(function DialogTitle({ className, ...props }, ref) {
  const { titleId } = useDialogContext("DialogTitle");
  return (
    <h2
      ref={ref}
      id={titleId}
      className={cn(
        "text-base font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
});

DialogTitle.displayName = "DialogTitle";

type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(function DialogDescription({ className, ...props }, ref) {
  const { descriptionId } = useDialogContext("DialogDescription");
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn("text-sm text-muted", className)}
      {...props}
    />
  );
});

DialogDescription.displayName = "DialogDescription";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
