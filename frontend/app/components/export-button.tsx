"use client";

import React from "react";

type ExportButtonProps = {
  label: string;
  onClick?: (e?: any) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
};

export default function ExportButton({
  label,
  onClick,
  disabled = false,
  icon,
  className = "",
}: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 px-4 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
