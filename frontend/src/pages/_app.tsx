// src/pages/_app.tsx
import '@/app/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'

// Crear instancia del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

// Extender AppProps para incluir la sesión
interface MyAppProps extends AppProps {
  pageProps: {
    session?: Session & {
      user: {
        userId: string;
        name?: string;
        email?: string;
        profilePicture?: string;
        image?: string;
      }
    }
  } & any
}

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: MyAppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  )
}