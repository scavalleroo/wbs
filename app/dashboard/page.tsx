import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, List, Star, Share2, ThumbsUp } from 'lucide-react';

const AIPlannerMVP = () => {
    const [activeView, setActiveView] = useState('plans');
    const [templates, setTemplates] = useState([]);
    const [results, setResults] = useState([]);

    // // Template browser section
    // const TemplateBrowser = () => (
    //     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //         {templates.map(template => (
    //             <Card key={template.id} className="hover:shadow-lg transition-shadow">
    //                 <CardHeader>
    //                     <CardTitle className="flex justify-between items-center">
    //                         <span>{template.title}</span>
    //                         <Button variant="ghost" size="sm">
    //                             <ThumbsUp className="w-4 h-4 mr-2" />
    //                             {template.likes_count}
    //                         </Button>
    //                     </CardTitle>
    //                 </CardHeader>
    //                 <CardContent>
    //                     <p className="text-gray-600 mb-2">{template.description}</p>
    //                     <div className="flex gap-2 items-center text-sm text-gray-500">
    //                         <Clock className="w-4 h-4" />
    //                         <span>{template.estimated_duration}</span>
    //                         <Star className="w-4 h-4 ml-2" />
    //                         <span>{template.difficulty_level}</span>
    //                     </div>
    //                     <Button className="mt-4" onClick={() => useTemplate(template.id)}>
    //                         Use Template
    //                     </Button>
    //                 </CardContent>
    //             </Card>
    //         ))}
    //     </div>
    // );

    // // Results section
    // const ResultsSection = () => (
    //     <div className="space-y-4">
    //         {results.map(result => (
    //             <Card key={result.id}>
    //                 <CardHeader>
    //                     <CardTitle className="flex justify-between items-center">
    //                         <span>{result.title}</span>
    //                         <div className="flex items-center gap-2">
    //                             {[...Array(result.success_rating)].map((_, i) => (
    //                                 <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    //                             ))}
    //                         </div>
    //                     </CardTitle>
    //                 </CardHeader>
    //                 <CardContent>
    //                     <p className="text-gray-600 mb-4">{result.description}</p>
    //                     <div className="space-y-2">
    //                         <h4 className="font-semibold">Key Learnings:</h4>
    //                         <ul className="list-disc pl-4">
    //                             {result.key_learnings.map((learning, i) => (
    //                                 <li key={i}>{learning}</li>
    //                             ))}
    //                         </ul>
    //                         <h4 className="font-semibold mt-4">Challenges Faced:</h4>
    //                         <ul className="list-disc pl-4">
    //                             {result.challenges_faced.map((challenge, i) => (
    //                                 <li key={i}>{challenge}</li>
    //                             ))}
    //                         </ul>
    //                     </div>
    //                     <Button variant="outline" className="mt-4" onClick={() => shareResult(result.id)}>
    //                         <Share2 className="w-4 h-4 mr-2" />
    //                         Share Result
    //                     </Button>
    //                 </CardContent>
    //             </Card>
    //         ))}
    //     </div>
    // );

    return (
        <div className="max-w-4xl mx-auto p-4">
            <Tabs defaultValue="plans" onValueChange={setActiveView}>
                <TabsList className="mb-4">
                    <TabsTrigger value="plans">My Plans</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="results">Community Results</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                    {/* Existing plans view */}
                </TabsContent>

                <TabsContent value="templates">
                    {/* <TemplateBrowser /> */}
                </TabsContent>

                <TabsContent value="results">
                    {/* <ResultsSection /> */}
                </TabsContent>

                <TabsContent value="calendar">
                    {/* Existing calendar view */}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AIPlannerMVP;