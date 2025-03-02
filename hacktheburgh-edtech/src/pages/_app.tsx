import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Navbar from '@/components/Navbar';
import { CompareProvider } from '@/components/CompareContext';
import CompareOverlay from '@/components/CompareOverlay';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Wrapping the entire application with CompareProvider
    // This makes the compare context available to all components
    <CompareProvider>
      <>
        {/* The CompareOverlay component will render conditionally when needed */}
        <CompareOverlay />
        <Navbar />
        <Component {...pageProps} />
      </>
    </CompareProvider>
  );
}

export default MyApp; 