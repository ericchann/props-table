import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

// Global query error logging via the query cache subscription
qc.getQueryCache().subscribe((event) => {
  const q = (event as any).query
  if (q?.state?.status === 'error') {
    console.error('[Query] error', q.state.error, { queryKey: q.queryKey })
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)