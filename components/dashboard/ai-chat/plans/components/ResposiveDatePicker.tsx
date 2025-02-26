import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react'; // Assuming you're using lucide-react
import { format, startOfToday, isBefore } from 'date-fns'; // Assuming you have date-fns installed
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component in your UI library
import { SelectSingleEventHandler } from 'react-day-picker';

interface ResponsiveDatePickerProps {
    targetDate: Date;
    handleTargetDateChange: SelectSingleEventHandler | undefined;
    goal: string;
    handleGoalChange: (goal: string) => void;
    isLoading: boolean;
    handleSubmit: () => void;
}

export const ResponsiveDatePicker = ({ targetDate, handleTargetDateChange, goal, handleGoalChange, isLoading, handleSubmit }: ResponsiveDatePickerProps) => {
    return (
        <div className="flex flex-col w-full gap-4">
            {/* Date selection row - stays inline */}
            <div className="flex flex-row items-center flex-wrap gap-2 justify-center w-full">
                <span className="text-base sm:text-lg font-medium dark:text-gray-200">By</span>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 text-left font-normal bg-white dark:bg-gray-800 dark:text-gray-200">
                            <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            {targetDate ? format(targetDate, 'PPP') : "Select date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        {isLoading ?
                            <p>{format(targetDate, 'PPP')}</p>
                            :
                            <Calendar
                                mode="single"
                                selected={targetDate}
                                onSelect={handleTargetDateChange}
                                disabled={(date) => isBefore(date, startOfToday())}
                                initialFocus
                                defaultMonth={targetDate}
                                className="dark:bg-gray-800 dark:text-gray-200"
                            />
                        }
                    </PopoverContent>
                </Popover>
                <span className="text-base sm:text-lg font-medium dark:text-gray-200">, I aim to</span>
            </div>

            {/* Goal input - on a new line with auto-expanding height */}
            <div className="w-full">
                <Textarea
                    value={goal}
                    onChange={(e) => handleGoalChange(e.target.value)}
                    placeholder="Type your goal here..."
                    style={{ fontSize: '1rem', lineHeight: '1.5' }}
                    disabled={isLoading}
                    className="w-full min-h-[80px] max-h-[200px] text-center resize-none overflow-y-auto text-base font-normal bg-white dark:bg-gray-800 dark:text-gray-200 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                    }}
                />
            </div>
        </div>
    );
};