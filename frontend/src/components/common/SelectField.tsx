// src/components/common/SelectField.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string | null;
  placeholder?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  placeholder = "Select an option",
  required = false,
}) => {
  // Memoize the handler to avoid frequent recreation
  const handleValueChange = React.useCallback((newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, onChange]);

  // Memoize props to prevent unnecessary re-renders
  const memoizedValue = React.useMemo(() => value || "", [value]);
  
  // Memoize the Select component to prevent re-rendering when props don't change
  const selectComponent = React.useMemo(() => (
    <Select
      value={memoizedValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger id={id} className={error ? "border-red-500" : ""}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ), [memoizedValue, handleValueChange, id, error, placeholder, options]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-base">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      {selectComponent}
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

SelectField.displayName = "SelectField";