"use client";
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './Sidebar';
import React, { Component, ReactNode } from 'react';
import DachaIQWidget from '../components/DachaIQWidget';

const inter = Inter({ subsets: ['latin'] })

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log error info here if needed
    // console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red', background: '#fffbe6' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 pl-0 md:pl-56 transition-all duration-300">
              {children}
            </div>
          </div>
        </ErrorBoundary>
        <DachaIQWidget />
      </body>
    </html>
  )
} 