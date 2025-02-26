"use client";

import { Plan } from "@/types/plan";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Calendar,
    Plus,
    Eye,
    CalendarPlus,
    CalendarMinus,
    Trash2,
    Search,
    Check,
    X,
    CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

type PlanWithCalendarStatus = Plan & {
    inCalendar: boolean;
};

type Activity = {
    id: number;
    title: string;
    plan_id: number;
    start_date: string;
    end_date: string;
    status: 'pending' | 'completed' | 'cancelled';
    plan_title?: string;
};

export default function PlansDisplay() {
    const [plans, setPlans] = useState<PlanWithCalendarStatus[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<PlanWithCalendarStatus[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [activityToDelete, setActivityToDelete] = useState<number | null>(null);
    const [isDeletePlanDialogOpen, setIsDeletePlanDialogOpen] = useState(false);
    const [isDeleteActivityDialogOpen, setIsDeleteActivityDialogOpen] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (plans.length > 0 && searchQuery) {
            const filtered = plans.filter(plan =>
                plan.title?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPlans(filtered);
        } else {
            setFilteredPlans(plans);
        }
    }, [searchQuery, plans]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log("No user found");
                return;
            }

            // Fetch plans
            const { data: plansData, error: plansError } = await supabase
                .from("plans")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (plansError) {
                console.error("Error fetching plans:", plansError);
                return;
            }

            // For each plan, check if it has any activities
            const plansWithCalendarStatus = await Promise.all(
                (plansData || []).map(async (plan) => {
                    const { count, error: activitiesError } = await supabase
                        .from("plan_activities")
                        .select("id", { count: "exact", head: true })
                        .eq("plan_id", plan.id);

                    if (activitiesError) {
                        console.error("Error checking plan activities:", activitiesError);
                    }

                    return {
                        ...plan,
                        inCalendar: count ? count > 0 : false,
                    };
                })
            );

            setPlans(plansWithCalendarStatus);
            setFilteredPlans(plansWithCalendarStatus);

            // Fetch today's activities
            const today = new Date();
            const formattedToday = format(today, 'yyyy-MM-dd');

            const { data: activitiesData, error: activitiesError } = await supabase
                .from("plan_activities")
                .select("*, plans(title)")
                .eq("plans.user_id", user.id)
                .gte("scheduled_timestamp", `${formattedToday}T00:00:00`)
                .lte("scheduled_timestamp", `${formattedToday}T23:59:59`);

            console.log("activitiesData", activitiesData);

            if (activitiesError) {
                console.error("Error fetching activities:", activitiesError);
                return;
            }

            // Format activities with plan title
            const formattedActivities = (activitiesData || []).map(activity => ({
                ...activity,
                plan_title: activity.plans?.title
            })) as Activity[];

            setTodayActivities(formattedActivities);

            // Calculate completion percentage
            if (formattedActivities.length > 0) {
                const completedCount = formattedActivities.filter(
                    activity => activity.status === 'completed'
                ).length;
                const percentage = Math.round((completedCount / formattedActivities.length) * 100);
                setCompletionPercentage(percentage);
            } else {
                setCompletionPercentage(0);
            }
        } catch (error) {
            console.error("Error in fetchData:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCalendar = async (planId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            if (currentStatus) {
                // Remove from calendar - delete plan_activities
                const { error } = await supabase
                    .from("plan_activities")
                    .delete()
                    .eq("plan_id", planId);

                if (error) throw error;
                toast({
                    title: "Success",
                    description: "Plan removed from calendar",
                });
            } else {
                // Add to calendar - logic to create plan_activities would go here
                const { data: planData } = await supabase
                    .from("plans")
                    .select("title, start_date, end_date")
                    .eq("id", planId)
                    .single();

                if (planData) {
                    const { data: { user } } = await supabase.auth.getUser();

                    const { error } = await supabase
                        .from("plan_activities")
                        .insert([
                            {
                                plan_id: planId,
                                user_id: user?.id,
                                title: `${planData.title} - Activity`,
                                start_date: new Date().toISOString(),
                                end_date: planData.end_date || new Date().toISOString(),
                                status: 'pending'
                            }
                        ]);

                    if (error) throw error;
                    toast({
                        title: "Success",
                        description: "Plan added to calendar",
                    });
                }
            }

            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Error toggling calendar status:", error);
            toast({
                title: "Error",
                description: "Failed to update calendar status",
                variant: "destructive",
            });
        }
    };

    const handleDeletePlanClick = (planId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPlanToDelete(planId);
        setIsDeletePlanDialogOpen(true);
    };

    const handleDeleteActivityClick = (activityId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setActivityToDelete(activityId);
        setIsDeleteActivityDialogOpen(true);
    };

    const confirmDeletePlan = async () => {
        if (!planToDelete) return;

        try {
            // First delete any related activities
            await supabase
                .from("plan_activities")
                .delete()
                .eq("plan_id", planToDelete);

            // Then delete the plan
            const { error } = await supabase
                .from("plans")
                .delete()
                .eq("id", planToDelete);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Plan deleted successfully",
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Error deleting plan:", error);
            toast({
                title: "Error",
                description: "Failed to delete plan",
                variant: "destructive",
            });
        } finally {
            setIsDeletePlanDialogOpen(false);
            setPlanToDelete(null);
        }
    };

    const confirmDeleteActivity = async () => {
        if (!activityToDelete) return;

        try {
            const { error } = await supabase
                .from("plan_activities")
                .delete()
                .eq("id", activityToDelete);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Activity deleted successfully",
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Error deleting activity:", error);
            toast({
                title: "Error",
                description: "Failed to delete activity",
                variant: "destructive",
            });
        } finally {
            setIsDeleteActivityDialogOpen(false);
            setActivityToDelete(null);
        }
    };

    const updateActivityStatus = async (activityId: number, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("plan_activities")
                .update({ status: newStatus })
                .eq("id", activityId);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Activity marked as ${newStatus}`,
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error("Error updating activity status:", error);
            toast({
                title: "Error",
                description: "Failed to update activity status",
                variant: "destructive",
            });
        }
    };

    const formatDueDate = (plan: Plan) => {
        return plan.end_date
            ? format(new Date(plan.end_date), "PPP")
            : "No deadline";
    };

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "h:mm a");
        } catch (e) {
            return "Invalid time";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
        }
    };

    // Component for the ring chart
    const CompletionRing = ({ percentage }: { percentage: number }) => {
        const radius = 40;
        const strokeWidth = 8;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{percentage}%</span>
                    <span className="text-xs text-gray-500">Completed</span>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="p-4 w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Your Plans</h2>
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-40 w-full mb-6" />
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-16 w-full mb-2" />
                <Skeleton className="h-16 w-full mb-2" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="p-4 w-full">
            <Tabs defaultValue="plans" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="plans">My Plans</TabsTrigger>
                    <TabsTrigger value="today">Today's Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="today">
                    <div className="flex flex-col lg:flex-row gap-6 mb-6">
                        <Card className="w-full lg:w-3/4">
                            <CardHeader>
                                <CardTitle>Today's Activities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {todayActivities.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No activities scheduled for today.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => router.push("/dashboard/plans/new")}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Plan
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Activity</TableHead>
                                                    <TableHead>Plan</TableHead>
                                                    <TableHead>Time</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {todayActivities.map((activity) => (
                                                    <TableRow key={activity.id}>
                                                        <TableCell className="font-medium">{activity.title}</TableCell>
                                                        <TableCell>{activity.plan_title}</TableCell>
                                                        <TableCell>{formatTime(activity.start_date)}</TableCell>
                                                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Select
                                                                    defaultValue={activity.status}
                                                                    onValueChange={(value) => updateActivityStatus(activity.id, value)}
                                                                >
                                                                    <SelectTrigger className="w-32 h-8">
                                                                        <SelectValue placeholder="Status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="pending">Pending</SelectItem>
                                                                        <SelectItem value="completed">Completed</SelectItem>
                                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8"
                                                                    onClick={(e) => handleDeleteActivityClick(activity.id, e)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="w-full lg:w-1/4">
                            <CardHeader>
                                <CardTitle>Daily Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <CompletionRing percentage={completionPercentage} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="plans">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold">Your Plans</h2>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search plans..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => router.push("/dashboard/plans/new")}
                                className="flex-shrink-0"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                <span>New Plan</span>
                            </Button>
                        </div>
                    </div>

                    {filteredPlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                            {searchQuery ? (
                                <>
                                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium text-center mb-4">No plans found matching "{searchQuery}"</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        Clear Search
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-12 w-12 text-primary/40 mb-4" />
                                    <p className="text-lg font-medium text-center mb-4">No plans yet</p>
                                    <Button
                                        onClick={() => router.push("/dashboard/plans/new")}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Generate your first plan</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table - Hidden on small screens */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/4">Title</TableHead>
                                            <TableHead className="w-1/4">Goal</TableHead>
                                            <TableHead className="w-1/6">Due Date</TableHead>
                                            <TableHead className="w-1/3 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPlans.map((plan) => (
                                            <TableRow
                                                key={plan.id}
                                                className="hover:bg-muted/50"
                                            >
                                                <TableCell className="font-medium">{plan.title}</TableCell>
                                                <TableCell className="text-muted-foreground line-clamp-1">{plan.goal}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>{formatDueDate(plan)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>

                                                        <Button
                                                            variant={plan.inCalendar ? "destructive" : "outline"}
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={(e) => toggleCalendar(plan.id, plan.inCalendar, e)}
                                                        >
                                                            {plan.inCalendar ? (
                                                                <>
                                                                    <CalendarMinus className="h-4 w-4 mr-2" />
                                                                    Remove
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                                                    Add
                                                                </>
                                                            )}
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={(e) => handleDeletePlanClick(plan.id, e)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card List - Only visible on small screens */}
                            <div className="md:hidden space-y-4">
                                {filteredPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-lg line-clamp-1">{plan.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{plan.goal}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDueDate(plan)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="justify-center"
                                                onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>

                                            <Button
                                                variant={plan.inCalendar ? "destructive" : "outline"}
                                                size="sm"
                                                className="justify-center"
                                                onClick={(e) => toggleCalendar(plan.id, plan.inCalendar, e)}
                                            >
                                                {plan.inCalendar ? (
                                                    <>
                                                        <CalendarMinus className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </>
                                                ) : (
                                                    <>
                                                        <CalendarPlus className="h-4 w-4 mr-2" />
                                                        Add
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="justify-center col-span-2"
                                                onClick={(e) => handleDeletePlanClick(plan.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Plan
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Delete Plan Confirmation Dialog */}
            <AlertDialog open={isDeletePlanDialogOpen} onOpenChange={setIsDeletePlanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the plan
                            and all associated activities.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeletePlanDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeletePlan} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Activity Confirmation Dialog */}
            <AlertDialog open={isDeleteActivityDialogOpen} onOpenChange={setIsDeleteActivityDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this activity.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteActivityDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteActivity} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}