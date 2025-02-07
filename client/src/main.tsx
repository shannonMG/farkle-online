import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import App from './App.jsx'; // Layout Wrapper
import Signup from './pages/Signup.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />, // Layout wrapper (Header, Footer, etc.)
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            {
                path: '/login',
                element: <Login />
            },
            {
                path: '/signup',
                element: <Signup />
            },
            {
                path: '/me',
                element: <Dashboard />
            }
        ]
    }
]);

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
}
