"use client";

import * as React from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { parseDateOnlyToLocalDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  value: string;
  onChange: (date: Date | undefined) => void;
  onClear: () => void;
  placeholder?: string;
  defaultMonth?: Date;
  buttonClassName?: string;
  iconClassName?: string;
}

export function DatePickerField({
  value,
  onChange,
  onClear,
  placeholder = "Pilih tanggal",
  defaultMonth,
  buttonClassName,
  iconClassName,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? parseDateOnlyToLocalDate(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal px-3 h-10 pr-14",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <CalendarIcon className={cn("mr-2 h-4 w-4 opacity-60", iconClassName)} />
            {value ? (
              format(selectedDate!, "EEEE, d MMMM yyyy", { locale: idLocale })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={defaultMonth ?? selectedDate}
            onSelect={handleSelect}
            locale={idLocale}
            initialFocus
            disabled={(date: Date) => date < new Date("1900-01-01")}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
