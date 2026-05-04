"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import { DistanceDetail } from "@/types";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClearableInput } from "@/components/ui/clearable-input";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePickerField } from "@/components/admin/date-picker-field";

interface DistanceFieldsetProps {
  distance: DistanceDetail;
  index: number;
  eventDate: string;
  onChange: (index: number, field: keyof DistanceDetail, value: string) => void;
  onRemove: (index: number) => void;
  compact?: boolean;
}

export function DistanceFieldset({
  distance,
  index,
  eventDate,
  onChange,
  onRemove,
  compact,
}: DistanceFieldsetProps) {
  const labelSize = compact ? "text-xs" : "text-xs";
  const inputHeight = compact ? "h-8 text-sm" : "";
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(index, "date", format(date, "yyyy-MM-dd"));
  };

  return (
    <div className="p-4 rounded-lg border bg-muted/30 relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive z-10"
        onClick={() => onRemove(index)}
      >
        <X className={compact ? "w-3 h-3" : "w-4 h-4"} />
      </Button>

      <div className={`space-y-${compact ? "3" : "4"} pt-${compact ? "1" : "2"}`}>
        <div className={`space-y-${compact ? "1" : "2"}`}>
          <Label className={labelSize}>Nama Kategori</Label>
          <ClearableInput
            type="text"
            value={distance.name}
            onChange={(e) => onChange(index, "name", e.target.value)}
            onClear={() => onChange(index, "name", "")}
            placeholder="5K"
            required
            className={`bg-background ${inputHeight}`}
          />
        </div>

        <div className={`space-y-${compact ? "1" : "2"} flex flex-col`}>
          <Label className={labelSize}>Tanggal</Label>
          <DatePickerField
            value={distance.date}
            onChange={handleDateSelect}
            onClear={() => onChange(index, "date", "")}
            defaultMonth={
              distance.date
                ? new Date(distance.date)
                : eventDate
                  ? new Date(eventDate)
                  : undefined
            }
            buttonClassName={compact ? "h-8 text-sm" : "h-9"}
            iconClassName={compact ? "h-3 w-3" : ""}
          />
        </div>

        <div className={`grid grid-cols-2 gap-${compact ? "2" : "3"}`}>
          <div className={`space-y-${compact ? "1" : "2"}`}>
            <Label className={labelSize}>Start Time</Label>
            <div className="relative">
              <TimePicker
                value={distance.start_time}
                onChange={(val) => onChange(index, "start_time", val)}
                className={compact ? "h-8 text-sm pr-10" : "pr-10"}
              />
              {distance.start_time && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(index, "start_time", "");
                  }}
                >
                  <X className={compact ? "h-3 w-3" : "h-4 w-4"} />
                </Button>
              )}
            </div>
          </div>
          <div className={`space-y-${compact ? "1" : "2"}`}>
            <Label className={labelSize}>COT</Label>
            <div className="relative">
              <TimePicker
                value={distance.cot}
                onChange={(val) => onChange(index, "cot", val)}
                className={compact ? "h-8 text-sm pr-10" : "pr-10"}
              />
              {distance.cot && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(index, "cot", "");
                  }}
                >
                  <X className={compact ? "h-3 w-3" : "h-4 w-4"} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
