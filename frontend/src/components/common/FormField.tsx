// src/components/common/FormField.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "textarea";
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  rows = 3,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {type === "text" ? (
        <Input
          id={id}
          name={id}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? "border-red-500" : ""}
        />
      ) : (
        <Textarea
          id={id}
          name={id}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={error ? "border-red-500" : ""}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
