import { Construction, Dice6Icon, Headphones, Search, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";

// Define extended user type with additional properties
interface ExtendedUser extends User {
    fullName?: string;
    photoURL?: string;
}

// Define ChatRoom type since it's not available
interface ChatRoom {
    id: string;
    name?: string;
    participants: ExtendedUser[];
}

export function ChatRoom() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [friendsBreak, setFriendsBreak] = useState<ExtendedUser[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<ExtendedUser[]>([]);
    const [activeTab, setActiveTab] = useState<string>("rooms");

    // This function will be implemented later to search for users
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // In the future, this will make an API call to search for users
        // For now, just setting up the structure
        setSearchResults([]);
    };

    // This function will be implemented later to initiate a call
    const initiateCall = (user: ExtendedUser) => {
        // Will be implemented in the future
        console.log("Initiating call with", user.fullName || user.email);
    };

    // This function will be implemented later to connect with a user
    const connectWithUser = (user: ExtendedUser) => {
        // Will be implemented in the future
        console.log("Connecting with", user.fullName || user.email);
    };

    return (
        <div className="w-full mx-auto h-[calc(100vh-50vh)] max-h-[600px]">
            <div className="flex flex-col md:flex-row items-stretch bg-card text-card-foreground border shadow p-3 md:p-4 rounded-md gap-3 md:gap-4 h-full">
                <div className="flex flex-col gap-2 md:border-r border-border h-full md:pr-4 w-full md:w-auto md:min-w-[220px] md:max-w-[280px]">
                    <Tabs defaultValue="rooms" onValueChange={setActiveTab} className="w-full flex flex-col h-full">
                        <TabsList className="grid w-full grid-cols-2 mb-2">
                            <TabsTrigger value="rooms">Chat Rooms</TabsTrigger>
                            <TabsTrigger value="search">Find People</TabsTrigger>
                        </TabsList>

                        <TabsContent value="rooms" className="flex flex-col flex-grow h-[calc(100%-60px)] mt-0">
                            {/* Desktop view - vertical scrolling list */}
                            <div className="hidden md:flex flex-col relative gap-3 h-full overflow-y-auto pr-1 mb-2 scrollbar-hide">
                                {rooms.length === 0 && friendsBreak.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center my-4">No active rooms</p>
                                )}

                                {rooms.map((room, index) => (
                                    <div key={index} className="relative flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md transition-colors">
                                        <div className="w-12 h-12 relative flex-shrink-0">
                                            {room.participants.slice(0, 2).map((participant, idx) => (
                                                <Avatar key={participant.id} className={`absolute ${idx === 0 ? 'z-10 border-2 border-background top-1 left-1' : 'bottom-1 right-1'}`}>
                                                    <AvatarImage src={participant.photoURL || ""} alt={participant.fullName || participant.email || ""} />
                                                    <AvatarFallback>{(participant.fullName || participant.email || "").slice(0, 2)}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {room.participants[0]?.fullName || room.participants[0]?.email},
                                                {room.participants[1] ? (room.participants[1]?.fullName || room.participants[1]?.email) : ''}
                                                {room.participants.length > 2 ? ` + ${room.participants.length - 2}` : ''}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size={"sm"} className="w-fit px-3 py-1 h-fit text-xs">Join room</Button>
                                                <Button size={"sm"} variant="outline" className="w-fit p-1 h-fit" title="Call" aria-label="Start voice call">
                                                    <Phone className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {friendsBreak.map((friend, index) => (
                                    <div key={index} className="relative flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md transition-colors">
                                        <div className="w-10 h-10 relative flex-shrink-0">
                                            <Avatar>
                                                <AvatarImage src={friend.photoURL || ""} alt={friend.fullName || friend.email || ""} />
                                                <AvatarFallback>{(friend.fullName || friend.email || "").slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {friend.fullName || friend.email}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size={"sm"} className="w-fit px-3 py-1 h-fit text-xs">Join room</Button>
                                                <Button size={"sm"} variant="outline" className="w-fit p-1 h-fit" title="Call" aria-label="Start voice call">
                                                    <Phone className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mobile view - horizontal scrolling with circular Random Room button */}
                            <div className="md:hidden flex flex-col h-full">
                                <div className="relative w-full flex-grow mb-2">
                                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide h-full items-center pr-16">
                                        {rooms.length === 0 && friendsBreak.length === 0 ? (
                                            <p className="text-sm text-muted-foreground pl-4 py-4">No active rooms</p>
                                        ) : (
                                            <>
                                                {rooms.map((room, index) => (
                                                    <div key={index} className="flex-shrink-0 w-40 p-2 border border-border rounded-md bg-background">
                                                        <div className="w-full flex justify-center mb-2">
                                                            <div className="relative w-12 h-12">
                                                                {room.participants.slice(0, 2).map((participant, idx) => (
                                                                    <Avatar key={participant.id} className={`absolute ${idx === 0 ? 'z-10 border-2 border-background top-1 left-1' : 'bottom-1 right-1'}`}>
                                                                        <AvatarImage src={participant.photoURL || ""} alt={participant.fullName || participant.email || ""} />
                                                                        <AvatarFallback>{(participant.fullName || participant.email || "").slice(0, 2)}</AvatarFallback>
                                                                    </Avatar>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-medium text-center truncate mb-2">
                                                            {room.participants[0]?.fullName || room.participants[0]?.email}
                                                            {room.participants.length > 1 ? ` + ${room.participants.length - 1}` : ''}
                                                        </p>
                                                        <Button size={"sm"} className="w-full py-1 h-6 text-xs">Join</Button>
                                                    </div>
                                                ))}

                                                {friendsBreak.map((friend, index) => (
                                                    <div key={index} className="flex-shrink-0 w-40 p-2 border border-border rounded-md bg-background">
                                                        <div className="w-full flex justify-center mb-2">
                                                            <Avatar>
                                                                <AvatarImage src={friend.photoURL || ""} alt={friend.fullName || friend.email || ""} />
                                                                <AvatarFallback>{(friend.fullName || friend.email || "").slice(0, 2)}</AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                        <p className="text-xs font-medium text-center truncate mb-2">
                                                            {friend.fullName || friend.email}
                                                        </p>
                                                        <Button size={"sm"} className="w-full py-1 h-6 text-xs">Join</Button>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Circular Random Room button on the right */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                        <Button
                                            className="h-12 w-12 rounded-full bg-app-gradient text-white hover:opacity-90 transition-opacity shadow-md"
                                            aria-label="Join random roulette room"
                                            title="Random Room"
                                        >
                                            <Dice6Icon className="size-6" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="search" className="flex flex-col flex-grow h-[calc(100%-60px)] mt-0">
                            <div className="relative flex items-center mb-3">
                                <Search className="absolute left-2 size-4 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    className="pl-8"
                                    placeholder="Search for people..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    aria-label="Search for people"
                                />
                            </div>
                            <div className="flex flex-col gap-3 overflow-y-auto h-full pr-1 mb-2 scrollbar-hide">
                                {searchResults.map((user, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md transition-colors">
                                        <Avatar className="flex-shrink-0">
                                            <AvatarImage src={user.photoURL || ""} alt={user.fullName || user.email || ""} />
                                            <AvatarFallback>{(user.fullName || user.email || "").slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.fullName || user.email}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => connectWithUser(user)}
                                                title="Connect"
                                                aria-label={`Connect with ${user.fullName || user.email}`}
                                                className="hover:bg-accent"
                                            >
                                                <UserPlus className="size-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => initiateCall(user)}
                                                title="Call"
                                                aria-label={`Call ${user.fullName || user.email}`}
                                                className="hover:bg-accent"
                                            >
                                                <Phone className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center my-4">
                                        No users found matching "{searchQuery}"
                                    </p>
                                )}
                                {!searchQuery && (
                                    <p className="text-sm text-muted-foreground text-center my-4">
                                        Type to search for people
                                    </p>
                                )}
                            </div>
                        </TabsContent>

                        {/* Desktop-only Roulette Room button */}
                        <Button
                            className="mt-auto bg-app-gradient text-white hover:opacity-90 transition-opacity hidden md:flex"
                            aria-label="Join random roulette room"
                        >
                            <span>Roulette Room</span>
                            <Dice6Icon className="ml-2 size-4" />
                        </Button>
                    </Tabs>
                </div>

                <div className="hidden md:flex flex-col items-center justify-center gap-3 w-full">
                    <div className="border border-border rounded-full text-muted-foreground p-4 w-fit">
                        <Construction className="size-8" aria-hidden="true" />
                    </div>
                    <p className="text-center font-medium">This functionality is under construction</p>
                    <p className="text-muted-foreground text-sm text-center max-w-md">
                        Soon you'll be able to search for other users, connect with them,
                        and have voice conversations within the application.
                    </p>
                </div>

                {/* Mobile-only construction message */}
                <div className="flex md:hidden flex-col items-center justify-center gap-2 mt-2">
                    <div className="border border-border rounded-full text-muted-foreground p-3 w-fit">
                        <Construction className="size-6" aria-hidden="true" />
                    </div>
                    <p className="text-center font-medium text-sm">Under construction</p>
                    <p className="text-muted-foreground text-xs text-center">
                        Voice chat functionality coming soon
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;