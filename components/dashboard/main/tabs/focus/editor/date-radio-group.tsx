import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface DateRadioGroupProps {
    selectedDate: Date;
    days: Date[];
    isOverflowing: boolean;
    isPending: boolean;
    onChangeDate: (date: Date) => void;
}

const DateRadioGroup = ({ selectedDate, days, isOverflowing, isPending, onChangeDate }: DateRadioGroupProps) => {
    const [date, setDate] = useState<Date>(selectedDate);
    const [finalDays, setFinalDays] = useState<Date[]>(days);
    const maxOverflow = 2;

    useEffect(() => {
        let finalDays: Date[] = [];

        if (isOverflowing) {
            let selectedIndex = days.findIndex(day => day.toDateString() === date.toDateString());

            if (selectedIndex < 0) {
                selectedIndex = days.findIndex(day => day.toDateString() === selectedDate.toDateString());
            }

            if (selectedIndex <= 1) {
                finalDays = days.slice(0, maxOverflow);
            } else if (selectedIndex >= days.length - (maxOverflow - 2)) {
                finalDays = days.slice(-maxOverflow);
            } else {
                finalDays = days.slice(selectedIndex - 1, selectedIndex + (maxOverflow - 1));
            }
        } else {
            finalDays = days;
        }

        setFinalDays(finalDays);
        setDate(selectedDate);
    }, [selectedDate, isOverflowing]);

    const formatDateLabel = (day: Date, index: number) => {
        const isToday = day.toDateString() === new Date().toDateString();

        if (isOverflowing) {
            return `${day.getDate()} ${day.toLocaleString('default', { month: 'short' })}${isToday ? ' (Today)' : ''}`;
        }

        return (
            <>
                <span className="block text-xs">
                    {index === 0 ? `${day.toLocaleString('default', { month: 'short' })} ${day.getFullYear()}` :
                        `${day.toLocaleString('default', { month: 'short' })}`}
                </span>
                <span className="block text-xs">
                    {isToday ? 'Today' : `${day.toLocaleString('default', { weekday: 'short' })} ${day.getDate()}`}
                </span>
            </>
        );
    };

    return (
        <div className="flex gap-1 overflow-x-auto w-full">
            {finalDays.map((day, index) => (
                <Button
                    key={day.toDateString()}
                    variant="ghost"
                    size="sm"
                    className={`
                        rounded-md border px-3 py-1 text-sm transition-colors relative flex-1
                        ${day.toDateString() === selectedDate.toDateString()
                            ? "bg-white text-indigo-600 border-transparent"
                            : "bg-transparent text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-20"}
                        whitespace-nowrap
                    `}
                    onClick={() => {
                        setDate(day);
                        onChangeDate(day);
                    }}
                    disabled={isPending && day.toDateString() === selectedDate.toDateString()}
                >
                    {isPending && day.toDateString() === selectedDate.toDateString() && (
                        <Loader className="absolute top-1 right-1 h-3 w-3 animate-spin text-indigo-600" />
                    )}
                    {formatDateLabel(day, index)}
                </Button>
            ))}
        </div>
    );
};

export default DateRadioGroup;