import { Component } from 'react';

export default class LimiteDeError extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Error no controlado:', error, info); }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-papel px-6">
          <div className="max-w-sm text-center">
            <h1 className="font-display text-2xl font-semibold text-marino-700 mb-2">Algo no salió bien</h1>
            <p className="text-marino-500 text-sm mb-6">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-marino-700 hover:bg-marino-600 text-white font-medium px-5 py-2.5 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
