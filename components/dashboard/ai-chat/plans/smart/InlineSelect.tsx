import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const InlineSelect = ({
    value,
    onValueChange,
    options,
    nextStep
}: {
    value: string,
    onValueChange: (value: string, nextStep: string) => void,
    options: { value: string, label: string }[],
    nextStep: string
}) => (
    <Select
        value={value}
        onValueChange={(value) => onValueChange(value, nextStep)}
    >
        <SelectTrigger className="w-fit min-w-40 h-8 bg-white">
            <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);