"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A standard React Error Boundary to catch component tree crashes.
 * Useful for wrapping complex children like WebGL/Three.js views to
 * prevent the whole page from white-screening.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: "24px",
          background: "var(--surface-2)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "12px",
          textAlign: "center",
          color: "var(--text-dim)"
        }}>
          <h2 style={{ fontSize: "1.2rem", color: "#f87171", marginBottom: "8px" }}>Something went wrong.</h2>
          <p style={{ fontSize: "0.875rem", marginBottom: "16px" }}>The 3D view or component encountered an error.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-secondary"
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
