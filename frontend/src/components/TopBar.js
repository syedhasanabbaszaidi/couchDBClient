import { useState } from 'react';
import { Database, LogOut, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function TopBar({
  databases,
  selectedDatabase,
  onSelectDatabase,
  onDisconnect,
  connectionUrl,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-14 border-b border-slate-200 flex items-center px-4 bg-white z-20 flex-shrink-0" data-testid="topbar">
      <div className="flex items-center gap-2 mr-4">
        <Database className="w-5 h-5 text-orange-600" />
        <span className="text-sm font-semibold text-slate-900 font-heading">CouchDB Client</span>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-64 h-9 justify-between"
              data-testid="database-selector"
            >
              {selectedDatabase || "Select database..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Search databases..." />
              <CommandList>
                <CommandEmpty>No database found.</CommandEmpty>
                <CommandGroup>
                  {databases.map((db) => (
                    <CommandItem
                      key={db}
                      value={db}
                      onSelect={() => {
                        onSelectDatabase(db);
                        setOpen(false);
                      }}
                      data-testid={`database-option-${db}`}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDatabase === db ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {db}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <span className="text-xs text-slate-500 font-mono">{connectionUrl}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        className="h-9 text-slate-600 hover:text-slate-900"
        data-testid="disconnect-btn"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Disconnect
      </Button>
    </div>
  );
}
