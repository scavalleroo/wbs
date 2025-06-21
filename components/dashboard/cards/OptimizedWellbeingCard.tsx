'use client';

import React, { useState, useEffect } from 'react';
import { HeartPulse, ArrowLeft, Check, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MoodScale from '@/components/moodTracking/MoodScale';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import useMood from '@/hooks/use-mood';
import { useRouter } from 'next/navigation';
import { format, subDays, eachDayOfInterval, isSameDay, addDays } from 'date-fns';

export interface WellnessChartDataPoint {
    date: string;
    fullDate: string;
    score: number | null;
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
}

interface MoodEntry {
    tracked_date: string;
    mood_rating: number | null;
    sleep_rating: number | null;
    nutrition_rating: number | null;
    exercise_rating: number | null;
    social_rating: number | null;
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
    const router = useRouter();
    const { getMoodHistory, submitWellness } = useMood({ user });

    const [isLoading, setIsLoading] = useState(true);
    const [wellnessScore, setWellnessScore] = useState<number | null>(null);
    const [wellnessChartData, setWellnessChartData] = useState<WellnessChartDataPoint[]>([]);
    const [hasRecentMoodData, setHasRecentMoodData] = useState(true);
    const [chartDateOffset, setChartDateOffset] = useState(0);
    const [currentChartWeekLabel, setCurrentChartWeekLabel] = useState('');
    const N_DAYS_FOR_CHART = 7;

    const [currentStep, setCurrentStep] = useState(0);
    const [ratings, setRatings] = useState<WellnessRatings>({ mood_rating: null, sleep_rating: null, nutrition_rating: null, exercise_rating: null, social_rating: null });
    const [description, setDescription] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);

    useEffect(() => {
        const loadWellbeingData = async () => {
            if (!user) return;
            setIsLoading(true);

            const baseDate = addDays(new Date(), chartDateOffset);
            const chartEndDate = baseDate;
            const chartStartDate = subDays(chartEndDate, N_DAYS_FOR_CHART - 1);

            const startLabel = format(chartStartDate, 'MMM d');
            const endLabel = format(chartEndDate, 'MMM d');
            setCurrentChartWeekLabel(chartDateOffset === 0 ? "This Week" : `${startLabel} - ${endLabel}`);

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
                        };
                    }
                    return { date: format(dateInInterval, 'E'), fullDate: format(dateInInterval, 'yyyy-MM-dd'), score: null, mood_rating: null, sleep_rating: null, nutrition_rating: null, exercise_rating: null, social_rating: null };
                });
                setWellnessChartData(chartDataPoints);
            } else {
                if (chartDateOffset === 0) setHasRecentMoodData(false);
                setWellnessScore(null);
                const dateRangeForChart = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
                setWellnessChartData(dateRangeForChart.map(dateInInterval => ({ date: format(dateInInterval, 'E'), fullDate: format(dateInInterval, 'yyyy-MM-dd'), score: null, mood_rating: null, sleep_rating: null, nutrition_rating: null, exercise_rating: null, social_rating: null })));
            }
            setIsLoading(false);
        };

        loadWellbeingData();
    }, [user, chartDateOffset, getMoodHistory]);

    useEffect(() => {
        if (chartDateOffset === 0 && !hasRecentMoodData) {
            setShowQuestionnaire(true);
        } else {
            setShowQuestionnaire(false);
        }
    }, [hasRecentMoodData, chartDateOffset]);

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
            await submitWellness(ratings, description, new Date());
            resetFormState();
            setShowQuestionnaire(false);
            if (chartDateOffset !== 0) setChartDateOffset(0); // This will trigger refetch
            else setHasRecentMoodData(true); // Manually update to avoid full reload if already on current week
        } catch (error) {
            console.error('Error submitting inline wellness data:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditToday = () => {
        resetFormState();
        setShowQuestionnaire(true);
    };

    const handleChartPrevious = () => setChartDateOffset(prev => prev - N_DAYS_FOR_CHART);
    const handleChartNext = () => setChartDateOffset(prev => Math.min(0, prev + N_DAYS_FOR_CHART));

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

    const getMessage = () => {
        if (wellnessScore === null && hasRecentMoodData) return "Update today's wellbeing";
        if (wellnessScore === null) return "Track today's wellbeing";
        if (wellnessScore >= 75) return "You're doing great!";
        if (wellnessScore >= 50) return "You're doing ok";
        return "Could be better";
    };

    const onRelaxClick = () => router.push('/relax');

    const emoji = getWellnessEmoji(wellnessScore);
    const chartMargins = isMobile ? { top: 5, right: 10, left: -25, bottom: 0 } : { top: 10, right: 15, left: -10, bottom: 5 };

    if (isLoading) {
        return (
            <div className={cn("rounded-xl p-3 shadow-lg text-white relative overflow-hidden flex items-center justify-center min-h-[240px]", isMobile ? "bg-gradient-to-r from-purple-400 to-pink-500" : "bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600")}>
                <div className="absolute inset-0 bg-black/20 z-0"></div>
                <div className="relative z-10"><p>Loading Wellbeing...</p></div>
            </div>
        );
    }

    if (showQuestionnaire) {
        return (
            <div className={cn("rounded-xl p-3 shadow-[0_0_12px_rgba(192,38,211,0.4)] text-white relative overflow-hidden flex flex-col", isMobile ? "bg-gradient-to-r from-purple-400 to-pink-500" : "bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600")}>
                <div className="absolute inset-0 bg-black/30 z-0"></div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-lg text-center flex-grow">{chartDateOffset === 0 ? "Daily Wellness Check" : "Viewing Past Data"}</h2>
                        {(chartDateOffset === 0 && hasRecentMoodData) && (
                            <Button variant="ghost" size="icon" onClick={() => setShowQuestionnaire(false)} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"><ArrowLeft className="h-5 w-5" /></Button>
                        )}
                    </div>
                    <AnimatePresence mode="wait">
                        {!showNotes ? (
                            <motion.div key={`step-${currentStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex-grow flex flex-col justify-center">
                                <div className="text-center mb-3"><p className="text-md font-medium px-2">{wellnessQuestionSteps[currentStep].question}</p></div>
                                <MoodScale question="" onSelect={handleRatingSelect} questionType={wellnessQuestionSteps[currentStep].id} isMobile={isMobile} />
                            </motion.div>
                        ) : (
                            <motion.div key="notes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex-grow flex flex-col justify-center">
                                <Label htmlFor="mood-description" className="mb-2 text-sm font-medium">Additional notes? (optional)</Label>
                                <Textarea id="mood-description" placeholder="Share anything else about your day..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-white/10 border-white/30 placeholder-white/50 text-white resize-none rounded-md" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="mt-auto pt-3">
                        <div className="flex justify-between items-center mb-2">
                            {(currentStep > 0 || showNotes) && (<Button variant="ghost" onClick={handleBack} className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 text-sm" size={isMobile ? "sm" : "default"}><ArrowLeft className={cn("mr-1", isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} /> Back</Button>)}
                            <div className="flex-grow"></div>
                            {!showNotes && currentStep < wellnessQuestionSteps.length - 1 && (<Button variant="ghost" onClick={handleSkipStep} className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 text-sm" size={isMobile ? "sm" : "default"}>Skip</Button>)}
                        </div>
                        {showNotes && (<Button onClick={handleInlineWellnessSubmit} disabled={isSubmitting} className="w-full bg-white/25 hover:bg-white/35 text-white font-semibold h-9" size={isMobile ? "sm" : "default"}>{isSubmitting ? 'Submitting...' : (hasRecentMoodData && chartDateOffset === 0 ? 'Update Wellness' : 'Submit Wellness')} <Check className={cn("ml-2", isMobile ? "h-4 w-4" : "h-5 w-5")} /></Button>)}
                        <div className="flex justify-center space-x-1.5 mt-3">
                            {wellnessQuestionSteps.map((_, idx) => (<div key={idx} className={cn("h-2 rounded-full transition-all duration-300", idx === currentStep && !showNotes ? 'w-5 bg-white' : 'w-2 bg-white/50')} />))}
                            <div className={cn("h-2 rounded-full transition-all duration-300", showNotes ? 'w-5 bg-white' : 'w-2 bg-white/50')} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const RatingDetail = ({ label, value }: { label: string, value: number | null }) => {
        if (value === null || value === undefined) return null;
        return (<p className="text-xs">{label}: <span className="font-semibold">{value}/5</span></p>);
    };

    const ChartTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data: WellnessChartDataPoint = payload[0].payload;
            return (
                <div className="bg-black/80 text-white p-3 rounded-lg shadow-xl border border-white/25 text-left">
                    <p className="text-xs font-semibold mb-1">{`Date: ${data.fullDate}`}</p>
                    <p className="text-sm font-bold mb-1.5" style={{ color: getWellnessColor(data.score) }}>{`Overall Score: ${data.score !== null ? data.score : 'N/A'}`}</p>
                    <RatingDetail label="Mood" value={data.mood_rating} /><RatingDetail label="Sleep" value={data.sleep_rating} /><RatingDetail label="Nutrition" value={data.nutrition_rating} /><RatingDetail label="Exercise" value={data.exercise_rating} /><RatingDetail label="Social" value={data.social_rating} />
                </div>
            );
        }
        return null;
    };

    if (isMobile) {
        return (
            <div className="rounded-xl p-3 bg-gradient-to-r from-purple-400 to-pink-500 shadow-sm text-white relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-black/20 z-0"></div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex-grow min-w-0"><h2 className="font-bold flex items-center text-sm truncate"><HeartPulse className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />Wellbeing</h2><p className="text-xs mt-0.5 truncate">{getMessage()}</p></div>
                        <div className="text-xl ml-2 flex-shrink-0">{emoji}</div>
                    </div>
                    <div className="flex items-center justify-between my-1">
                        <Button onClick={handleChartPrevious} variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></Button>
                        <p className="text-xs font-medium tabular-nums">{currentChartWeekLabel}</p>
                        <Button onClick={handleChartNext} disabled={chartDateOffset >= 0} variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></Button>
                    </div>
                    <div className="flex-grow mb-1" style={{ minHeight: '120px' }}>
                        {(wellnessChartData && wellnessChartData.length > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={wellnessChartData} margin={chartMargins}>
                                    <XAxis dataKey="date" stroke="#fff" fontSize={10} tickLine={false} axisLine={false} dy={5} /><YAxis stroke="#fff" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} dx={-5} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }} /><Line type="monotone" dataKey="score" stroke={getWellnessColor(wellnessScore)} strokeWidth={2} dot={{ r: 3, fill: getWellnessColor(wellnessScore) }} connectNulls={true} /><ReferenceLine y={50} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (<div className="flex items-center justify-center h-full"><p className="text-xs text-white/70">No wellness data for this period.</p></div>)}
                    </div>
                    <div className="flex gap-2 mt-auto">
                        {chartDateOffset === 0 && (<Button onClick={handleEditToday} className="flex-1 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 border-none text-white font-medium text-xs"><Edit3 className="h-3.5 w-3.5 mr-1" />Update</Button>)}
                        <Button onClick={onRelaxClick} className={cn("h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 border-none text-white font-medium text-xs", chartDateOffset === 0 ? "flex-1" : "w-full")}><HeartPulse className="h-3.5 w-3.5 mr-1" />Relax</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-3 bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600 shadow-[0_0_12px_rgba(192,38,211,0.4)] text-white relative overflow-hidden flex flex-col">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-white/10 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-grow min-w-0"><h2 className="font-bold flex items-center truncate"><HeartPulse className="mr-1.5 h-4 w-4 flex-shrink-0" />Wellbeing</h2><p className="text-xs mt-0.5 text-white/80 truncate">{getMessage()}</p></div>
                    <div className="text-2xl ml-2 flex-shrink-0">{emoji}</div>
                </div>
                <div className="flex items-center justify-between my-1">
                    <Button onClick={handleChartPrevious} variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-1"><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
                    <p className="text-sm font-medium tabular-nums">{currentChartWeekLabel}</p>
                    <Button onClick={handleChartNext} disabled={chartDateOffset >= 0} variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-1 disabled:opacity-50">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
                <div className="flex-grow" style={{ minHeight: '120px' }}>
                    {(wellnessChartData && wellnessChartData.length > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={wellnessChartData} margin={chartMargins}>
                                <XAxis dataKey="date" stroke="#fff" fontSize={12} tickLine={false} axisLine={false} dy={5} /><YAxis stroke="#fff" fontSize={12} domain={[0, 100]} tickLine={false} axisLine={false} dx={-5} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }} /><Line type="monotone" dataKey="score" stroke={getWellnessColor(wellnessScore)} strokeWidth={2.5} dot={{ r: 4, fill: getWellnessColor(wellnessScore) }} activeDot={{ r: 6 }} connectNulls={true} /><ReferenceLine y={50} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (<div className="flex items-center justify-center h-full"><p className="text-sm text-white/70">No wellness data for this period.</p></div>)}
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                    {chartDateOffset === 0 && (<Button onClick={handleEditToday} className="flex-1 flex items-center justify-center h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium"><Edit3 className="h-4 w-4 mr-1.5" />Update</Button>)}
                    <Button onClick={onRelaxClick} className={cn("flex items-center justify-center h-9 bg-white/20 hover:bg-white/30 border-none text-white font-medium", chartDateOffset === 0 ? "flex-1" : "w-full")}><HeartPulse className="h-4 w-4 mr-1.5" />Relax Now</Button>
                </div>
            </div>
        </div>
    );
}