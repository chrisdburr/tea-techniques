// src/hooks/useDynamicArrays.ts
import { useState } from "react";

export interface UseCase {
  description: string;
  assurance_goal?: number;
}

export interface Resource {
  resource_type: number;
  title: string;
  url: string;
  description: string;
  authors?: string;
  publication_date?: string;
  source_type?: string;
}

export function useDynamicArrays() {
  const [useCases, setUseCases] = useState<UseCase[]>([{ description: "" }]);
  const [limitations, setLimitations] = useState<string[]>([""]);
  const [resources, setResources] = useState<Resource[]>([
    { resource_type: 0, title: "", url: "", description: "", authors: "", publication_date: "", source_type: "" }
  ]);

  // Use case management
  const addUseCase = () => {
    setUseCases([...useCases, { description: "" }]);
  };

  const updateUseCase = (index: number, field: keyof UseCase, value: string | number | undefined) => {
    const updated = [...useCases];
    updated[index] = { ...updated[index], [field]: value };
    setUseCases(updated);
  };

  const removeUseCase = (index: number) => {
    if (useCases.length > 1) {
      setUseCases(useCases.filter((_, i) => i !== index));
    } else {
      setUseCases([{ description: "" }]);
    }
  };

  // Limitation management
  const addLimitation = () => {
    setLimitations([...limitations, ""]);
  };

  const updateLimitation = (index: number, value: string) => {
    const updated = [...limitations];
    updated[index] = value;
    setLimitations(updated);
  };

  const removeLimitation = (index: number) => {
    if (limitations.length > 1) {
      setLimitations(limitations.filter((_, i) => i !== index));
    } else {
      setLimitations([""]);
    }
  };

  // Resource management
  const addResource = () => {
    setResources([...resources, { 
      resource_type: 0, 
      title: "", 
      url: "", 
      description: "", 
      authors: "", 
      publication_date: "", 
      source_type: "" 
    }]);
  };

  const updateResource = (index: number, field: keyof Resource, value: string | number) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    if (resources.length > 1) {
      setResources(resources.filter((_, i) => i !== index));
    } else {
      setResources([{ resource_type: 0, title: "", url: "", description: "", authors: "", publication_date: "", source_type: "" }]);
    }
  };

  return {
    // State
    useCases,
    limitations,
    resources,
    
    // State setters for initialization
    setUseCases,
    setLimitations,
    setResources,
    
    // Use case functions
    addUseCase,
    updateUseCase,
    removeUseCase,
    
    // Limitation functions
    addLimitation,
    updateLimitation,
    removeLimitation,
    
    // Resource functions
    addResource,
    updateResource,
    removeResource,
  };
}