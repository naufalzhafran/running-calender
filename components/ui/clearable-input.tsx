"use client";

import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear: () => void;
}

export function ClearableInput({
  value,
  onClear,
  className,
  ...props
}: ClearableInputProps) {
  return (
    <div className="relative">
      <Input value={value} className={cn("pr-10", className)} {...props} />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
