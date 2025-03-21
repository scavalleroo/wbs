import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';
import { isExtensionInstalled } from '@/utils/extension-detector';

const EXTENSION_ID = 'ofednploandhnfgmnfhjmialifodkcdj';
const CHROME_STORE_URL = `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`;

interface ExtensionStatusProps {
    className?: string;
}

export function ExtensionStatus({ className = '' }: ExtensionStatusProps) {
    const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
    const [isCheckingExtension, setIsCheckingExtension] = useState(true);

    useEffect(() => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;

        const checkExtension = async () => {
            setIsCheckingExtension(true);
            try {
                const result = await isExtensionInstalled(EXTENSION_ID);
                setIsInstalled(result);
            } catch (error) {
                console.error("Error checking extension:", error);
                setIsInstalled(false);
            } finally {
                setIsCheckingExtension(false);
            }
        };

        checkExtension();

        // Periodically check (e.g., if user installs during session)
        const intervalId = setInterval(checkExtension, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (isCheckingExtension && isInstalled === null) {
        // Loading state
        return <div className={`flex items-center ${className}`}>Checking extension...</div>;
    }

    return (
        <div className={`flex items-center ${className}`}>
            {isInstalled ? (
                <div className="flex items-center text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    <span>Website blocking enabled</span>
                </div>
            ) : (
                <div className="flex flex-col space-y-1">
                    <div className="text-sm text-amber-600 mb-1">Website blocking disabled</div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(CHROME_STORE_URL, '_blank')}
                        className="flex items-center"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Get Chrome Extension
                    </Button>
                </div>
            )}
        </div>
    );
}