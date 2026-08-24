import { Component, ReactNode, ErrorInfo } from 'react';

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#fcf8f8',
            color: '#1c1b1b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#ffffff',
              border: '1px solid rgba(196, 199, 199, 0.4)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
            }}
          >
            <h1 style={{ color: '#ba1a1a', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              ⚠️ Erro ao Carregar o Sistema
            </h1>
            <p style={{ color: '#747878', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ocorreu um erro inesperado. Por favor, recarregue a página ou limpe o cache do browser.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: '#f7f3f2',
                  border: '1px solid rgba(186, 26, 26, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: '#93000a',
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
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '1.8125rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 500,
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
                  background: '#f1edec',
                  color: '#1c1b1b',
                  border: '1px solid rgba(196, 199, 199, 0.45)',
                  borderRadius: '1.8125rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 500,
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
