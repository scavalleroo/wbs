import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlanService } from '../planDetail/service';
import { PlanActivity } from '@/types/plan';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SelectTrigger } from '@radix-ui/react-select';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays, parseISO, differenceInMinutes, addMinutes } from 'date-fns';

const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
};

const WeekViewTimeGrid = ({ activities, currentDate }: { activities: PlanActivity[], currentDate: Date }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const HOUR_HEIGHT = 60; // 60px per hour
    const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
    const TOTAL_HEIGHT = HOUR_HEIGHT * 24; // Total height for all hours

    useEffect(() => {
        // Scroll to 8 AM by default
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT;
        }
    }, []);

    const getEventPosition = (startTime: string, endTime: string) => {
        const start = parseISO(startTime);
        const end = parseISO(endTime);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const duration = differenceInMinutes(end, start);

        return {
            top: startMinutes * MINUTE_HEIGHT,
            height: duration * MINUTE_HEIGHT,
        };
    };

    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] bg-background">
            {/* Fixed header section */}
            <div className="flex-none">
                {/* Days of the week header */}
                <div className="flex border-b">
                    <div className="w-16 flex-shrink-0" /> {/* Empty space for time column */}
                    {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex-1 p-2 text-center border-l">
                            <div className="font-semibold">
                                {format(day, 'EEE')}
                            </div>
                            <div className={`text-sm ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ? 'bg-blue-100 dark:bg-blue-900 rounded-full px-2'
                                : ''
                                }`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrollable grid section */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto relative"
            >
                <div className="flex absolute w-full" style={{ height: `${TOTAL_HEIGHT}px` }}>
                    {/* Time labels column - fixed position */}
                    <div className="w-16 flex-shrink-0 sticky left-0 bg-background z-10">
                        {HOURS.map(hour => (
                            <div
                                key={hour}
                                className="text-xs text-gray-500 text-right pr-2 flex items-center justify-end"
                                style={{ height: `${HOUR_HEIGHT}px`, marginTop: hour === 0 ? 0 : '-1px' }}
                            >
                                {format(new Date().setHours(hour, 0), 'ha')}
                            </div>
                        ))}
                    </div>

                    {/* Main grid */}
                    <div className="flex flex-1">
                        {weekDays.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className="flex-1 border-l relative"
                            >
                                {/* Hour grid lines */}
                                {HOURS.map(hour => (
                                    <div
                                        key={hour}
                                        className="border-b border-gray-200 dark:border-gray-800"
                                        style={{ height: `${HOUR_HEIGHT}px` }}
                                    />
                                ))}

                                {/* Events */}
                                {activities
                                    .filter(activity =>
                                        format(parseISO(activity.scheduled_timestamp), 'yyyy-MM-dd') ===
                                        format(day, 'yyyy-MM-dd')
                                    )
                                    .map(activity => {
                                        const startTime = parseISO(activity.scheduled_timestamp);
                                        const endTime = addMinutes(startTime, activity.duration || 60);
                                        const { top, height } = getEventPosition(
                                            activity.scheduled_timestamp,
                                            format(endTime, "yyyy-MM-dd'T'HH:mm:ss")
                                        );

                                        return (
                                            <div
                                                key={activity.id}
                                                className="absolute left-0 right-0 mx-1 rounded-lg p-2 overflow-hidden text-xs"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    backgroundColor: activity.status === 'Completed'
                                                        ? 'rgb(134 239 172 / 0.9)'
                                                        : 'rgb(147 197 253 / 0.9)',
                                                }}
                                            >
                                                <div className="font-semibold truncate">
                                                    {activity.description}
                                                </div>
                                                <div className="text-xs opacity-75">
                                                    {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendar, setCalendar] = useState<Date[][]>([]);
    const [activities, setActivities] = useState<PlanActivity[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<PlanActivity | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchActivites = async () => {
            setLoading(true);
            try {
                const plan_activities = await PlanService.fetchMonthActivities(currentDate);
                if (plan_activities) {
                    console.log(plan_activities);
                    setActivities(plan_activities || []);
                }
            } catch (error) {
                console.error("Error fetching plan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivites();
    }, [currentDate]);

    // Calendar generation effect remains the same
    useEffect(() => {
        const generateCalendar = () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const firstMonday = new Date(firstDay);
            while (firstMonday.getDay() !== 1) {
                firstMonday.setDate(firstMonday.getDate() - 1);
            }

            const lastSunday = new Date(lastDay);
            while (lastSunday.getDay() !== 0) {
                lastSunday.setDate(lastSunday.getDate() + 1);
            }

            const weeks: Date[][] = [];
            let currentWeek: Date[] = [];
            const current = new Date(firstMonday);

            while (current <= lastSunday) {
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
                currentWeek.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            if (currentWeek.length > 0) {
                weeks.push(currentWeek);
            }

            setCalendar(weeks);
        };

        generateCalendar();
    }, [currentDate]);

    useEffect(() => {
        console.log("Activities: ", activities);
    }, [activities]);

    const [view, setView] = useState('week');
    const [screenSize, setScreenSize] = useState('lg');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < BREAKPOINTS.sm) {
                setScreenSize('sm');
            } else if (width < BREAKPOINTS.md) {
                setScreenSize('md');
            } else {
                setScreenSize('lg');
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Auto-adjust view based on screen size if user hasn't manually changed it
        if (screenSize === 'sm') {
            setView('day');
        } else if (screenSize === 'md') {
            setView('week');
        }
    }, [screenSize]);

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const goToPrevious = () => {
        if (view === 'month') {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
        } else if (view === 'week') {
            setCurrentDate(prev => subDays(prev, 7));
        } else {
            setCurrentDate(prev => subDays(prev, 1));
        }
    };

    const goToNext = () => {
        if (view === 'month') {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
        } else if (view === 'week') {
            setCurrentDate(prev => addDays(prev, 7));
        } else {
            setCurrentDate(prev => addDays(prev, 1));
        }
    };

    const getDayActivities = (date: string | number | Date) => {
        return activities.filter(activity =>
            isSameDay(new Date(activity.scheduled_timestamp), date)
        );
    };

    const renderMonthView = () => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = startOfWeek(firstDayOfMonth);
        const endDate = endOfWeek(lastDayOfMonth);

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks = [];

        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        return (
            <div className="grid grid-cols-7 gap-1">
                <div className="col-span-7 grid grid-cols-7">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="p-2 text-center font-semibold">
                            <span className="hidden md:inline">{day}</span>
                            <span className="md:hidden">{day.charAt(0)}</span>
                        </div>
                    ))}
                </div>
                {weeks.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                        {week.map((day, dayIndex) => {
                            const dayActivities = getDayActivities(day);
                            return (
                                <div
                                    key={dayIndex}
                                    className={`
                    min-h-16 md:min-h-24 p-1 border rounded-lg
                    ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900' : ''}
                    ${day.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 dark:bg-gray-800' : ''}
                  `}
                                >
                                    <div className="text-right text-sm mb-1">
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1 max-h-24 md:max-h-32 overflow-y-auto">
                                        {dayActivities.map(activity => (
                                            <div
                                                key={activity.id}
                                                className="p-2 text-xs bg-blue-100 dark:bg-blue-800 rounded"
                                            >
                                                <div className="hidden md:block">{activity.description}</div>
                                                <div className="md:hidden">
                                                    {activity.description.slice(0, 20)}
                                                    {activity.description.length > 20 ? '...' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderWeekView = () => (
        <WeekViewTimeGrid
            activities={activities}
            currentDate={currentDate}
        />
    );

    const renderDayView = () => {
        const dayActivities = getDayActivities(currentDate);

        return (
            <div className="border rounded-lg p-4">
                <div className="text-center mb-4">
                    <div className="font-semibold text-lg">
                        {format(currentDate, 'EEEE')}
                    </div>
                    <div className="text-2xl font-bold">
                        {format(currentDate, 'MMMM d, yyyy')}
                    </div>
                </div>
                <div className="space-y-4">
                    {dayActivities.map(activity => (
                        <div
                            key={activity.id}
                            className="p-4 bg-blue-100 dark:bg-blue-800 rounded-lg"
                        >
                            <div className="font-semibold mb-2">{activity.plan.title}</div>
                            <div className="text-sm">{activity.description}</div>
                            <div className="text-xs text-gray-500 mt-2">
                                Status: {activity.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2">
                        <Button onClick={goToToday} variant="outline" className="flex gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Today
                        </Button>
                        <Button variant="outline" size="icon" onClick={goToPrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={goToNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardTitle className="text-center">
                        {view === 'month' && format(currentDate, 'MMMM yyyy')}
                        {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
                        {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
                    </CardTitle>
                    <Select value={view} onValueChange={setView}>
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
            </CardHeader>
            <CardContent>
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
            </CardContent>
        </Card>
    );
};

export default CalendarView;