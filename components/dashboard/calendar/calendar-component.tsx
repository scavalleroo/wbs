import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlanService } from '../planDetail/service';
import { PlanActivity } from '@/types/plan';

const MonthlyCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendar, setCalendar] = useState<Date[][]>([]);
    const [activities, setActivities] = useState<PlanActivity[]>([]);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivites = async () => {
            setLoading(true);
            try {
                const data = await PlanService.fetchMonthActivities(currentDate);
                if (data)
                    setActivities(data.plan_activities || []);
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

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getActivitiesForDate = (date: Date) => {
        return activities.filter(
            activity => activity.scheduled_date === formatDate(date)
        );
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="p-2 text-center font-semibold dark:text-gray-300">
                            {day}
                        </div>
                    ))}

                    {calendar.map((week, weekIndex) => (
                        <React.Fragment key={weekIndex}>
                            {week.map((date, dateIndex) => {
                                const dayActivities = getActivitiesForDate(date);
                                return (
                                    <div
                                        key={dateIndex}
                                        className={`
                      min-h-24 p-1 border rounded-lg
                      dark:border-gray-700
                      ${isToday(date)
                                                ? 'bg-blue-50 dark:bg-blue-950 dark:bg-opacity-50'
                                                : 'dark:bg-gray-800'}
                      ${!isCurrentMonth(date)
                                                ? 'bg-gray-50 dark:bg-gray-900'
                                                : ''}
                    `}
                                    >
                                        <div className={`
                      text-right text-sm mb-1
                      ${!isCurrentMonth(date)
                                                ? 'text-gray-500 dark:text-gray-500'
                                                : 'dark:text-gray-300'}
                    `}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {dayActivities.map(activity => (
                                                <div
                                                    key={activity.id}
                                                    className={`
                            p-2 text-xs rounded transition-colors
                            ${activity.status === 'Completed'
                                                            ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-50 dark:text-green-100'
                                                            : 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 dark:text-blue-100'}
                            hover:bg-opacity-80 dark:hover:bg-opacity-70 
                            cursor-pointer
                          `}
                                                    title={`Plan: ${activity.plan_id}`}
                                                >
                                                    <div className="font-semibold text-xs mb-0.5 dark:text-gray-300">
                                                        {activity.plan_id}
                                                    </div>
                                                    <div className="dark:text-gray-200">
                                                        {activity.description}
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
            </CardContent>
        </Card>
    );
};

export default MonthlyCalendar;