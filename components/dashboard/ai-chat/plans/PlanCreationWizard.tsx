"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ChevronRight, ChevronLeft, Check, Book, Dumbbell, Utensils, Users, Plus, Palmtree, CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SelectTrigger } from '@radix-ui/react-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import NewPlanChat from './NewPlanChat';


export type PlanData = {
    type: string;
    customType: string;
    title: string;
    description: string;
    durationType: 'quantity' | 'deadline';
    durationUnit: 'days' | 'weeks' | 'months';
    durationValue: number;
    deadlineDate: Date | undefined;
    goals: string[];
    currentGoal: string;
};

const PlanCreationWizard = () => {
    const [step, setStep] = useState(1);
    const [openAIChat, setOpenAIChat] = useState(false);

    const [planData, setPlanData] = useState<PlanData>({
        type: '',
        customType: '',
        title: '',
        description: '',
        durationType: 'quantity',
        durationUnit: 'weeks',
        durationValue: 1,
        deadlineDate: undefined,
        goals: [],
        currentGoal: ''
    });

    const planTypes = [
        { id: 'study', name: 'Study Plan', icon: Book },
        { id: 'training', name: 'Training Plan', icon: Dumbbell },
        { id: 'nutrition', name: 'Nutrition Plan', icon: Utensils },
        { id: 'vacation', name: 'Vacation Plan', icon: Palmtree },
        { id: 'team', name: 'Team Plan', icon: Users },
        { id: 'custom', name: 'Custom Plan', icon: Plus },
    ];

    const stepsTitle = ['What plan do you want to create?', `What are the goals for the ${planData.type === 'custom' ? planData.customType : planData.type + ' plan'}?`, `For who is the ${planData.type === 'custom' ? planData.customType : planData.type + ' plan'}?`, 'What is the duration of the plan?', 'Plan summary'];

    const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
        setPlanData({ ...planData, [e.target.name]: e.target.value });
    };

    const handlePlanTypeSelect = (type: string) => {
        setPlanData({ ...planData, type });
        if (type !== 'custom') {
            handleNext();
        }
    };

    const handleAddGoal = () => {
        if (planData.currentGoal.trim()) {
            setPlanData({
                ...planData,
                goals: [...planData.goals, planData.currentGoal],
                currentGoal: ''
            });
        }
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    if (openAIChat) {
        return (
            <NewPlanChat planData={planData} />
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className='font-light text-center text-3xl'>{stepsTitle[step - 1]}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6 items-center w-full justify-center">
                    {/* Progress indicator */}
                    <div className="flex justify-between mb-8 items-center">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num} className="flex items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= num ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                    {step > num ? <Check size={16} /> : num}
                                </div>
                                {num < 5 && (
                                    <div className={`h-1 flex-1 ${step > num ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Plan Type Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {planTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <Button
                                            key={type.id}
                                            variant={planData.type === type.id ? "default" : "outline"}
                                            className={`h-32 flex flex-col items-center justify-center space-y-2 p-4 ${planData.type === type.id ? '' : 'hover:bg-blue-50'}`}
                                            onClick={() => handlePlanTypeSelect(type.id)}
                                        >
                                            <Icon className='shrink-0' />
                                            <span className="text-lg font-medium text-center">{type.name}</span>
                                        </Button>
                                    );
                                })}
                            </div>

                            {planData.type === 'custom' && (
                                <div className="space-y-4">
                                    <div>
                                        <Input
                                            type="text"
                                            name="customType"
                                            value={planData.customType}
                                            onChange={handleInputChange}
                                            className="w-full p-4"
                                            style={{ fontSize: '1.4rem' }}
                                            placeholder="Describe your plan type"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Goals */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        name="currentGoal"
                                        value={planData.currentGoal}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddGoal();
                                            }
                                        }}
                                        className="flex-1 p-4 border rounded"
                                        style={{ fontSize: '1.4rem' }}
                                        placeholder={`Goal number ${planData.goals.length + 1}`}
                                    />
                                    <Button
                                        onClick={handleAddGoal}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {planData.goals.map((goal, index) => (
                                    <div
                                        key={index}
                                        className="group relative flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <span className="text-sm font-medium">{goal}</span>
                                        <button
                                            onClick={() => {
                                                const newGoals = planData.goals.filter((_, i) => i !== index);
                                                setPlanData({ ...planData, goals: newGoals });
                                            }}
                                            className="absolute top-0 right-0 mt-[-8px] mr-[-4px] text-gray-500 hover:text-gray-700 bg-secondary rounded-full p-1"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Basic Information */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <Textarea
                                    name="description"
                                    value={planData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded p-4"
                                    style={{ fontSize: '1.4rem', lineHeight: '1.5' }}
                                    placeholder="Describe the person or the team"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <RadioGroup
                                value={planData.durationType}
                                onValueChange={(value: 'quantity' | 'deadline') =>
                                    setPlanData({ ...planData, durationType: value })}
                                className="grid grid-cols-2 gap-4 mb-6"
                            >
                                <div>
                                    <RadioGroupItem
                                        value="quantity"
                                        id="quantity"
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor="quantity"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                                    >
                                        <span className="text-sm font-medium">Set Duration</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem
                                        value="deadline"
                                        id="deadline"
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor="deadline"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                                    >
                                        <span className="text-sm font-medium">Set Deadline</span>
                                    </Label>
                                </div>
                            </RadioGroup>

                            {planData.durationType === 'quantity' ? (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={planData.durationValue}
                                                onChange={(e) => setPlanData({
                                                    ...planData,
                                                    durationValue: parseInt(e.target.value) || 1
                                                })}
                                                className="w-full p-4 text-lg text-center"
                                                style={{ fontSize: '1.4rem' }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Select
                                                value={planData.durationUnit}
                                                onValueChange={(value: 'days' | 'weeks' | 'months') =>
                                                    setPlanData({ ...planData, durationUnit: value })}
                                            >
                                                <SelectTrigger className="w-full p-2 bg-secondary text-secondary-foreground border rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="days">Days</SelectItem>
                                                    <SelectItem value="weeks">Weeks</SelectItem>
                                                    <SelectItem value="months">Months</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <Calendar
                                            mode="single"
                                            selected={planData.deadlineDate}
                                            onSelect={(date) => setPlanData({ ...planData, deadlineDate: date })}
                                            className="rounded-md border"
                                            disabled={(date) => date < new Date()}
                                        />
                                    </div>
                                    {planData.deadlineDate && (
                                        <Alert>
                                            <AlertTitle className='font-bold'>Selected Deadline</AlertTitle>
                                            <AlertDescription className='text-lg'>
                                                {format(planData.deadlineDate, 'PPP')}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 5 && (
                        <div className="space-y-8">
                            {/* Plan Type Header */}
                            <div className="flex items-center justify-center space-x-4 p-6 bg-blue-50 rounded-lg">
                                {planTypes.find(t => t.id === planData.type)?.icon && (
                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                        {React.createElement(planTypes.find(t => t.id === planData.type)?.icon || Plus, {
                                            size: 32,
                                            className: "text-blue-500"
                                        })}
                                    </div>
                                )}
                                <h2 className="text-3xl font-medium capitalize">
                                    {planData.type === 'custom' ? planData.customType : `${planData.type} Plan`}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Goals Section */}
                                <Card className="col-span-2">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-2">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <CardTitle>Goals</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {planData.goals.map((goal, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full transition-colors cursor-default"
                                                >
                                                    {/* <span className="w-6 h-6 flex items-center justify-center bg-gray-200 group-hover:bg-gray-300 rounded-full text-sm font-medium">
                                            {index + 1}
                                        </span> */}
                                                    <span className="text-sm font-medium">{goal}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Target Users Section */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-2">
                                            <Users className="h-5 w-5 text-blue-500" />
                                            <CardTitle>For</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg text-gray-700">{planData.description}</p>
                                    </CardContent>
                                </Card>

                                {/* Duration Section */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-2">
                                            <CalendarIcon className="h-5 w-5 text-blue-500" />
                                            <CardTitle>{planData.deadlineDate ? 'Deadline' : 'Duration'}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {planData.durationType === 'quantity' ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-2xl font-semibold text-blue-600">
                                                        {planData.durationValue}
                                                    </span>
                                                    <span className="text-lg text-gray-600 capitalize">
                                                        {planData.durationUnit}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="text-2xl font-semibold text-blue-600">
                                                        {format(planData.deadlineDate || new Date(), 'MMMM d, yyyy')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
                {/* Navigation buttons */}
                {(step > 1 || planData.type === 'custom') && (
                    <div className="flex justify-between mt-8">
                        {step > 1 && (
                            <Button
                                onClick={handleBack}
                                className="flex items-center gap-2"
                                variant="outline"
                            >
                                <ChevronLeft size={16} />
                                Back
                            </Button>
                        )}
                        {step < 5 ? (
                            <Button
                                onClick={handleNext}
                                className="flex items-center gap-2 ml-auto"
                                disabled={planData.type === 'custom' && !planData.customType.trim()}
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setOpenAIChat(() => true)}
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 ml-auto"
                            >
                                Create Plan with AI
                                <Check size={16} />
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PlanCreationWizard;