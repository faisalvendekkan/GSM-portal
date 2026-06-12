import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-navy-950 px-4 text-white">
          <div className="glass-card max-w-lg">
            <p className="text-sm text-electric-400">Startup error</p>
            <h1 className="mt-2 text-2xl font-bold">The portal could not open</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Refresh the page. If this continues, check the browser console and deployment build.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
