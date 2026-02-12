"use client";

import { X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";
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
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full pl-3 text-left font-normal pr-12",
              !value && "text-muted-foreground",
              buttonClassName,
            )}
          >
            {value ? (
              format(new Date(value), "PPP", { locale: idLocale })
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon
              className={cn("ml-auto h-4 w-4 opacity-50", iconClassName)}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={defaultMonth ?? selectedDate}
            onSelect={onChange}
            disabled={(date) => date < new Date("1900-01-01")}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
