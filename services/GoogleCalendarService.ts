// services/GoogleCalendarService.ts
import { Plan, PlanActivity } from '@/types/plan';
import { createClient } from '@/utils/supabase/client';

interface GoogleEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    location?: string;
}

class GoogleCalendarService {
    private static DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
    private static SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

    static isInitialized = false;
    static gapi: any = null;

    static async initializeGoogleAPI() {
        if (this.isInitialized) return;

        return new Promise((resolve, reject) => {
            // Load the Google API client library
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            discoveryDocs: this.DISCOVERY_DOCS,
                        });

                        this.gapi = window.gapi;
                        this.isInitialized = true;
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            };

            script.onerror = () => {
                reject(new Error('Failed to load Google API script'));
            };

            document.body.appendChild(script);
        });
    }

    static async getAccessToken() {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
            throw new Error('User not authenticated');
        }

        // Check if we have Google OAuth provider
        const provider = data.session.user.app_metadata.provider;
        if (provider !== 'google') {
            throw new Error('User not authenticated with Google');
        }

        // For Supabase, we need to get a fresh token with the correct scopes
        // This assumes you've configured your Supabase Google OAuth with the calendar.readonly scope
        try {
            const { data: refreshData, error } = await supabase.functions.invoke('google-calendar-token', {
                body: { userId: data.session.user.id }
            });
        
            if (error) {
                console.error('Full error response:', error);
                throw error;
            }
            return refreshData.access_token;
        } catch (error) {
            console.error('Error getting Google Calendar access token:', error);
            throw new Error('Unable to access Google Calendar. Please reconnect your Google account with calendar permissions.');
        }
    }

    static async fetchEvents(startDate = new Date(), days = 30): Promise<GoogleEvent[]> {
        try {
            // Make sure the API is initialized
            if (!this.isInitialized) {
                await this.initializeGoogleAPI();
            }

            // Get the access token from Supabase session
            const accessToken = await this.getAccessToken();

            // Set the access token for the API call
            this.gapi.client.setToken({ access_token: accessToken });

            // Calculate time range for events
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + days);

            // Fetch events from Google Calendar
            const response = await this.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': startDate.toISOString(),
                'timeMax': endDate.toISOString(),
                'singleEvents': true,
                'orderBy': 'startTime'
            });

            return response.result.items as GoogleEvent[];
        } catch (error) {
            console.error('Error fetching Google Calendar events:', error);
            throw error;
        }
    }

    static async convertToActivities(googleEvents: GoogleEvent[]): Promise<Omit<PlanActivity, 'id'>[]> {
        // Convert Google Calendar events to your app's Activity format
        return googleEvents.map(event => ({
            title: event.summary,
            description: event.description || '',
            scheduled_timestamp: new Date(event.start.dateTime),
            end_timestamp: event.end.dateTime ? new Date(event.end.dateTime) : undefined,
            location: event.location || '',
            google_event_id: event.id,
            completed: false,
            source: 'google_calendar',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            plan: {} as Plan,
            status: 'To do', // Corrected status value
            notes: '',
            duration: undefined, // Optional fields
            metric_type: undefined,
            metric_target: undefined,
        }));
    }

}

export default GoogleCalendarService;