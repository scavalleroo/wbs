/**
 * Checks if a Chrome extension with specific ID is installed
 * @param extensionId The ID of the Chrome extension to check
 * @returns Promise resolving to true if extension is installed, false otherwise
 */
export const isExtensionInstalled = (extensionId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // If not in a browser environment, resolve as false
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Check if we're in a Chrome-like environment
    if (typeof window.chrome === 'undefined' || !window.chrome.runtime || !window.chrome.runtime.sendMessage) {
      resolve(false);
      return;
    }

    // Use a flag to ensure we only resolve once
    let hasResolved = false;
    const safeResolve = (value: boolean) => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(value);
      }
    };

    // Attempt to communicate with the extension
    try {
      chrome.runtime.sendMessage(extensionId, { message: 'ping' }, (response) => {
        // Chrome sets lastError if the extension doesn't exist
        if (chrome.runtime.lastError) {
          safeResolve(false);
        } else {
          safeResolve(true);
        }
      });
      
      // Set a timeout to handle no response cases
      setTimeout(() => safeResolve(false), 300);
    } catch (error) {
      safeResolve(false);
    }
  });
};