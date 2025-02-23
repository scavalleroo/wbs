import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";

export const DatePickerComponent = ({
    date,
    setDate,
    minDate,
    placeholder
}: {
    date: Date | undefined,
    setDate: (date: Date | undefined) => void,
    minDate?: Date,
    placeholder: string
}) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-left font-normal bg-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : placeholder}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                    minDate ? isBefore(date, minDate) : isBefore(date, startOfToday())
                }
                initialFocus
            />
        </PopoverContent>
    </Popover>
);