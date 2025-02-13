import express from 'express';
import path from 'node:path';
import type { Request } from 'express';
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './utils/auth.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { verifyToken } from './utils/auth.js';


const server = new ApolloServer({
  typeDefs,
  resolvers,
  
});

const startApolloServer = async () => {
  try {
    await server.start();
    await db();

    const PORT = process.env.PORT || 3001;
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // GraphQL endpoint with authentication middleware
    app.use('/graphql', expressMiddleware(server as any,
      {
        context: authenticateToken as any
      }
    ));

    // Serve production client
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../client/dist')));

      app.get('*', (_req: Request) => {
        context: async ({ req }: { req: Request }) => {
          const token = req.headers.authorization || "";
          try {
            const user = verifyToken(token.replace("Bearer ", ""));
            return { user };
          } catch (error) {
            return {};
          }
        }
      });
    }

    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startApolloServer();
