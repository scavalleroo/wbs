// CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { addDays, subDays } from 'date-fns';
import { PlanService } from '../planDetail/service';
import { PlanActivity } from '@/types/plan';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MonthView } from './MonthView';
import { WeekViewTimeGrid } from './WeekView/WeekViewTimeGrid';
import { DayView } from './DayView';
import { CalendarHeader } from './CalendarHeader';
import { toast } from '@/hooks/use-toast';

const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activities, setActivities] = useState<PlanActivity[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [view, setView] = useState('week');
    const screenSize = useScreenSize();

    useEffect(() => {
        if (screenSize === 'sm') {
            setView('day');
        } else if (screenSize === 'md') {
            setView('week');
        }
    }, [screenSize]);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const plan_activities = await PlanService.fetchMonthActivities(currentDate);
                if (plan_activities) {
                    setActivities(plan_activities || []);
                }
            } catch (error) {
                console.error("Error fetching activities:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [currentDate]);

    const handleViewChange = (newView: string) => {
        setView(newView);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const goToPrevious = () => {
        switch (view) {
            case 'month':
                setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
                break;
            case 'week':
                setCurrentDate(prev => subDays(prev, 7));
                break;
            case 'day':
                setCurrentDate(prev => subDays(prev, 1));
                break;
        }
    };

    const goToNext = () => {
        switch (view) {
            case 'month':
                setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
                break;
            case 'week':
                setCurrentDate(prev => addDays(prev, 7));
                break;
            case 'day':
                setCurrentDate(prev => addDays(prev, 1));
                break;
        }
    };

    const getDayActivities = (date: Date) => {
        return activities.filter(activity =>
            new Date(activity.scheduled_timestamp).toDateString() === date.toDateString()
        );
    };

    const handleActivityUpdate = async (updatedActivity: PlanActivity) => {
        try {
            await PlanService.updateActivity(updatedActivity);
            // Update the local state
            setActivities(prevActivities =>
                prevActivities.map(activity =>
                    activity.id === updatedActivity.id ? updatedActivity : activity
                )
            );
            toast({
                title: "Success",
                description: "Activity updated successfully",
                variant: "default",
            });
        } catch (error) {
            console.error("Error updating activity:", error);
            toast({
                title: "Error",
                description: "Failed to update activity",
                variant: "destructive",
            });
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                </div>
            );
        }

        switch (view) {
            case 'month':
                return <MonthView currentDate={currentDate} activities={activities} />;
            case 'week':
                return <WeekViewTimeGrid currentDate={currentDate} activities={activities} onActivityUpdate={handleActivityUpdate} />;
            case 'day':
                return <DayView currentDate={currentDate} activities={getDayActivities(currentDate)} />;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <CalendarHeader
                    view={view}
                    currentDate={currentDate}
                    onViewChange={handleViewChange}
                    onToday={goToToday}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default CalendarView;