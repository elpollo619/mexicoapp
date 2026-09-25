import { Component, type ReactNode } from 'react'

/** Si una sección falla (p. ej. un dato raro sincronizado), se muestra un aviso en vez de dejar la app en blanco */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="empty card">
        <span className="e-ic">🌵</span>
        <b>Algo salió mal en esta sección</b>
        <span className="small">Las demás pestañas siguen funcionando.</span>
        <button className="btn small" onClick={() => this.setState({ error: null })}>
          Reintentar
        </button>
        <code className="tiny muted" style={{ wordBreak: 'break-word' }}>
          {this.state.error.message}
        </code>
      </div>
    )
  }
}
