import React, { useEffect, useRef, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

    useEffect(() => {
        let finalDays: Date[] = [];

        if (isOverflowing) {
            let selectedIndex = days.findIndex(day => day.toDateString() === date.toDateString());

            if (selectedIndex < 0) {
                selectedIndex = days.findIndex(day => day.toDateString() === selectedDate.toDateString());
            }

            if (selectedIndex <= 1) {
                finalDays = days.slice(0, 4);
            } else if (selectedIndex >= days.length - 2) {
                finalDays = days.slice(-4);
            } else {
                finalDays = days.slice(selectedIndex - 1, selectedIndex + 3);
            }
        } else {
            finalDays = days;
        }

        setFinalDays(finalDays);
        setDate(selectedDate);
    }, [selectedDate, isOverflowing]);

    return (
        <RadioGroup
            value={date.toDateString()}
            className="flex flex-row gap-1 overflow-x-hidden w-full px-1"
            onValueChange={(value) => {
                const selectedDay = days.find(day =>
                    day.toDateString() === value
                );
                if (selectedDay) {
                    setDate(selectedDay);
                    onChangeDate(selectedDay);
                }
            }}
        >
            {finalDays.map((day, index) => (
                <div className="flex-grow" key={index}>
                    <RadioGroupItem
                        value={day.toDateString()}
                        id={day.toDateString()}
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor={day.toDateString()}
                        className="flex min-h-10 
                        flex-col relative 
                        items-center 
                        rounded-md border-2 border-muted bg-popover 
                        py-1 md:px-1 md:py-0.5 hover:bg-accent hover:text-accent-foreground 
                        cursor-pointer
                        text-sm 
                        border border-transparent
                        transition-colors duration-200
                        bg-secondary 
                        hover:bg-accent 
                        peer-data-[state=checked]:bg-primary 
                        peer-data-[state=checked]:text-primary-foreground
                        peer-data-[state=checked]:border-primary
                        whitespace-nowrap
                        text-nowrap w-full h-full justify-center
                        "
                    >
                        {isPending && day.toDateString() == date.toDateString() ? <Loader className="absolute text-muted-foreground top-1 right-2 h-4 w-4 animate-[spin_3s_linear_infinite]" /> : ''}
                        <p
                            className={`text-xs`}
                        >
                            {
                                index === 0 ?
                                    `${day.toLocaleString('default', { month: 'short' })} ${day.getFullYear()}` :
                                    `${day.toLocaleString('default', { month: 'short' })}`
                            }
                            {day.toDateString() === new Date().toDateString() ? ` ${day.getDate()}` : ''}
                        </p>
                        {day.toDateString() === new Date().toDateString() && !isOverflowing ? (
                            <p className={`text-xs ${day.toDateString() !== date.toDateString() ? 'text-primary' : 'text-primary-foreground'}`}>Today</p>
                        ) : <p className="text-xs">{day.toLocaleString('default', { weekday: 'short' })} {day.getDate()}</p>}

                    </Label>
                </div>
            ))}
        </RadioGroup>
    );
};

export default DateRadioGroup;