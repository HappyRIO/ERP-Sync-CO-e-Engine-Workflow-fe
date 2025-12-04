import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={(date) => {
            if (minDate) {
              // Compare dates by setting time to midnight
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              const compareMinDate = new Date(minDate);
              compareMinDate.setHours(0, 0, 0, 0);
              return compareDate < compareMinDate;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

