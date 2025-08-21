import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import SportPage from './pages/SportPage'
import NotFound from './pages/NotFound'
import Nav from './sports/wnba/components/Nav'

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
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:sport" element={<SportPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)