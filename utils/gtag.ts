export const GA_TRACKING_ID = 'G-7HETM3VB26'

// Typescript interfaces for gtag
interface GTagEvent {
  action: string
  category: string
  label: string
  value?: number
}

// Declare gtag as a global function
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'consent', 
      action: string, 
      params?: any
    ) => void
  }
}

// Initialize Google Analytics
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// Track specific events
export const event = ({ action, category, label, value }: GTagEvent) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  })
}