import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = '', size }: DynamicIconProps) {
  // Map our special names just in case they don't match standard casing
  const IconComponent = (Icons as Record<string, React.ComponentType<any>>)[name];

  if (!IconComponent) {
    // Return a default document icon if not found
    const Fallback = Icons.File;
    return <Fallback className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}
