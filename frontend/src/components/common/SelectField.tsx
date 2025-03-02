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
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = React.memo(({
  id,
  label,
  value,
  onChange,
  options,
  error,
  placeholder = "Select an option",
  required = false,
}) => {
  // Only call onChange if the value is actually changing
  const handleValueChange = React.useCallback((newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Select
        value={value || ""}
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
      
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});