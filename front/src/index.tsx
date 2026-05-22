import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ConsoleComponent from './application/component/console/ConsoleComponent';
import './application/fonts/UbuntuMono-Bold.ttf';
import './application/fonts/UbuntuMono-Italic.ttf';
import './application/fonts/UbuntuMono-BoldItalic.ttf';
import './application/fonts/UbuntuMono-Regular.ttf';
import { QueryClient, QueryClientProvider } from 'react-query';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const client = new QueryClient();
root.render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <ConsoleComponent />
    </QueryClientProvider>
  </React.StrictMode>,
);
