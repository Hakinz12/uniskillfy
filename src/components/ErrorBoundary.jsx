import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reload = () => window.location.reload();

  clearAndReload = () => {
    try {
      localStorage.clear();
    } catch { /* reload still gives the application another chance to recover */ }
    this.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-screen" role="alert">
        <div className="empty">
          <h1>Something went wrong</h1>
          <p>Sorry, Campus Skill Swap hit an unexpected error. Try reloading the page.</p>
          <div className="form-actions">
            <button className="btn primary" type="button" onClick={this.reload}>Reload</button>
            <button className="btn ghost" type="button" onClick={this.clearAndReload}>Clear my saved data and reload</button>
          </div>
        </div>
      </main>
    );
  }
}
