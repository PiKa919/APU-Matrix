'use client';

import { useState } from 'react';
import { Search, ChevronDown, Check, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Dropdown({ label, options, selected, onToggle, onSelectAll, icon: Icon }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-2 mb-6">
            <label className="text-[11px] font-semibold text-muted-foreground tracking-wide px-1">
                {label}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-card/80 border-border/60 hover:bg-card hover:border-border h-11 px-3 rounded-xl transition-all"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Icon size={14} className="text-primary/70 shrink-0" />
                            <span className="text-xs font-medium truncate">
                                {selected.size === 0
                                    ? `Select ${label}...`
                                    : selected.size === options.length
                                        ? `All ${label}s`
                                        : `${selected.size} Selected`}
                            </span>
                        </div>
                        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", open && "rotate-180")} />
                    </Button>
                </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border/60 shadow-xl rounded-xl overflow-hidden" align="start">
                    <Command className="bg-transparent">
                        <CommandInput placeholder={`Search ${label}...`} className="h-10 text-xs" />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No {label.toLowerCase()} found.</CommandEmpty>
                            <div className="p-2 border-b border-border/40 flex items-center justify-between bg-muted/30">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onSelectAll}
                                    className="h-7 px-2 text-[10px] font-semibold text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors tracking-widest"
                                >
                                    {selected.size === options.length ? 'Deselect All' : 'Select All'}
                                </Button>
                                {selected.size > 0 && (
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[9px] bg-primary/10 text-primary border-none font-bold">
                                        {selected.size}
                                    </Badge>
                                )}
                            </div>
                            <ScrollArea className="h-full">
                                <CommandGroup className="p-1">
                                    {options.map((option) => {
                                        const isActive = selected.has(option);
                                        return (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onSelect={() => onToggle(option)}
                                                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors"
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded border transition-all duration-200",
                                                    isActive ? "bg-primary border-primary" : "border-border/60"
                                                )}>
                                                    {isActive && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                                                </div>
                                                <span className={cn(
                                                    "text-xs transition-colors",
                                                    isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                                                )}>
                                                    {option}
                                                </span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </ScrollArea>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function Sidebar({
    brands, selectedBrands, onToggleBrand, onSelectAllBrands,
    chipsets, selectedChipsets, onToggleChipset, onSelectAllChipsets
}) {
    return (
        <aside className="sidebar h-full overflow-hidden flex flex-col p-5 border-r border-border/40 bg-card/40 backdrop-blur-3xl relative z-10">
            <div className="mb-8 flex items-center gap-3 animate-fade-in">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(47,183,166,0.12)]">
                    <Filter size={16} className="text-primary" />
                </div>
                <div className="flex flex-col">
                    <h2 className="text-[12px] font-semibold text-foreground tracking-wide">
                        Data filters
                    </h2>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
                        Fine-tune the view
                    </span>
                </div>
            </div>

            <Dropdown
                label="Brand"
                options={brands}
                selected={selectedBrands}
                onToggle={onToggleBrand}
                onSelectAll={onSelectAllBrands}
                icon={Search}
            />

            <Dropdown
                label="Processor"
                options={chipsets}
                selected={selectedChipsets}
                onToggle={onToggleChipset}
                onSelectAll={onSelectAllChipsets}
                icon={ChevronDown}
            />

            <div className="mt-auto space-y-4 animate-fade-in">
                <Separator className="bg-border/30" />
                <div className="text-center px-2">
                    <Badge variant="outline" className="text-[9px] font-semibold border-primary/20 text-primary/70 bg-primary/5 px-2 py-0.5 tracking-widest mb-2">
                        Filters combined
                    </Badge>
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                        Showing devices that match both Brand and Processor.
                    </p>
                </div>
            </div>
        </aside>
    );
}
