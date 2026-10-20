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
      const isEn = typeof window !== 'undefined' && localStorage.getItem('dalas_language') === 'en';
      const isDark = typeof window !== 'undefined' && (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('dalas_theme') === 'dark' ||
        localStorage.getItem('theme') === 'dark'
      );

      return (
        <div
          style={{
            minHeight: '100vh',
            background: isDark ? '#0e1117' : '#fcf8f8',
            color: isDark ? '#ffffff' : '#1c1b1b',
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
              background: isDark ? '#141720' : '#ffffff',
              border: isDark ? '1px solid #2e3346' : '1px solid rgba(196, 199, 199, 0.4)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: isDark ? '0 8px 40px rgba(0, 0, 0, 0.4)' : '0 8px 40px rgba(0, 0, 0, 0.06)',
            }}
          >
            <h1 style={{ color: isDark ? '#f87171' : '#ba1a1a', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {isEn ? 'System Loading Error' : 'Erro ao Carregar o Sistema'}
            </h1>
            <p style={{ color: isDark ? '#a0a5b5' : '#747878', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {isEn
                ? 'An unexpected error occurred. Please reload the page or clear your browser cache.'
                : 'Ocorreu um erro inesperado. Por favor, recarregue a página ou limpe o cache do browser.'}
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: isDark ? '#1c202d' : '#f7f3f2',
                  border: isDark ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid rgba(186, 26, 26, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  color: isDark ? '#fca5a5' : '#93000a',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: isDark ? '#ffffff' : '#000000',
                  color: isDark ? '#141720' : '#ffffff',
                  border: 'none',
                  borderRadius: '1.8125rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {isEn ? 'Reload Page' : 'Recarregar Página'}
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  background: isDark ? '#1c202d' : '#f1edec',
                  color: isDark ? '#ffffff' : '#1c1b1b',
                  border: isDark ? '1px solid #2e3346' : '1px solid rgba(196, 199, 199, 0.45)',
                  borderRadius: '1.8125rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {isEn ? 'Clear Cache & Reload' : 'Limpar Cache e Recarregar'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
