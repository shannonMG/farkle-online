import './App.css';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";
import Header from './components/Header';
import Footer from './components/Footer';

const httpLink = createHttpLink({
    uri: '/graphql',
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('id_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

function App() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on page load
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("id_token"));
  }, []);

  return (
    <ApolloProvider client={client}>
      <div>
        <Header />
        <main>
        <Outlet />
          {/* Hide Login/Signup links if user is logged in OR on the Dashboard */}
          {!isLoggedIn && location.pathname !== "/me" && location.pathname !== "/dashboard" && (
            <>
              {location.pathname !== "/login" && (
                <Link to="/login"><p>Login</p></Link>
              )}
              {location.pathname !== "/signup" && (
                <Link to="/signup"><p>Signup</p></Link>
              )}
            </>
          )}

          
        </main>
        <Footer />
      </div>
    </ApolloProvider>
  );
}

export default App;
