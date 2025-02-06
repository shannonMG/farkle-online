import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import App from './App.jsx';
import Signup from './pages/Signup.js';
import Login from './pages/Login.js';
// import Dashboard from './pages/Dashboard.js';
// import ErrorPage from './pages/Error.js';
// import StatButton from './components/StatButton.js';
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        // errorElement: <ErrorPage />,
        children: [
            {
                path: '/login',
                element: <Login />
            }, {
                path: '/signup',
                element: <Signup />
            },
        ]
    },
]);

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
}