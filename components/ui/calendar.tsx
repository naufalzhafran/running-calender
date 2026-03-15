"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      className={cn("p-3", className)}
      weekStartsOn={0}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center items-center relative h-9",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex justify-between items-center h-9",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 border-transparent bg-transparent hover:bg-accent hover:border-border"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 border-transparent bg-transparent hover:bg-accent hover:border-border"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 text-center text-xs font-medium text-muted-foreground w-9 h-9 flex items-center justify-center",
        weeks: "",
        week: "flex w-full mt-1",
        day: "flex-1 p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "w-9 h-9 p-0 font-normal text-sm mx-auto flex items-center justify-center rounded-md transition-colors aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90 [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today:
          "[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold",
        outside:
          "day-outside [&>button]:text-muted-foreground/40 [&>button]:opacity-50 aria-selected:[&>button]:bg-accent/50 aria-selected:[&>button]:text-muted-foreground aria-selected:[&>button]:opacity-30",
        disabled:
          "[&>button]:text-muted-foreground/30 [&>button]:opacity-50 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
        range_middle:
          "aria-selected:[&>button]:bg-accent aria-selected:[&>button]:text-accent-foreground aria-selected:[&>button]:rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const cls = cn("h-4 w-4", chevronClassName);
          return orientation === "left" ? (
            <ChevronLeft className={cls} />
          ) : (
            <ChevronRight className={cls} />
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
