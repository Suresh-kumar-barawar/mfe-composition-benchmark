'use client';
import { Component } from 'react';

/** Isolates a failing micro frontend so the rest of the page keeps working. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error(`[${this.props.name || 'mfe'}] failed:`, error);
  }
  render() {
    if (this.state.error)
      return (
        <div className="container page mfe-error" role="alert">
          <h2>This section is temporarily unavailable.</h2>
          <p className="muted">The “{this.props.name}” micro frontend failed to load. The rest of the site still works.</p>
        </div>
      );
    return this.props.children;
  }
}
