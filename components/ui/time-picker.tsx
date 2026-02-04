"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);

  const [hours, setHours] = React.useState<string>("");
  const [minutes, setMinutes] = React.useState<string>("");

  // Track if we are currently editing to prevent external value updates from overwriting typed input
  const [isEditing, setIsEditing] = React.useState(false);

  // Initialize state from value prop
  React.useEffect(() => {
    if (value && !isEditing) {
      const [h, m] = value.split(":");
      setHours(h || "");
      setMinutes(m || "");
    } else if (!value && !isEditing) {
      setHours("");
      setMinutes("");
    }
  }, [value, isEditing]);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    if (onChange) {
      // Ensure 2 digits
      const formattedHours = newHours.padStart(2, "0");
      const formattedMinutes = newMinutes.padStart(2, "0");
      onChange(`${formattedHours}:${formattedMinutes}`);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    let val = e.target.value.replace(/[^0-9]/g, ""); // Only numbers
    if (val.length > 2) val = val.slice(0, 2);

    // Validate range 0-23
    const num = parseInt(val);
    if (!isNaN(num)) {
      if (num > 23) val = "23";
    }

    setHours(val);

    if (val.length === 2) {
      // Trigger update immediately if valid 2 digits
      handleTimeChange(val, minutes || "00");
      // Auto-focus next input if we have minutes
      minuteRef.current?.focus();
    }
  };

  const handleHourBlur = () => {
    setIsEditing(false);
    // Pad with 0 on blur
    let val = hours;

    // If empty on blur, keep it empty or reset to 00 only if minutes are set?
    // Let's standard behavior: if empty and minutes set, assume 00. If both empty, clear.
    if (val === "" && minutes === "") return;

    if (val === "") val = "00";
    else if (val.length === 1) val = "0" + val;

    setHours(val);
    handleTimeChange(val, minutes || "00");
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 2) val = val.slice(0, 2);

    // Validate range 0-59
    const num = parseInt(val);
    if (!isNaN(num)) {
      if (num > 59) val = "59";
    }

    setMinutes(val);

    if (val.length === 2) {
      handleTimeChange(hours || "00", val);
    }
  };

  const handleMinuteBlur = () => {
    setIsEditing(false);
    let val = minutes;

    if (val === "" && hours === "") return;

    if (val === "") val = "00";
    else if (val.length === 1) val = "0" + val;

    setMinutes(val);
    handleTimeChange(hours || "00", val);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal px-3",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4 opacity-50" />
          {value ? value : "Pilih jam"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex items-end gap-2">
          <div className="grid gap-1 text-center">
            <Label htmlFor="hours" className="text-xs">
              Jam
            </Label>
            <Input
              ref={hourRef}
              id="hours"
              className="w-[64px] text-center font-mono text-base"
              placeholder="00"
              value={hours}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
            />
          </div>
          <span className="pb-2 text-xl font-bold">:</span>
          <div className="grid gap-1 text-center">
            <Label htmlFor="minutes" className="text-xs">
              Menit
            </Label>
            <Input
              ref={minuteRef}
              id="minutes"
              className="w-[64px] text-center font-mono text-base"
              placeholder="00"
              value={minutes}
              onChange={handleMinuteChange}
              onBlur={handleMinuteBlur}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
