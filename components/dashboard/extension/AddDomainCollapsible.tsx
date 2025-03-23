import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PopularSite {
    name: string;
    domain: string;
}

interface BlockedSite {
    id: number;
    domain: string;
}

interface AddDomainCollapsibleProps {
    isAddingDomain: boolean;
    setIsAddingDomain: (value: boolean) => void;
    newDomain: string;
    setNewDomain: (value: string) => void;
    domainError: string;
    loading: boolean;
    blockedSites: BlockedSite[];
    mostPopularDomains: PopularSite[];
    handleAddDomain: (e: React.FormEvent) => Promise<void>;
    addBlockedSite: (domain: string, maxVisits: number) => Promise<any>;
    refreshStats: () => Promise<void>;
}

export function AddDomainCollapsible({
    isAddingDomain,
    setIsAddingDomain,
    newDomain,
    setNewDomain,
    domainError,
    loading,
    blockedSites,
    mostPopularDomains,
    handleAddDomain,
    addBlockedSite,
    refreshStats
}: AddDomainCollapsibleProps) {

    const handleQuickAdd = async (site: PopularSite) => {
        try {
            const result = await addBlockedSite(site.domain, 3);
            if (result) {
                await refreshStats();
                toast.success(`${site.domain} added to blocked sites`);
            }
        } catch (err) {
            toast.error(`Failed to add ${site.domain}`);
        }
    };

    const availablePopularSites = mostPopularDomains.filter(
        site => !blockedSites.some(blocked => blocked.domain === site.domain)
    );

    return (
        <Collapsible
            open={isAddingDomain}
            onOpenChange={setIsAddingDomain}
            className="border rounded-md"
        >
            <CollapsibleTrigger asChild>
                <Button
                    variant={isAddingDomain ? "secondary" : "default"}
                    className={`w-full flex justify-between ${isAddingDomain ? "mb-0" : "mb-4"}`}
                >
                    <span className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add a new website
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAddingDomain ? "transform rotate-180" : ""}`} />
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-4 space-y-4 border-t">
                {/* Quick Add Popular Sites */}
                {availablePopularSites.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Quick add popular sites:</h4>
                        <div className="flex flex-wrap gap-2">
                            {availablePopularSites.map((site) => (
                                <Button
                                    key={site.domain}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAdd(site)}
                                    disabled={loading}
                                >
                                    {site.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Domain Add Form */}
                <form onSubmit={handleAddDomain} className="flex items-start space-x-2">
                    <div className="flex-1 space-y-1">
                        <Input
                            placeholder="example.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            className={domainError ? "border-red-500" : ""}
                        />
                        {domainError && (
                            <p className="text-xs text-red-500">{domainError}</p>
                        )}
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add site
                    </Button>
                </form>
            </CollapsibleContent>
        </Collapsible>
    );
}