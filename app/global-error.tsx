'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Something went wrong!
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            An error occurred while rendering this page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
