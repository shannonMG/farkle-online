import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

export const authenticateToken = ({ req }: any) => {
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req;
  }

  try {
    const { data }: any = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '2hr' });
    req.user = data;
  
    // Log the decoded payload for debugging
    console.log('Decoded token payload:', req.user);
  } catch (err) {
    console.log('Invalid token');
  }

  return req;
};

export const signToken = (username: string, _id: string, role: string) => {
  const payload = { username, _id, role };
  
  // Ensure that the secret key is properly loaded
  const secretKey = process.env.JWT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("JWT_SECRET_KEY is missing in environment variables.");
  }

  // Sign the token
  return jwt.sign({ data: payload }, secretKey, { expiresIn: '2h' });
}


export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
};




export const verifyToken = (token: string) => {
  if (!SECRET_KEY) throw new Error("Missing JWT_SECRET_KEY");
  console.log("🔑 Decoded Token:", jwt.decode(token));

  return jwt.verify(token, SECRET_KEY);
  
};
