import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Target,
    Calendar,
    ChevronUp,
    ChevronDown,
    Filter,
    Search,
    Zap,
    X,
    List,
    LayoutGrid
} from 'lucide-react';
import { PlanOpenAI } from '@/types/plan';

// Types
interface DailyTask {
    time: string;
    duration: string;
    description: string;
    dayName: string;
    date: string;
}

interface TaskMetric {
    type: string;
    value: string;
}

interface WeekTask {
    description: string;
    metric: TaskMetric;
    daily_tasks?: Record<string, string>;
}

interface Plan {
    title: string;
    goals: string;
    end_date: string;
    tasks: Record<string, WeekTask>;
}

const PlanTimeline: React.FC<{ plan: PlanOpenAI }> = ({ plan }) => {
    const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
    const [taskViewPreference, setTaskViewPreference] = useState<Record<string, 'list' | 'calendar'>>({});
    const [filterActive, setFilterActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Set initial value
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize the first week as expanded with list view as default
    useEffect(() => {
        if (plan.tasks && Object.keys(plan.tasks).length > 0) {
            const firstWeek = Object.keys(plan.tasks)[0];
            setExpandedWeeks({ [firstWeek]: true });

            // Set default view preferences for all weeks
            const defaultPreferences: Record<string, 'list' | 'calendar'> = {};
            Object.keys(plan.tasks).forEach(period => {
                defaultPreferences[period] = 'calendar';
            });
            setTaskViewPreference(defaultPreferences);
        }
    }, [plan.tasks]);

    const toggleWeek = (period: string) => {
        setExpandedWeeks(prev => ({
            ...prev,
            [period]: !prev[period]
        }));
    };

    const toggleViewMode = (period: string) => {
        setTaskViewPreference(prev => ({
            ...prev,
            [period]: prev[period] === 'list' ? 'calendar' : 'list'
        }));
    };

    const toggleAllWeeks = (expand: boolean) => {
        const newState: Record<string, boolean> = {};
        Object.keys(plan.tasks).forEach(period => {
            newState[period] = expand;
        });
        setExpandedWeeks(newState);
    };

    // Function to highlight search terms
    const highlightText = (text: string) => {
        if (!searchQuery.trim()) return text;

        const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === searchQuery.toLowerCase()
                ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded">{part}</mark>
                : part
        );
    };

    // Helper to escape special regex characters
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const parseDailyTasks = (dailyTasks: Record<string, string>) => {
        return Object.entries(dailyTasks).reduce((acc, [day, description]) => {
            // Updated regex pattern to correctly extract day, date, time, and duration
            const parts = day.match(/^([^(]+)\s*\((\d{1,2}\/\d{1,2})\),\s*\((\d{1,2}:\d{2}),\s*(\d+)\s*minutes\)$/);

            if (!parts) {
                console.error("No match for:", day);
                return acc;
            }

            const dayName = parts[1].trim();
            const date = parts[2];
            const time = parts[3];
            const duration = parts[4];

            const dayKey = `${dayName} (${date})`;

            if (!acc[dayKey]) {
                acc[dayKey] = [];
            }

            acc[dayKey].push({
                time,
                duration,
                description,
                dayName,
                date
            });

            return acc;
        }, {} as Record<string, Array<DailyTask>>);
    };

    const renderListView = (dailyTasks: Record<string, string>) => {
        const tasksByDay = parseDailyTasks(dailyTasks);

        return Object.entries(tasksByDay).map(([dayKey, activities]) => (
            <div key={dayKey} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded mb-2">
                <div className="font-medium text-sm md:text-base dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-1">{dayKey}</div>
                {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2 pl-2 md:pl-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                        <div className="min-w-[90px] md:min-w-[120px] text-xs md:text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1 inline-block" />
                            {activity.time}
                            <span className="hidden md:inline ml-1">({activity.duration} min)</span>
                            <span className="md:hidden ml-1">({activity.duration}m)</span>
                        </div>
                        <span className="flex-1 text-sm md:text-base dark:text-gray-300">
                            {highlightText(activity.description)}
                        </span>
                    </div>
                ))}
            </div>
        ));
    };

    const renderCalendarView = (dailyTasks: Record<string, string>) => {
        const tasksByDay = parseDailyTasks(dailyTasks);
        const days = Object.keys(tasksByDay);

        // Sort days by date if needed
        // days.sort((a, b) => {...});

        return (
            <div className="overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-fr gap-2 min-w-full">
                    {days.map(dayKey => {
                        const activities = tasksByDay[dayKey];
                        const dayParts = dayKey.split(' ');
                        const dayName = dayParts[0];
                        const dateWithParens = dayParts.length > 1 ? dayParts[1] : '';
                        const date = dateWithParens.replace(/[()]/g, '');

                        return (
                            <div key={dayKey} className="flex flex-col h-full md:min-h-[180px] bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700 text-center">
                                    <div className="font-medium text-sm">{dayName}</div>
                                    <div className="text-xs text-gray-500">{date}</div>
                                </div>
                                <div className="p-2 flex-1 overflow-y-auto">
                                    {activities.map((activity, idx) => (
                                        <div
                                            key={idx}
                                            className="mb-2 p-2 bg-white dark:bg-gray-700 rounded border-l-4 border-blue-400 dark:border-blue-500 shadow-sm hover:shadow-md transition-shadow text-sm"
                                        >
                                            <div className="font-medium mb-1 flex justify-between items-center">
                                                <span className='text-gray-500'>{activity.time}</span>
                                                <span className="text-xs text-gray-500">
                                                    {parseInt(activity.duration) >= 60
                                                        ? `${Math.floor(parseInt(activity.duration) / 60)}h ${parseInt(activity.duration) % 60}m`
                                                        : `${parseInt(activity.duration)}m`}
                                                </span>
                                            </div>
                                            <div className="text-sm dark:text-gray-300">
                                                {highlightText(activity.description)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const filteredTasks = Object.entries(plan.tasks).filter(([period, task]) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        // Check if the week description or any daily task matches the search
        return (
            task.description.toLowerCase().includes(query) ||
            (task.daily_tasks &&
                Object.values(task.daily_tasks).some(desc =>
                    desc.toLowerCase().includes(query)
                ))
        );
    });

    return (
        <Card className="w-full mb-4">
            <CardHeader className="md:pb-0">
                <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl md:text-2xl">{plan.title}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterActive(!filterActive)}
                            className="text-xs md:text-sm h-8 w-8 md:h-9 md:w-9 p-1"
                        >
                            <Filter className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                    </div>

                    {filterActive && (
                        <div className="flex items-center gap-2 pb-2 pt-1 transition-all animate-in fade-in">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-8 pl-8 pr-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAllWeeks(true)}
                                className="text-xs h-8 whitespace-nowrap"
                            >
                                Expand All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAllWeeks(false)}
                                className="text-xs h-8 whitespace-nowrap"
                            >
                                Collapse All
                            </Button>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:gap-6 pt-1">
                        <div className="flex flex-row gap-2 items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{plan.goals}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6">
                <div className="space-y-3 md:space-y-4">
                    {filteredTasks.map(([period, task]) => {
                        const [weekLabel, dateRange] = period.split(' (');
                        const dates = dateRange ? dateRange.replace(')', '') : '';
                        const hasDaily = task.daily_tasks && Object.keys(task.daily_tasks).length > 0;
                        const currentViewMode = taskViewPreference[period] || 'calendar';

                        return (
                            <Card key={period} className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-600">
                                <CardContent className="p-3 md:p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2 items-start">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md text-center min-w-[40px]">
                                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{weekLabel.split(' ')[0]}</div>
                                                <div className="text-sm font-bold dark:text-gray-200">{weekLabel.split(' ')[1]}</div>
                                            </div>

                                            <div>
                                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{dates}</p>
                                                <p className="font-medium text-sm md:text-base dark:text-gray-200 mt-1">
                                                    {highlightText(task.description)}
                                                </p>

                                                <div className="mt-2 flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3 md:w-4 md:h-4" />
                                                        <span className="font-medium dark:text-gray-300">Metric:</span>
                                                        {task.metric.value} ({task.metric.type})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            {hasDaily && expandedWeeks[period] && (
                                                <button
                                                    onClick={() => toggleViewMode(period)}
                                                    aria-label={currentViewMode === 'list' ? "Switch to calendar view" : "Switch to list view"}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-1 transition-colors"
                                                    title={currentViewMode === 'list' ? "Calendar view" : "List view"}
                                                >
                                                    {currentViewMode === 'list' ?
                                                        <LayoutGrid className="w-4 h-4" /> :
                                                        <List className="w-4 h-4" />
                                                    }
                                                </button>
                                            )}

                                            {hasDaily && (
                                                <button
                                                    onClick={() => toggleWeek(period)}
                                                    aria-label={expandedWeeks[period] ? "Collapse details" : "Expand details"}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                >
                                                    {expandedWeeks[period] ?
                                                        <ChevronUp className="w-4 h-4" /> :
                                                        <ChevronDown className="w-4 h-4" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {hasDaily && expandedWeeks[period] && (
                                        <div className="mt-3 md:mt-4 animate-in slide-in-from-top duration-300">
                                            {task.daily_tasks && (
                                                currentViewMode === 'list'
                                                    ? renderListView(task.daily_tasks)
                                                    : renderCalendarView(task.daily_tasks)
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredTasks.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No tasks found matching your search.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                        >
                            Clear Search
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PlanTimeline;