import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationsProps {
    userId: string;
}

export function NavbarNotifications({ userId }: NotificationsProps) {
    const {
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllAsRead,
        renderNotificationIcon
    } = useNotifications(userId);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={`cursor-pointer hidden md:flex hover:text-foreground flex-col items-center gap-1 cursor-pointer text-muted-foreground relative`}
                >
                    <Bell className='size-5' />
                    {unreadCount > 0 && (
                        <div className="absolute top-[-8px] right-[-8px] md:top-[-2px] md:right-[16px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                            {unreadCount}
                        </div>
                    )}
                    <p className='text-xs'>Notifications</p>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                {notifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                        No notifications
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-center p-2 hover:bg-accent rounded-md transition-colors cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                                onClick={() => markNotificationAsRead(notification.id)}
                            >
                                <div className="mr-3">
                                    {renderNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        {notification.content.fromUserFullName} {notification.type}ed you
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(new Date(notification.created_at))}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <CheckCircle2 className="text-primary size-4" />
                                )}
                            </div>
                        ))}
                    </ScrollArea>
                )}
            </PopoverContent>
        </Popover>
    );
}