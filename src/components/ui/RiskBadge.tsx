import React from 'react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

const riskColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

interface RiskBadgeProps {
  risk: keyof typeof riskColors;
  className?: string;
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  return (
    <Badge
      className={cn(
        'font-semibold',
        riskColors[risk],
        className
      )}
    >
      {risk}
    </Badge>
  );
}