import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react'; // Assuming you're using lucide-react
import { format, startOfToday, isBefore } from 'date-fns'; // Assuming you have date-fns installed

export const ResponsiveDatePicker = ({ targetDate, handleTargetDateChange }: { targetDate: Date | undefined, handleTargetDateChange: (date: Date | undefined) => void }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center">
            <span className="text-base sm:text-lg font-medium dark:text-gray-200">By</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto h-10 text-left font-normal bg-white dark:bg-gray-800 dark:text-gray-200">
                        <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {targetDate ? format(targetDate, 'PPP') : "Select date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={handleTargetDateChange}
                        disabled={(date) => isBefore(date, startOfToday())}
                        initialFocus
                        defaultMonth={targetDate}
                        className="dark:bg-gray-800 dark:text-gray-200"
                    />
                </PopoverContent>
            </Popover>
            <span className="text-base sm:text-lg font-medium dark:text-gray-200">, I am to...</span>
        </div>
    );
};