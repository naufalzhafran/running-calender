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

  // Use refs to store the current input values to avoid stale state issues
  const hoursRef = React.useRef<string>("");
  const minutesRef = React.useRef<string>("");

  const [hours, setHours] = React.useState<string>("");
  const [minutes, setMinutes] = React.useState<string>("");

  // Track if we are currently editing to prevent external value updates from overwriting typed input
  const [isEditing, setIsEditing] = React.useState(false);

  // Initialize state from value prop
  React.useEffect(() => {
    if (value && !isEditing) {
      const [h, m] = value.split(":");
      const newH = h || "";
      const newM = m || "";
      setHours(newH);
      setMinutes(newM);
      hoursRef.current = newH;
      minutesRef.current = newM;
    } else if (!value && !isEditing) {
      setHours("");
      setMinutes("");
      hoursRef.current = "";
      minutesRef.current = "";
    }
  }, [value, isEditing]);

  const commitTime = (h: string, m: string) => {
    if (onChange) {
      const formattedHours = h.padStart(2, "0");
      const formattedMinutes = m.padStart(2, "0");
      onChange(`${formattedHours}:${formattedMinutes}`);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 2) val = val.slice(0, 2);

    // Validate range 0-23
    const num = parseInt(val);
    if (!isNaN(num) && num > 23) {
      val = "23";
    }

    setHours(val);
    hoursRef.current = val;

    // Auto-focus next input after a brief delay to let React update state
    if (val.length === 2) {
      setTimeout(() => {
        minuteRef.current?.focus();
      }, 0);
    }
  };

  const handleHourBlur = () => {
    // Use the ref value which is always current
    let val = hoursRef.current;

    // If both empty, don't commit anything
    if (val === "" && minutesRef.current === "") {
      setIsEditing(false);
      return;
    }

    // Pad to 2 digits
    if (val === "") val = "00";
    else if (val.length === 1) val = "0" + val;

    setHours(val);
    hoursRef.current = val;
    commitTime(val, minutesRef.current || "00");
    setIsEditing(false);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 2) val = val.slice(0, 2);

    // Validate range 0-59
    const num = parseInt(val);
    if (!isNaN(num) && num > 59) {
      val = "59";
    }

    setMinutes(val);
    minutesRef.current = val;
  };

  const handleMinuteBlur = () => {
    let val = minutesRef.current;

    // If both empty, don't commit
    if (val === "" && hoursRef.current === "") {
      setIsEditing(false);
      return;
    }

    // Pad to 2 digits
    if (val === "") val = "00";
    else if (val.length === 1) val = "0" + val;

    setMinutes(val);
    minutesRef.current = val;
    commitTime(hoursRef.current || "00", val);
    setIsEditing(false);
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
