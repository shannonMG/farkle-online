import './App.css';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'


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
  return (
    <ApolloProvider client={client}>
      <div>
        <Header />
          
          <main>
            <Link to='/login'>
              <p>Login</p>
            </Link>
            <Link to='/signup'>
              <p>Signup</p>
            </Link>
        
            <Outlet />
           </main>

        <Footer/>
      </div>
    </ApolloProvider>
  );
}

export default App;
