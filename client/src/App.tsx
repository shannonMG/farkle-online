import './App.css';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

const httpLink = createHttpLink({
    uri: '/graphql',
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('id_token');
    console.log("📡 Apollo Client - Token from localStorage:", token); // Debugging log

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

  return (
    <ApolloProvider client={client}>
      <div>
        <Header />
        <main>
          {/* Show only the link that the user is NOT on */}
          {location.pathname !== "/login" && (
            <Link to="/login">
              <p>Login</p>
            </Link>
          )}
          {location.pathname !== "/signup" && (
            <Link to="/signup">
              <p>Signup</p>
            </Link>
          )}

          <Outlet />
        </main>
        <Footer />
      </div>
    </ApolloProvider>
  );
}

export default App;
