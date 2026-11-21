import { Component } from 'react';
import { TOUR_SEEN_KEY } from '../hooks/useAppState.js';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reload = () => window.location.reload();

  clearAndReload = () => {
    try {
      const keys = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key !== TOUR_SEEN_KEY) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
    } catch { /* reload still gives the application another chance to recover */ }
    this.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-screen" role="alert">
        <div className="empty">
          <h1>Something went wrong</h1>
          <p>Sorry, Uniskillfy hit an unexpected error. Try reloading the page.</p>
          <div className="form-actions">
            <button className="btn primary" type="button" onClick={this.reload}>Reload</button>
            <button className="btn ghost" type="button" onClick={this.clearAndReload}>Clear my saved data and reload</button>
          </div>
        </div>
      </main>
    );
  }
}
