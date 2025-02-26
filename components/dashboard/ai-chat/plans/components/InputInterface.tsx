import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingInput } from './LoadingGoalsText';
import { ApiResponse } from '@/types/plan';

interface InputInterfaceProps {
    loading: boolean;
    apiResponse?: ApiResponse;
    userSelect: string;
    userInput: string;
    handleOptionSelect: (value: string) => void;
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (initialGoal?: string) => void;
}

export const InputInterface = ({
    loading,
    apiResponse,
    userSelect,
    userInput,
    handleOptionSelect,
    handleInputChange,
    handleSubmit
}: InputInterfaceProps) => {
    return (
        <div className="space-y-3 sm:space-y-4">
            {loading ? (
                <LoadingInput />
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {apiResponse?.type === 'text' ? (
                        <div className="space-y-2 sm:space-y-3">
                            {apiResponse.options && (
                                <Select onValueChange={handleOptionSelect} value={userSelect}>
                                    <SelectTrigger className="w-full h-10 sm:h-12 text-base sm:text-lg dark:bg-gray-700 dark:text-gray-200">
                                        <SelectValue
                                            className='text-primary/60'
                                            placeholder={apiResponse.otherPlaceholder
                                                ? apiResponse.otherPlaceholder.charAt(0).toUpperCase() + apiResponse.otherPlaceholder.slice(1)
                                                : "Select an option"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800">
                                        {apiResponse.options.map((option, index) => (
                                            <SelectItem key={index} value={option}>
                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {userSelect === 'other' && (
                                <Input
                                    type="text"
                                    value={userInput}
                                    style={{ fontSize: '1rem' }}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmit();
                                        }
                                    }}
                                    placeholder={apiResponse.otherPlaceholder!.charAt(0).toUpperCase() + apiResponse.otherPlaceholder!.slice(1)}
                                    className="h-10 sm:h-12 text-base sm:text-lg dark:bg-gray-700 dark:text-gray-200"
                                />
                            )}
                        </div>
                    ) : (
                        <Input
                            type="date"
                            value={userInput}
                            onChange={handleInputChange}
                            className="h-10 sm:h-12 text-base sm:text-lg dark:bg-gray-700 dark:text-gray-200"
                        />
                    )}
                </div>
            )}
            <Button
                onClick={() => handleSubmit()}
                disabled={loading}
                size="default"
                className="sm:size-lg w-full text-base sm:text-lg dark:bg-blue-600 dark:hover:bg-blue-700"
            >
                {loading ? 'Generating the next step...' : 'Next'}
            </Button>
        </div>
    );
};