import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto my-16 px-4 text-center">
          <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {this.props.fallbackTitle || 'প্যানেল লোড করতে সমস্যা হয়েছে'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              সিস্টেম লোড হওয়ার সময় একটি কারিগরি ত্রুটি ঘটেছে। নিচের বাটনে ক্লিক করে পেজটি রিফ্রেশ বা পুনরায় লোড করুন।
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 rounded-lg text-left text-xs font-mono text-red-700 break-words overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>প্যানেল পুনরায় লোড করুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
