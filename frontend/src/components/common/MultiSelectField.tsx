// MultiSelectField component for handling many-to-many relationships
import React from "react";
import { CheckIcon, ChevronDownIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  description?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  id,
  label,
  values,
  onChange,
  options,
  placeholder = "Select options",
  description,
  error,
  required = false,
  disabled = false,
}) => {
  // Memoize handlers to prevent unnecessary re-renders
  const handleSelect = React.useCallback((value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }, [values, onChange]);

  // Handle removal of a selected option
  const handleRemove = React.useCallback((value: string) => {
    onChange(values.filter((v) => v !== value));
  }, [values, onChange]);

  // Clear all selected options
  const handleClear = React.useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Memoize the selected labels
  const selectedLabels = React.useMemo(() => values.map(
    (value) => options.find((option) => option.value === value)?.label || value
  ), [values, options]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="block text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {values.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-auto py-0 px-2"
          >
            Clear
          </Button>
        )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !values.length && "text-muted-foreground"
            )}
          >
            {values.length > 0
              ? `${values.length} selected`
              : placeholder}
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        values.includes(option.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "opacity-50 border-input"
                      )}
                    >
                      {values.includes(option.value) && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label, i) => (
            <Badge 
              key={i} 
              variant="secondary" 
              className="px-2 py-1 text-xs flex items-center gap-1"
            >
              {label}
              <button
                type="button"
                onClick={() => handleRemove(values[i])}
                disabled={disabled}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default MultiSelectField;