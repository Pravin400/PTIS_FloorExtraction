"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class RentCalculationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RentCalculationErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 flex items-start gap-3 my-2 animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <h4 className="font-bold text-xs uppercase tracking-wider">Rent Calculation Error</h4>
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <p className="text-[11px] leading-relaxed">
              There was an error processing the rent calculation parameters. 
              Please verify that all date ranges, base rent values, and increment rates are correctly entered.
            </p>
            {this.state.errorMessage && (
              <span className="text-[9px] font-mono bg-red-100 px-1 py-0.5 rounded self-start mt-1" translate="no">
                {this.state.errorMessage}
              </span>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
