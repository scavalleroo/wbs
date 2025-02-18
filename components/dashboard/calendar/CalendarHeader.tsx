import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select';

interface CalendarHeaderProps {
    view: string;
    currentDate: Date;
    onViewChange: (view: string) => void;
    onToday: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    view,
    currentDate,
    onViewChange,
    onToday,
    onPrevious,
    onNext,
}) => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
            <Button onClick={onToday} variant="outline" className="flex gap-2">
                <CalendarIcon className="h-4 w-4" />
                Today
            </Button>
            <Button variant="outline" size="icon" onClick={onPrevious}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onNext}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <div className="text-xl font-semibold">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
        </div>
        <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="w-32">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
            </SelectContent>
        </Select>
    </div>
);