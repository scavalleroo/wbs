import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { addDays, subDays } from 'date-fns';
import { PlanService } from '../planDetail/service';
import { PlanActivity } from '@/types/plan';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MonthView } from './MonthView';
import { WeekViewTimeGrid } from './WeekView/WeekViewTimeGrid';
import { CalendarHeader } from './CalendarHeader';
import { toast } from '@/hooks/use-toast';
import { DayViewTimeGrid } from './DayView/DayViewTimeGrid';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import GoogleCalendarService from '@/services/GoogleCalendarService';
import { CalendarSyncIcon } from 'lucide-react';

const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activities, setActivities] = useState<PlanActivity[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [view, setView] = useState('week');
    const [isSyncing, setSyncing] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const screenSize = useScreenSize();
    const supabase = createClient();

    useEffect(() => {
        // Check if the user is logged in with Google
        const checkGoogleAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session && data.session.user.app_metadata.provider === 'google') {
                setIsGoogleUser(true);
            }
        };

        checkGoogleAuth();
    }, []);

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

    const handleGoogleCalendarSync = async () => {
        setSyncing(true);
        try {
            // Check if user is authenticated with Google
            if (!isGoogleUser) {
                toast({
                    title: "Error",
                    description: "You need to be logged in with Google to sync your calendar",
                    variant: "destructive",
                });
                return;
            }

            // Initialize Google API and fetch events
            await GoogleCalendarService.initializeGoogleAPI();
            const googleEvents = await GoogleCalendarService.fetchEvents(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), // First day of current month
                31 // Approximately one month of events
            );

            // Convert Google Calendar events to PlanActivity format
            const newActivities = await GoogleCalendarService.convertToActivities(googleEvents);

            // Save the new activities to your database using Supabase
            const { data: savedActivities, error } = await supabase
                .from('plan_activities')
                .upsert(
                    newActivities.map(activity => ({
                        ...activity,
                        // Add any required fields from your schema
                        user_id: supabase.auth.getUser().then(res => res.data.user?.id),
                        // If the activity has a google_event_id, use it to prevent duplicates
                        ...(activity.google_event_id && { google_event_id: activity.google_event_id })
                    })),
                    {
                        onConflict: 'google_event_id',
                        ignoreDuplicates: false
                    }
                )
                .select();

            if (error) throw error;

            // Refresh activities to show the newly added events
            const refreshedActivities = await PlanService.fetchMonthActivities(currentDate);
            setActivities(refreshedActivities || []);

            toast({
                title: "Success",
                description: `Successfully synced ${googleEvents.length} events from Google Calendar`,
                variant: "default",
            });
        } catch (error) {
            console.error("Error syncing with Google Calendar:", error);

            // Provide more specific error messages based on the error
            let errorMessage = "Failed to sync with Google Calendar";

            if (error instanceof Error) {
                if (error.message.includes("scope") || error.message.includes("permission")) {
                    errorMessage = "Additional calendar permissions required. Please reconnect your Google account.";
                } else if (error.message.includes("token")) {
                    errorMessage = "Your Google session has expired. Please log in again.";
                }
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSyncing(false);
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
                return <DayViewTimeGrid currentDate={currentDate} activities={getDayActivities(currentDate)} />;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CalendarHeader
                    view={view}
                    currentDate={currentDate}
                    onViewChange={handleViewChange}
                    onToday={goToToday}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />
                <Button
                    variant="outline"
                    onClick={handleGoogleCalendarSync}
                    disabled={isSyncing || !isGoogleUser}
                    className="ml-auto"
                    title={!isGoogleUser ? "You need to be logged in with Google to sync your calendar" : ""}
                >
                    <CalendarSyncIcon className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Google Calendar'}
                </Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default CalendarView;