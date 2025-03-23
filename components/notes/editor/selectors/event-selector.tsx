import { Button } from "@/components/ui/button";
import { Command } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock, LucideCalendarPlus, X } from "lucide-react";
import { useEditor } from "novel";
import { useEffect, useState } from "react";

interface EventSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventSelector = ({ open, onOpenChange }: EventSelectorProps) => {
  const { editor } = useEditor();
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isSuccess, setIsSuccess] = useState(false);

  // Capture selected text when the component mounts or when open changes
  useEffect(() => {
    if (open && editor && editor.state.selection) {
      const slice = editor.state.selection.content();
      if (slice.content.size > 0) {
        const text = editor.storage.markdown.serializer.serialize(slice.content);
        setEventTitle(text.trim());
      }

      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setEventDate(today);
    } else if (!open) {
      // Reset state when closing
      setIsSuccess(false);
      setEventTitle("");
    }
  }, [open, editor]);

  const handleCreateEvent = () => {
    if (!eventTitle || !eventDate || !startTime || !endTime) {
      return; // Don't proceed if fields are empty
    }

    // Format the date and time for Google Calendar
    const startDateTime = `${eventDate}T${startTime}:00`;
    const endDateTime = `${eventDate}T${endTime}:00`;

    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&details=${encodeURIComponent('Event created from notes')}`;

    // Open in a new tab
    window.open(googleCalendarUrl, '_blank');

    // Just show success state without modifying the editor content
    setIsSuccess(true);

    // Close after showing success message
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!editor) return null;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="gap-2 rounded-none border-none"
        onClick={() => onOpenChange(true)}
      >
        <LucideCalendarPlus className="h-4 w-4" style={{ color: "#e3683e" }} />
        <p>Event</p>
      </Button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1">
          <Command className="w-[350px] rounded-lg border shadow-md">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <h3 className="text-sm font-medium">
                {isSuccess ? "Success" : "Create Calendar Event"}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="max-h-[400px]">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center p-6">
                  <Check className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-center">Event added to Google Calendar!</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Event Title
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        autoFocus
                        placeholder="Meeting with team"
                        className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Start Time
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full rounded border border-input bg-background pl-7 pr-2 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          End Time
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full rounded border border-input bg-background pl-7 pr-2 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={handleCreateEvent}
                        disabled={!eventTitle || !eventDate || !startTime || !endTime}
                      >
                        Create Event
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </Command>
        </div>
      )}
    </>
  );
};