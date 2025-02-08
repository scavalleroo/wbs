"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SelectTrigger } from '@radix-ui/react-select';

const PlanCreationWizard = () => {
    const [step, setStep] = useState(1);
    const [planData, setPlanData] = useState<{
        title: string;
        description: string;
        duration: string;
        frequency: string;
        goals: string[];
        currentGoal: string;
    }>({
        title: '',
        description: '',
        duration: '',
        frequency: '',
        goals: [],
        currentGoal: ''
    });

    const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
        setPlanData({ ...planData, [e.target.name]: e.target.value });
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

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Plan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Progress indicator */}
                    <div className="flex justify-between mb-8">
                        {[1, 2, 3, 4].map((num) => (
                            <div key={num} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step >= num ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                    {step > num ? <Check size={16} /> : num}
                                </div>
                                {num < 4 && (
                                    <div className={`h-1 w-16 ${step > num ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plan Title</label>
                                <Input
                                    type="text"
                                    name="title"
                                    value={planData.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Enter plan title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Textarea
                                    name="description"
                                    value={planData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Describe your plan"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Timeline */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration</label>
                                <Select
                                    name="duration"
                                    value={planData.duration}
                                    onValueChange={(value) => setPlanData({ ...planData, duration: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-week">1 Week</SelectItem>
                                        <SelectItem value="2-weeks">2 Weeks</SelectItem>
                                        <SelectItem value="1-month">1 Month</SelectItem>
                                        <SelectItem value="3-months">3 Months</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Frequency</label>
                                <Select
                                    name="frequency"
                                    value={planData.frequency}
                                    onValueChange={(value) => setPlanData({ ...planData, frequency: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Goals */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Add Goals</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        name="currentGoal"
                                        value={planData.currentGoal}
                                        onChange={handleInputChange}
                                        className="flex-1 p-2 border rounded"
                                        placeholder="Enter a goal"
                                    />
                                    <Button
                                        onClick={handleAddGoal}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {planData.goals.map((goal, index) => (
                                    <Alert key={index}>
                                        <AlertTitle>Goal {index + 1}</AlertTitle>
                                        <AlertDescription>{goal}</AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-medium">Review Your Plan</h3>
                            <div className="space-y-2">
                                <p><strong>Title:</strong> {planData.title}</p>
                                <p><strong>Description:</strong> {planData.description}</p>
                                <p><strong>Duration:</strong> {planData.duration}</p>
                                <p><strong>Frequency:</strong> {planData.frequency}</p>
                                <div>
                                    <strong>Goals:</strong>
                                    <ul className="list-disc pl-5">
                                        {planData.goals.map((goal, index) => (
                                            <li key={index}>{goal}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-8">
                        {step > 1 && (
                            <Button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} />
                                Back
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto"
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => console.log('Plan created:', planData)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-auto"
                            >
                                Create Plan
                                <Check size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlanCreationWizard;