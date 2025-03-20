// Session state manager to prevent reopening closed sessions

const SESSION_CLOSED_KEY = 'focus_session_manually_closed';

// Store session IDs that have been manually closed
export const markSessionClosed = (sessionId: string | null) => {
  if (!sessionId) return;
  
  try {
    // Store this session ID as closed in local storage
    localStorage.setItem(SESSION_CLOSED_KEY, sessionId);
  } catch (error) {
    // Handle potential localStorage errors
    console.error('Error storing session state:', error);
  }
};

// Check if a session was manually closed by the user
export const wasSessionClosed = (sessionId: string | null) => {
  if (!sessionId) return false;
  
  try {
    const closedSessionId = localStorage.getItem(SESSION_CLOSED_KEY);
    return closedSessionId === sessionId;
  } catch (error) {
    console.error('Error retrieving session state:', error);
    return false;
  }
};

// Clear the closed session flag
export const clearClosedSessionState = () => {
  try {
    localStorage.removeItem(SESSION_CLOSED_KEY);
  } catch (error) {
    console.error('Error clearing session state:', error);
  }
};