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
        <TabsList>
            <TabsTrigger
                onClick={() => handleTabChange('report')}
                className="dark:hover:bg-neutral-900 hover:bg-neutral-100"
                value="report"
            >
                <p className="md:block hidden">Report</p>
                <ChartArea className="md:hidden block size-5" />
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('focus')}
                className="dark:hover:bg-neutral-900 hover:bg-neutral-100"
                value="focus"
            >
                <p className="md:block hidden">Notes</p>
                <Notebook className="md:hidden block size-5" />
            </TabsTrigger>
            <TabsTrigger
                onClick={() => handleTabChange('break')}
                className="dark:hover:bg-neutral-900 hover:bg-neutral-100"
                value="break"
            >
                <p className="md:block hidden">Break</p>
                <Coffee className="md:hidden block size-5" />
            </TabsTrigger>
        </TabsList>
    )
}