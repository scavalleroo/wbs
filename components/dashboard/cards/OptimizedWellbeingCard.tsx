'use client';

import React, { useState, useEffect } from 'react';
import { HeartPulse, ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import MoodScale from '@/components/moodTracking/MoodScale';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, CartesianGrid, LabelList, Cell } from 'recharts';
import useMood from '@/hooks/use-mood';
import { format, subDays, eachDayOfInterval, isSameDay, addDays, isToday, parseISO } from 'date-fns';
import '@/components/notes/editor/realtime-editor.css';

export interface WellnessChartDataPoint {
    date: string;
    fullDate: string;
    score: number | null;
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
    description: string | null;
    barColor: string;
}

interface MoodEntry {
    tracked_date: string;
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
    description: string | null;
}

export interface WellnessRatings {
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
}

interface OptimizedWellbeingCardProps {
    user: User | null | undefined;
    isMobile?: boolean;
}

type ChartPeriod = 'week' | 'month' | '3months' | 'all';

const CHART_PERIODS = {
    week: { days: 7, label: 'This Week' },
    month: { days: 30, label: 'This Month' },
    '3months': { days: 90, label: 'Last 3 Months' },
    all: { days: 365, label: 'All Time' }
} as const;

const calculateDailyWellnessScore = (entry: MoodEntry | WellnessChartDataPoint): number | null => {
    const values = [
        entry.mood_rating,
        entry.sleep_rating,
        entry.nutrition_rating,
        entry.exercise_rating,
        entry.social_rating
    ].filter(v => typeof v === 'number');

    if (values.length === 0) return null;
    const pointsPerMetric = 100 / values.length;
    let calculatedScore = 0;
    if (typeof entry.mood_rating === 'number') calculatedScore += (entry.mood_rating / 5) * pointsPerMetric;
    if (typeof entry.sleep_rating === 'number') calculatedScore += (entry.sleep_rating / 5) * pointsPerMetric;
    if (typeof entry.nutrition_rating === 'number') calculatedScore += (entry.nutrition_rating / 5) * pointsPerMetric;
    if (typeof entry.exercise_rating === 'number') calculatedScore += (entry.exercise_rating / 5) * pointsPerMetric;
    if (typeof entry.social_rating === 'number') calculatedScore += (entry.social_rating / 5) * pointsPerMetric;
    return Math.round(calculatedScore);
};

export function OptimizedWellbeingCard({ user, isMobile = false }: OptimizedWellbeingCardProps) {
    const { getMoodHistory, submitWellness } = useMood({ user });

    const [isLoading, setIsLoading] = useState(true);
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [wellnessChartData, setWellnessChartData] = useState<WellnessChartDataPoint[]>([]);
    const [hasRecentMoodData, setHasRecentMoodData] = useState(true);
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week');
    const [selectedDataPoint, setSelectedDataPoint] = useState<WellnessChartDataPoint | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);
    const [ratings, setRatings] = useState<WellnessRatings>({ mood_rating: null, sleep_rating: null, nutrition_rating: null, exercise_rating: null, social_rating: null });
    const [description, setDescription] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [submittedScore, setSubmittedScore] = useState<number | null>(null);
    const [submittedData, setSubmittedData] = useState<{
        ratings: WellnessRatings;
        description: string;
        score: number;
        date: string;
    } | null>(null);

    useEffect(() => {
        const loadWellbeingData = async () => {
            if (!user) return;
            setIsLoading(true);

            const currentPeriod = CHART_PERIODS[chartPeriod];
            const chartEndDate = new Date();
            const chartStartDate = subDays(chartEndDate, currentPeriod.days - 1);

            const moodHistory: MoodEntry[] = await getMoodHistory(subDays(chartStartDate, 1).toISOString(), addDays(chartEndDate, 1).toISOString());

            const today = new Date();
            const hasRecentEntryForToday = moodHistory.some(entry => isSameDay(new Date(entry.tracked_date), today));
            setHasRecentMoodData(hasRecentEntryForToday);

            if (moodHistory && moodHistory.length > 0) {
                const sortedHistory = [...moodHistory].sort((a, b) => new Date(b.tracked_date).getTime() - new Date(a.tracked_date).getTime());
                const todayEntry = sortedHistory.find(entry => isSameDay(new Date(entry.tracked_date), today));
                setWellnessScore(todayEntry ? calculateDailyWellnessScore(todayEntry) : null);

                const dateRangeForChart = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
                const chartDataPoints: WellnessChartDataPoint[] = dateRangeForChart.map(dateInInterval => {
                    const dayEntry = sortedHistory.find(entry => isSameDay(new Date(entry.tracked_date), dateInInterval));
                    if (dayEntry) {
                        return {
                            date: format(dateInInterval, 'E'),
                            fullDate: format(dateInInterval, 'yyyy-MM-dd'),
                            score: calculateDailyWellnessScore(dayEntry),
                            mood_rating: dayEntry.mood_rating,
                            sleep_rating: dayEntry.sleep_rating,
                            nutrition_rating: dayEntry.nutrition_rating,
                            exercise_rating: dayEntry.exercise_rating,
                            social_rating: dayEntry.social_rating,
                            description: dayEntry.description,
                            barColor: dayEntry.description && dayEntry.description.trim() !== '' ? '#A855F7' : '#3B82F6'
                        };
                    }
                    return {
                        date: format(dateInInterval, 'E'),
                        fullDate: format(dateInInterval, 'yyyy-MM-dd'),
                        score: null,
                        mood_rating: null,
                        sleep_rating: null,
                        nutrition_rating: null,
                        exercise_rating: null,
                        social_rating: null,
                        description: null,
                        barColor: '#3B82F6'
                    };
                });
                setWellnessChartData(chartDataPoints);
            } else {
                setHasRecentMoodData(false);
                setWellnessScore(null);
                const dateRangeForChart = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
                setWellnessChartData(dateRangeForChart.map(dateInInterval => ({
                    date: format(dateInInterval, 'E'),
                    fullDate: format(dateInInterval, 'yyyy-MM-dd'),
                    score: null,
                    mood_rating: null,
                    sleep_rating: null,
                    nutrition_rating: null,
                    exercise_rating: null,
                    social_rating: null,
                    description: null,
                    barColor: '#3B82F6'
                })));
            }
            setIsLoading(false);
        };

        loadWellbeingData();
    }, [user, chartPeriod, getMoodHistory]);

    useEffect(() => {
        if (!hasRecentMoodData) {
            setShowQuestionnaire(true);
        } else {
            setShowQuestionnaire(false);
        }
    }, [hasRecentMoodData]);

    const wellnessQuestionSteps = [
        { id: 'mood', question: "How's your mood today?", emoji: '😊', field: 'mood_rating' as keyof WellnessRatings },
        { id: 'sleep', question: 'How was your sleep quality?', emoji: '😴', field: 'sleep_rating' as keyof WellnessRatings },
        { id: 'nutrition', question: 'How were your meals today?', emoji: '🍎', field: 'nutrition_rating' as keyof WellnessRatings },
        { id: 'exercise', question: 'Any physical activity today?', emoji: '🏃', field: 'exercise_rating' as keyof WellnessRatings },
        { id: 'social', question: 'How were your social connections?', emoji: '💬', field: 'social_rating' as keyof WellnessRatings },
    ];

    const resetFormState = () => {
        setCurrentStep(0);
        setRatings({ mood_rating: null, sleep_rating: null, nutrition_rating: null, exercise_rating: null, social_rating: null });
        setDescription('');
        setShowNotes(false);
    };

    const handleRatingSelect = (ratingValue: number) => {
        const currentField = wellnessQuestionSteps[currentStep].field;
        setRatings(prev => ({ ...prev, [currentField]: ratingValue }));
        if (currentStep < wellnessQuestionSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowNotes(true);
        }
    };

    const handleSkipStep = () => {
        if (currentStep < wellnessQuestionSteps.length - 1) setCurrentStep(prev => prev + 1);
        else setShowNotes(true);
    };

    const handleBack = () => {
        if (showNotes) setShowNotes(false);
        else if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleInlineWellnessSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const submissionDate = new Date();
            await submitWellness(ratings, description, submissionDate);

            // Calculate wellness score for confirmation using the same method as the chart
            const calculatedScore = calculateDailyWellnessScore({
                tracked_date: submissionDate.toISOString(),
                ...ratings,
                description
            } as MoodEntry);

            // Store submission data for confirmation
            setSubmittedData({
                ratings,
                description,
                score: calculatedScore || 0,
                date: format(submissionDate, 'MMM d, yyyy')
            });

            // Show confirmation UI
            setShowConfirmation(true);
            setSubmittedScore(calculatedScore || 0);

            // Auto-hide confirmation after 5 seconds
            setTimeout(() => {
                setShowConfirmation(false);
                setSubmittedData(null);
                setSubmittedScore(null);
            }, 5000);

            // Reset form and hide questionnaire
            resetFormState();
            setShowQuestionnaire(false);
            setHasRecentMoodData(true);

            // Add a small delay to ensure backend processing is complete before refreshing
            setTimeout(async () => {
                // Refresh chart data by reloading
                const currentPeriod = CHART_PERIODS[chartPeriod];
                const chartEndDate = new Date();
                const chartStartDate = subDays(chartEndDate, currentPeriod.days - 1);
                const moodHistory: MoodEntry[] = await getMoodHistory(subDays(chartStartDate, 1).toISOString(), addDays(chartEndDate, 1).toISOString());

                if (moodHistory && moodHistory.length > 0) {
                    const sortedHistory = [...moodHistory].sort((a, b) => new Date(b.tracked_date).getTime() - new Date(a.tracked_date).getTime());

                    // Update today's wellness score with the calculated score
                    const todayEntry = sortedHistory.find(entry => isSameDay(new Date(entry.tracked_date), new Date()));
                    if (todayEntry) {
                        const calculatedScore = calculateDailyWellnessScore(todayEntry);
                        setWellnessScore(calculatedScore);
                        setHasRecentMoodData(true);
                    }

                    const dateRangeForChart = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
                    const chartDataPoints: WellnessChartDataPoint[] = dateRangeForChart.map(dateInInterval => {
                        const dayEntry = sortedHistory.find(entry => isSameDay(new Date(entry.tracked_date), dateInInterval));
                        if (dayEntry) {
                            return {
                                date: format(dateInInterval, 'E'),
                                fullDate: format(dateInInterval, 'yyyy-MM-dd'),
                                score: calculateDailyWellnessScore(dayEntry),
                                mood_rating: dayEntry.mood_rating,
                                sleep_rating: dayEntry.sleep_rating,
                                nutrition_rating: dayEntry.nutrition_rating,
                                exercise_rating: dayEntry.exercise_rating,
                                social_rating: dayEntry.social_rating,
                                description: dayEntry.description,
                                barColor: dayEntry.description && dayEntry.description.trim() !== '' ? '#A855F7' : '#3B82F6'
                            };
                        }
                        return {
                            date: format(dateInInterval, 'E'),
                            fullDate: format(dateInInterval, 'yyyy-MM-dd'),
                            score: null,
                            mood_rating: null,
                            sleep_rating: null,
                            nutrition_rating: null,
                            exercise_rating: null,
                            social_rating: null,
                            description: null,
                            barColor: '#3B82F6'
                        };
                    });
                    setWellnessChartData(chartDataPoints);
                }
            }, 500); // 500ms delay to ensure backend processing
        } catch (error) {
            console.error('Error submitting inline wellness data:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePeriodChange = (newPeriod: ChartPeriod) => {
        setChartPeriod(newPeriod);
    };

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const clickedData = data.activePayload[0].payload as WellnessChartDataPoint;
            setSelectedDataPoint(clickedData);
            setShowTooltip(true);
        }
    };

    const closeTooltip = () => {
        setShowTooltip(false);
        setSelectedDataPoint(null);
    };

    const getWellnessColor = (score: number | null): string => {
        if (score === null) return '#94A3B8';
        if (score >= 90) return '#3B82F6';
        if (score >= 75) return '#10B981';
        if (score >= 60) return '#34D399';
        if (score >= 45) return '#FACC15';
        if (score >= 30) return '#F97316';
        return '#EF4444';
    };

    const getWellnessEmoji = (score: number | null) => {
        if (score === null) return '📝';
        if (score >= 90) return '🌟';
        if (score >= 75) return '😊';
        if (score >= 60) return '😌';
        if (score >= 45) return '😐';
        if (score >= 30) return '😕';
        return '😔';
    };

    const chartMargins = isMobile ? { top: 25, right: 10, left: -35, bottom: 15 } : { top: 35, right: 15, left: -20, bottom: 20 };

    if (isLoading) {
        return (
            <div className="rounded-2xl p-4 text-white relative overflow-hidden flex items-center justify-center min-h-[240px] header-gradient">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0 rounded-2xl"></div>
                <div className="relative z-10 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <p>Loading Wellbeing...</p>
                </div>
            </div>
        );
    }

    if (showQuestionnaire) {
        if (isMobile) {
            return (
                <div className="wellbeing-card-container rounded-2xl p-4 pb-3 text-white relative overflow-hidden header-gradient">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0 rounded-2xl"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Header matching chart mode */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-grow min-w-0">
                                <h2 className="font-bold text-lg">Daily Wellness Check</h2>
                            </div>
                            {hasRecentMoodData && (
                                <Button variant="ghost" onClick={() => setShowQuestionnaire(false)} className="text-white/70 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-2 py-1 text-xs ml-2 rounded-lg">
                                    Cancel
                                </Button>
                            )}
                        </div>

                        {/* Main content area - compact */}
                        <div className="flex-grow flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {!showNotes ? (
                                    <motion.div key={`step-${currentStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col justify-center">
                                        <div className="text-center mb-2"><p className="text-sm font-medium px-2">{wellnessQuestionSteps[currentStep].question}</p></div>
                                        <MoodScale question="" onSelect={handleRatingSelect} questionType={wellnessQuestionSteps[currentStep].id} isMobile={isMobile} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col justify-center">
                                        {/* <Label htmlFor="mood-description" className="mb-2 text-sm font-medium">Additional notes? (optional)</Label> */}
                                        <Textarea id="mood-description" placeholder="Share anything else about your day..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-white/10 backdrop-blur-md border border-white/20 placeholder:text-white text-white resize-none rounded-lg pb-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer controls - compact */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-2">
                                {(currentStep > 0 || showNotes) && (<Button variant="ghost" onClick={handleBack} className="text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-1.5 py-0.5 text-xs rounded-md" size="sm"><ArrowLeft className="mr-1 h-2.5 w-2.5" /> Back</Button>)}
                                <div className="flex-grow"></div>
                                {!showNotes && currentStep < wellnessQuestionSteps.length && (<Button variant="ghost" onClick={handleSkipStep} className="text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-1.5 py-0.5 text-xs rounded-md" size="sm">Skip <ArrowRight className="ml-1 h-2.5 w-2.5" /></Button>)}
                                {showNotes && (
                                    <Button onClick={handleInlineWellnessSubmit} disabled={isSubmitting} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 text-white px-3 py-1.5 text-xs rounded-lg">
                                        {isSubmitting ? 'Calculating...' : 'Calculate Today\'s Score'}
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-center space-x-1.5 mt-2">
                                {wellnessQuestionSteps.map((_, idx) => (<div key={idx} className={cn("h-1.5 rounded-full transition-all duration-300", idx === currentStep && !showNotes ? 'w-4 bg-white' : 'w-1.5 bg-white/50')} />))}
                                <div className={cn("h-1.5 rounded-full transition-all duration-300", showNotes ? 'w-4 bg-white' : 'w-1.5 bg-white/50')} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="wellbeing-card-container rounded-2xl p-6 pb-4 text-white relative overflow-hidden header-gradient">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0 rounded-2xl"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Header matching chart mode */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow min-w-0">
                                <h2 className="font-bold text-xl">Daily Wellness Check</h2>
                            </div>
                            {hasRecentMoodData && (
                                <Button variant="ghost" onClick={() => setShowQuestionnaire(false)} className="text-white/70 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-3 py-1.5 text-sm ml-3 rounded-lg">
                                    Cancel
                                </Button>
                            )}
                        </div>

                        {/* Main content area - optimized spacing */}
                        <div className="flex-grow flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {!showNotes ? (
                                    <motion.div key={`step-${currentStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col justify-center">
                                        <div className="text-center mb-3"><p className="text-base font-medium px-2">{wellnessQuestionSteps[currentStep].question}</p></div>
                                        <MoodScale question="" onSelect={handleRatingSelect} questionType={wellnessQuestionSteps[currentStep].id} isMobile={isMobile} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col justify-center">
                                        {/* <Label htmlFor="mood-description" className="mb-2 text-sm font-medium">Additional notes? (optional)</Label> */}
                                        <Textarea id="mood-description" placeholder="Share anything else about your day..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="bg-white/10 backdrop-blur-md border border-white/20 placeholder:text-white text-white resize-none rounded-lg pb-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer controls - optimized spacing */}
                        <div className="pt-3">
                            <div className="flex justify-between items-center mb-2">
                                {(currentStep > 0 || showNotes) && (<Button variant="ghost" onClick={handleBack} className="text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-2 py-1 text-xs rounded-md"><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>)}
                                <div className="flex-grow"></div>
                                {!showNotes && currentStep < wellnessQuestionSteps.length && (<Button variant="ghost" onClick={handleSkipStep} className="text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 px-2 py-1 text-xs rounded-md">Skip <ArrowRight className="ml-1 h-3 w-3" /></Button>)}
                                {showNotes && (
                                    <Button onClick={handleInlineWellnessSubmit} disabled={isSubmitting} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 transition-all duration-200 text-white px-4 py-2 text-xs rounded-lg">
                                        {isSubmitting ? 'Calculating...' : 'Calculate Today\'s Score'}
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-center space-x-1.5 mt-3">
                                {wellnessQuestionSteps.map((_, idx) => (<div key={idx} className={cn("h-2 rounded-full transition-all duration-300", idx === currentStep && !showNotes ? 'w-5 bg-white' : 'w-2 bg-white/50')} />))}
                                <div className={cn("h-2 rounded-full transition-all duration-300", showNotes ? 'w-5 bg-white' : 'w-2 bg-white/50')} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    const RatingDetail = ({ label, value }: { label: string, value: number | null }) => {
        if (value === null || value === undefined) return null;
        return (<p className="text-xs">{label}: <span className="font-semibold">{value}/5</span></p>);
    };

    const SimpleTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data: WellnessChartDataPoint = payload[0].payload;
            if (data.score === null) return null;

            const hasNote = data.description && data.description.trim() !== '';
            const formattedDate = new Date(data.fullDate).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });

            return (
                <div className="bg-white/95 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-lg text-sm border border-gray-200 dark:border-white/20">
                    <div className="text-center">
                        <div className="text-xs text-gray-600 dark:text-white/80 mb-1">{formattedDate}</div>
                        <div className="flex items-center gap-2 justify-center">
                            <span className="font-medium">Score: {data.score}</span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-white/80 mt-1 text-center">Click to see more</div>
                </div>
            );
        }
        return null;
    };

    const CenteredTooltip = () => {
        if (!showTooltip || !selectedDataPoint) return null;

        const data = selectedDataPoint;
        const formattedDate = new Date(data.fullDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: '2-digit'
        });

        const renderStars = (rating: number | null) => {
            if (rating === null) return '—';
            return '★'.repeat(rating) + '☆'.repeat(5 - rating);
        };

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeTooltip}>
                <div
                    className="bg-white/10 backdrop-blur-md text-white p-6 rounded-xl shadow-2xl border border-white/20 text-left max-w-sm w-full mx-4 relative"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tooltip-title"
                >
                    {/* Close Button */}
                    <button
                        onClick={closeTooltip}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 w-8 h-8 rounded-lg flex items-center justify-center"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Overall Score - Most Prominent */}
                    <div className="text-center mb-4 pb-4 border-b border-white/20">
                        <div className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
                            {data.score !== null ? data.score : 'N/A'}
                        </div>
                        <div id="tooltip-title" className="text-sm text-white/70 uppercase tracking-wider">Overall Score</div>
                    </div>

                    {/* Date */}
                    <div className="text-center mb-4 pb-3 border-b border-white/20">
                        <div className="text-base font-medium text-white/90">{formattedDate}</div>
                    </div>

                    {/* Individual Ratings with Emojis - Standardized spacing */}
                    <div className="space-y-3 mb-4">
                        {data.mood_rating !== null && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <span role="img" aria-label="mood" className="text-lg">😊</span>
                                    <span className="text-sm text-white/80">Mood</span>
                                </span>
                                <span className="text-base font-medium text-white" aria-label={`Mood rating: ${data.mood_rating} out of 5 stars`}>
                                    {renderStars(data.mood_rating)}
                                </span>
                            </div>
                        )}
                        {data.sleep_rating !== null && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <span role="img" aria-label="sleep" className="text-lg">🌙</span>
                                    <span className="text-sm text-white/80">Sleep</span>
                                </span>
                                <span className="text-base font-medium text-white" aria-label={`Sleep rating: ${data.sleep_rating} out of 5 stars`}>
                                    {renderStars(data.sleep_rating)}
                                </span>
                            </div>
                        )}
                        {data.nutrition_rating !== null && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <span role="img" aria-label="nutrition" className="text-lg">🍎</span>
                                    <span className="text-sm text-white/80">Nutrition</span>
                                </span>
                                <span className="text-base font-medium text-white" aria-label={`Nutrition rating: ${data.nutrition_rating} out of 5 stars`}>
                                    {renderStars(data.nutrition_rating)}
                                </span>
                            </div>
                        )}
                        {data.exercise_rating !== null && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <span role="img" aria-label="exercise" className="text-lg">🏃</span>
                                    <span className="text-sm text-white/80">Exercise</span>
                                </span>
                                <span className="text-base font-medium text-white" aria-label={`Exercise rating: ${data.exercise_rating} out of 5 stars`}>
                                    {renderStars(data.exercise_rating)}
                                </span>
                            </div>
                        )}
                        {data.social_rating !== null && (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-3">
                                    <span role="img" aria-label="social" className="text-lg">💬</span>
                                    <span className="text-sm text-white/80">Social</span>
                                </span>
                                <span className="text-base font-medium text-white" aria-label={`Social rating: ${data.social_rating} out of 5 stars`}>
                                    {renderStars(data.social_rating)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    {data.description && (
                        <div className="pt-3 border-t border-white/20">
                            <div className="flex items-start gap-3 mb-3">
                                <span role="img" aria-label="comments" className="text-lg">💭</span>
                                <span className="text-sm text-white/70 uppercase tracking-wider">Notes</span>
                            </div>
                            <p className="text-sm text-white/90 italic leading-relaxed" role="note">
                                "{data.description}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isMobile) {
        return (
            <>
                <div className="wellbeing-card-container rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-xl text-gray-900 dark:text-white relative overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header with gradient background */}
                    <div className="text-white p-4 pb-2 relative overflow-hidden header-gradient">
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0"></div>
                        <div className="relative z-10">
                            {/* Header with Period Selector */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-grow min-w-0">
                                    <h2 className="font-bold text-lg">
                                        Wellbeing Score
                                    </h2>
                                    {(wellnessScore !== null || hasRecentMoodData) && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm text-white/90">
                                                {wellnessScore !== null ? `${wellnessScore} today ${getWellnessEmoji(wellnessScore)}` : 'Complete your wellness check'}
                                            </p>                        <button
                                                onClick={() => setShowQuestionnaire(true)}
                                                className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded-md transition-all duration-200 ml-2"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <div className="text-center mb-1">
                                        <span className="text-white/50 text-xs uppercase tracking-wider">Period</span>
                                    </div>
                                    <Select value={chartPeriod} onValueChange={(value: ChartPeriod) => handlePeriodChange(value)}>
                                        <SelectTrigger className="w-20 mx-auto bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs h-6 rounded-lg">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Week</SelectItem>
                                            <SelectItem value="month">Month</SelectItem>
                                            <SelectItem value="3months">3 Months</SelectItem>
                                            <SelectItem value="all">All Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart area with neutral background */}
                    <div className="p-4 pt-3">
                        {/* Legend */}
                        <div className="flex justify-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Standard</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">With notes</span>
                            </div>
                        </div>

                        <div className="wellbeing-chart-container h-48 relative">
                            {(wellnessChartData && wellnessChartData.length > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={wellnessChartData} margin={chartMargins} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                        <CartesianGrid vertical={false} stroke="rgba(156, 163, 175, 0.3)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="currentColor"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                        />
                                        <YAxis
                                            stroke="currentColor"
                                            fontSize={12}
                                            domain={[0, 100]}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={false}
                                        />
                                        <Tooltip
                                            content={<SimpleTooltip />}
                                            cursor={false}
                                            wrapperStyle={{ outline: 'none', zIndex: 1000 }}
                                        />
                                        <Bar
                                            dataKey="score"
                                            radius={4}
                                            fill="#3B82F6"
                                        >
                                            {wellnessChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.barColor} />
                                            ))}
                                            {chartPeriod === 'week' && (
                                                <LabelList
                                                    position="top"
                                                    offset={8}
                                                    className="fill-current text-gray-600 dark:text-gray-400"
                                                    fontSize={10}
                                                    formatter={(value: any) => value ? Math.round(value) : ''}
                                                />
                                            )}
                                        </Bar>
                                        <ReferenceLine y={50} stroke="rgba(59, 130, 246, 0.3)" strokeDasharray="3 3" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center">
                                    <div>
                                        <HeartPulse className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                        <p className="text-xs text-gray-600 dark:text-gray-400">No wellness data for this period</p>
                                        {chartPeriod === 'week' && !hasRecentMoodData && (
                                            <button
                                                onClick={() => setShowQuestionnaire(true)}
                                                className="text-xs text-blue-600 dark:text-blue-400 underline mt-1 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-all duration-200"
                                            >
                                                Track today
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <CenteredTooltip />
            </>
        );
    }

    return (
        <>
            {/* Confirmation UI - Matching the tooltip modal style */}
            {showConfirmation && submittedData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
                    setShowConfirmation(false);
                    setSubmittedData(null);
                    setSubmittedScore(null);
                }}>
                    <div
                        className="bg-white/10 backdrop-blur-md text-white p-6 rounded-xl shadow-2xl border border-white/20 text-left max-w-sm w-full mx-4 relative"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirmation-title"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowConfirmation(false);
                                setSubmittedData(null);
                                setSubmittedScore(null);
                            }}
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 w-8 h-8 rounded-lg flex items-center justify-center"
                            aria-label="Close"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Success indicator */}
                        <div className="text-center mb-4 pb-4 border-b border-white/20">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-sm text-white/70 uppercase tracking-wider mb-2">Wellness Submitted</div>
                        </div>

                        {/* Overall Score - Most Prominent */}
                        <div className="text-center mb-4 pb-4 border-b border-white/20">
                            <div className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
                                {submittedData.score}
                            </div>
                            <div id="confirmation-title" className="text-sm text-white/70 uppercase tracking-wider">Overall Score</div>
                        </div>

                        {/* Date */}
                        <div className="text-center mb-4 pb-3 border-b border-white/20">
                            <div className="text-base font-medium text-white/90">{submittedData.date}</div>
                        </div>

                        {/* Individual Ratings with Emojis - Standardized spacing */}
                        <div className="space-y-3 mb-4">
                            {submittedData.ratings.mood_rating !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <span role="img" aria-label="mood" className="text-lg">😊</span>
                                        <span className="text-sm text-white/80">Mood</span>
                                    </span>
                                    <span className="text-base font-medium text-white" aria-label={`Mood rating: ${submittedData.ratings.mood_rating} out of 5 stars`}>
                                        {'★'.repeat(submittedData.ratings.mood_rating) + '☆'.repeat(5 - submittedData.ratings.mood_rating)}
                                    </span>
                                </div>
                            )}
                            {submittedData.ratings.sleep_rating !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <span role="img" aria-label="sleep" className="text-lg">🌙</span>
                                        <span className="text-sm text-white/80">Sleep</span>
                                    </span>
                                    <span className="text-base font-medium text-white" aria-label={`Sleep rating: ${submittedData.ratings.sleep_rating} out of 5 stars`}>
                                        {'★'.repeat(submittedData.ratings.sleep_rating) + '☆'.repeat(5 - submittedData.ratings.sleep_rating)}
                                    </span>
                                </div>
                            )}
                            {submittedData.ratings.nutrition_rating !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <span role="img" aria-label="nutrition" className="text-lg">🍎</span>
                                        <span className="text-sm text-white/80">Nutrition</span>
                                    </span>
                                    <span className="text-base font-medium text-white" aria-label={`Nutrition rating: ${submittedData.ratings.nutrition_rating} out of 5 stars`}>
                                        {'★'.repeat(submittedData.ratings.nutrition_rating) + '☆'.repeat(5 - submittedData.ratings.nutrition_rating)}
                                    </span>
                                </div>
                            )}
                            {submittedData.ratings.exercise_rating !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <span role="img" aria-label="exercise" className="text-lg">🏃</span>
                                        <span className="text-sm text-white/80">Exercise</span>
                                    </span>
                                    <span className="text-base font-medium text-white" aria-label={`Exercise rating: ${submittedData.ratings.exercise_rating} out of 5 stars`}>
                                        {'★'.repeat(submittedData.ratings.exercise_rating) + '☆'.repeat(5 - submittedData.ratings.exercise_rating)}
                                    </span>
                                </div>
                            )}
                            {submittedData.ratings.social_rating !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-3">
                                        <span role="img" aria-label="social" className="text-lg">💬</span>
                                        <span className="text-sm text-white/80">Social</span>
                                    </span>
                                    <span className="text-base font-medium text-white" aria-label={`Social rating: ${submittedData.ratings.social_rating} out of 5 stars`}>
                                        {'★'.repeat(submittedData.ratings.social_rating) + '☆'.repeat(5 - submittedData.ratings.social_rating)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        {submittedData.description && (
                            <div className="pt-3 border-t border-white/20">
                                <div className="flex items-start gap-3 mb-3">
                                    <span role="img" aria-label="comments" className="text-lg">💭</span>
                                    <span className="text-sm text-white/70 uppercase tracking-wider">Notes</span>
                                </div>
                                <p className="text-sm text-white/90 italic leading-relaxed" role="note">
                                    "{submittedData.description}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="wellbeing-card-container rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-xl text-gray-900 dark:text-white relative overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header with gradient background */}
                <div className="text-white p-4 pb-2 relative overflow-hidden header-gradient">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-md z-0"></div>
                    <div className="relative z-10">
                        {/* Header with Period Selector */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow min-w-0">
                                <h2 className="font-bold text-xl">
                                    Wellbeing Score
                                </h2>
                                {(wellnessScore !== null || hasRecentMoodData) && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <p className="text-base text-white/90">
                                            {wellnessScore !== null ? `${wellnessScore} today ${getWellnessEmoji(wellnessScore)}` : 'Complete your wellness check'}
                                        </p>
                                        <button
                                            onClick={() => setShowQuestionnaire(true)}
                                            className="text-xs text-white/80 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-all duration-200"
                                        >
                                            Update
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="ml-4">
                                <div className="text-center mb-1">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Period</span>
                                </div>
                                <Select value={chartPeriod} onValueChange={(value: ChartPeriod) => handlePeriodChange(value)}>
                                    <SelectTrigger className="w-28 mx-auto bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs h-7 rounded-lg">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="week">Week</SelectItem>
                                        <SelectItem value="month">Month</SelectItem>
                                        <SelectItem value="3months">3 Months</SelectItem>
                                        <SelectItem value="all">All Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart area with neutral background */}
                <div className="p-6 pt-4">
                    {/* Legend */}
                    <div className="flex justify-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Standard</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">With notes</span>
                        </div>
                    </div>

                    <div className="wellbeing-chart-container h-56 relative">
                        {(wellnessChartData && wellnessChartData.length > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={wellnessChartData} margin={chartMargins} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid vertical={false} stroke="rgba(156, 163, 175, 0.3)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="currentColor"
                                        fontSize={14}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        fontSize={14}
                                        domain={[0, 100]}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={false}
                                    />
                                    <Tooltip
                                        content={<SimpleTooltip />}
                                        cursor={false}
                                        wrapperStyle={{ outline: 'none', zIndex: 1000 }}
                                    />
                                    <Bar
                                        dataKey="score"
                                        fill="#3B82F6"
                                        radius={6}
                                    >
                                        {wellnessChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.barColor} />
                                        ))}
                                        {chartPeriod === 'week' && (
                                            <LabelList
                                                position="top"
                                                offset={12}
                                                className="fill-current text-gray-600 dark:text-gray-400"
                                                fontSize={12}
                                                formatter={(value: any) => value ? Math.round(value) : ''}
                                            />
                                        )}
                                    </Bar>
                                    <ReferenceLine y={50} stroke="rgba(59, 130, 246, 0.3)" strokeDasharray="3 3" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center">
                                <div>
                                    <HeartPulse className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                                    <p className="text-gray-600 dark:text-gray-400 text-base mb-2">No wellness data for this period</p>
                                    <p className="text-gray-500 dark:text-gray-500 text-sm">Start tracking your daily wellbeing to see your progress over time</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CenteredTooltip />
        </>
    );
}