"use client";

import React, { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

export interface TruncatedTextProps {
  text: ReactNode;
  maxLength?: number;
  className?: string;
  placement?: "top" | "bottom" | "left" | "right";
  showTooltip?: boolean;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength = 22,
  className = "",
  placement = "top",
  showTooltip = true,
}) => {
  if (text === null || text === undefined || text === "") {
    return <span className={className}>-</span>;
  }

  if (typeof text !== "string") {
    return <span className={className}>{text}</span>;
  }

  const str = text.trim();
  if (str.length <= maxLength || !showTooltip) {
    return <span className={className}>{str}</span>;
  }

  const truncated = `${str.slice(0, maxLength)}...`;

  return (
    <Tooltip content={str} placement={placement}>
      <span className={`cursor-help ${className}`}>{truncated}</span>
    </Tooltip>
  );
};

TruncatedText.displayName = "TruncatedText";
