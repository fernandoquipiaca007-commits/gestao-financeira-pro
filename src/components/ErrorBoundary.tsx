import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0f172a',
            color: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '1rem',
              padding: '2rem',
            }}
          >
            <h1 style={{ color: '#f87171', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⚠️ Erro ao Carregar o Sistema
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ocorreu um erro inesperado. Por favor, recarregue a página ou limpe o cache do browser.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: '#0f172a',
                  border: '1px solid #ef4444',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: '#fca5a5',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#10b981',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                🔄 Recarregar Página
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  background: '#334155',
                  color: '#f1f5f9',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                🗑️ Limpar Cache e Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
