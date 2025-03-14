import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartArea, Coffee, Notebook } from "lucide-react"
import { Dispatch, SetStateAction } from "react"
import { TabValue } from "../dashboard/main"

interface MainNavProps {
    activeTab: string
    setActiveTab: Dispatch<SetStateAction<TabValue>>
}

export function TabsTriggers({ activeTab, setActiveTab }: MainNavProps) {
    const handleTabChange = (tab: TabValue) => {
        setActiveTab(tab);
    }

    return (
        <TabsList className="bg-background/80 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger
                onClick={() => handleTabChange('report')}
                className={`transition-all duration-200 px-4 py-2 rounded-md
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-sm dark:hover:bg-neutral-800 hover:bg-neutral-200
                    flex items-center gap-2`}
                value="report"
            >
                <ChartArea className="size-4" />
                <p className="md:block hidden font-medium">Report</p>
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('focus')}
                className={`transition-all duration-200 px-4 py-2 rounded-md
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-sm dark:hover:bg-neutral-800 hover:bg-neutral-200
                    flex items-center gap-2`}
                value="focus"
            >
                <Notebook className="size-4" />
                <p className="md:block hidden font-medium">Notes</p>
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('break')}
                className={`transition-all duration-200 px-4 py-2 rounded-md
                    data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-sm dark:hover:bg-neutral-800 hover:bg-neutral-200
                    flex items-center gap-2`}
                value="break"
            >
                <Coffee className="size-4" />
                <p className="md:block hidden font-medium">Break</p>
            </TabsTrigger>
        </TabsList>
    )
}