import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartArea, Coffee, HomeIcon, Notebook } from "lucide-react"
import { Dispatch, SetStateAction } from "react"
import { TabValue } from "../dashboard/main"
import { cn } from "@/lib/utils"

interface MainNavProps {
    activeTab: string
    setActiveTab: Dispatch<SetStateAction<TabValue>>
}

export function TabsTriggers({ activeTab, setActiveTab }: MainNavProps) {
    const handleTabChange = (tab: TabValue) => {
        setActiveTab(tab);
    }

    // Define colors for each tab type
    const getTabStyles = (tabValue: TabValue) => {
        const baseStyles = "transition-all duration-200 px-4 py-2 rounded-md flex items-center gap-2 dark:hover:bg-neutral-800 hover:bg-neutral-300/80";

        switch (tabValue) {
            case 'report':
                return cn(baseStyles, "data-[state=active]:bg-gradient-to-b data-[state=active]:from-indigo-800 data-[state=active]:to-purple-900 data-[state=active]:text-white");
            case 'focus':
                return cn(baseStyles, "data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-400 data-[state=active]:to-blue-600 data-[state=active]:text-white");
            case 'break':
                return cn(baseStyles, "data-[state=active]:bg-gradient-to-b data-[state=active]:from-green-400 data-[state=active]:to-green-600 data-[state=active]:text-white");
            default:
                return cn(baseStyles, "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground");
        }
    }

    return (
        <TabsList className="bg-neutral-300/40 dark:bg-neutral-50/10 backdrop-blur-sm p-0.5 sm:p-1 rounded-lg">
            <TabsTrigger
                onClick={() => handleTabChange('report')}
                className={getTabStyles('report')}
                value="report"
            >
                <HomeIcon className="size-4" />
                <p className="hidden sm:inline font-medium sm:text-xs">Dashboard</p>
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('focus')}
                className={getTabStyles('focus')}
                value="focus"
            >
                <Notebook className="size-4" />
                <p className="hidden sm:inline font-medium sm:text-xs">Notes</p>
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('break')}
                className={getTabStyles('break')}
                value="break"
            >
                <Coffee className="size-4" />
                <p className="hidden sm:inline font-medium sm:text-xs">Break</p>
            </TabsTrigger>
        </TabsList>
    )
}