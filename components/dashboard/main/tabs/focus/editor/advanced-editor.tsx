"use client";

import React, { useEffect, useState } from 'react';
import { RealtimeEditor } from './RealtimeEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DateRadioGroup from './date-radio-group';
import { useNotes } from '@/hooks/use-notes';
import { JSONContent } from 'novel';

interface EditorProps {
  user: User | null | undefined;
}

export const Editor: React.FC<EditorProps> = ({
  user
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'project'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [contentEditor, setContentEditor] = useState<JSONContent | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const [days, setDays] = useState<Date[]>(
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 1 + i);
      return date;
    })
  );

  const {
    dailyNote,
    loading,
    saveNotes,
    fetchNotes,
  } = useNotes({ user });

  useEffect(() => {
    fetchNotes(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date: Date) => {
    saveNotes(selectedDate, contentEditor as JSONContent, dailyNote?.id as number);
    setSelectedDate(date);
  };

  useEffect(() => {
    const checkOverflow = () => {
      setIsOverflowing(window.innerWidth < 1024);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  useEffect(() => {
    setContentEditor(dailyNote?.content as JSONContent);
  }, [dailyNote]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as 'daily' | 'project')}
      className="w-full h-full"
    >
      <TabsList>
        <TabsTrigger value="daily">Daily Notes</TabsTrigger>
        <TabsTrigger value="project">Project Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="daily">
        <div className="flex items-center justify-between mb-2">
          <Button
            className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
            variant="outline"
            onClick={() => {
              const newDays = days.map((day) => {
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() - 1);
                return newDate;
              });
              setDays(newDays);
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              handleDateChange(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DateRadioGroup
            selectedDate={selectedDate}
            days={days}
            isOverflowing={isOverflowing}
            isPending={false}
            onChangeDate={handleDateChange} />
          <Button
            className="bg-muted text-muted-foreground px-2 py-2 rounded-full"
            variant="outline"
            onClick={() => {
              const newDays = days.map((day) => {
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() + 1);
                return newDate;
              });
              setDays(newDays);
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              handleDateChange(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {dailyNote && !loading && (
          <RealtimeEditor
            key={dailyNote.id} // This helps force a remount when changing notes
            tableName="user_daily_notes"
            rowId={dailyNote.id}
            initalLastSaved={dailyNote.updated_at ? new Date(dailyNote.updated_at) : undefined}
            initialContent={dailyNote.content as JSONContent}
            onContentUpdate={(content) => {
              setContentEditor(content);
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="project">
        {/* {selectedProjectNotes && (
          <RealtimeEditor
            tableName="user_projects_notes"
            rowId={selectedProjectNotes.id}
          />
        )} */}
      </TabsContent>
    </Tabs>
  );
};