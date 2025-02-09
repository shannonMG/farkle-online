import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;
export const authenticateToken = ({ req }) => {
    let token = req.body.token || req.query.token || req.headers.authorization;
    if (req.headers.authorization) {
        token = token.split(' ').pop().trim();
    }
    if (!token) {
        return req;
    }
    try {
        const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '2hr' });
        req.user = data;
        // Log the decoded payload for debugging
        console.log('Decoded token payload:', req.user);
    }
    catch (err) {
        console.log('Invalid token');
    }
    return req;
};
export const signToken = (username, _id, role) => {
    const payload = { username, _id, role };
    // Ensure that the secret key is properly loaded
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
        throw new Error("JWT_SECRET_KEY is missing in environment variables.");
    }
    // Sign the token
    return jwt.sign({ data: payload }, secretKey, { expiresIn: '2h' });
};
export class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
;
export const getUserFromToken = async (token) => {
    try {
        if (!token)
            return null;
        if (!SECRET_KEY) {
            throw new Error("JWT_SECRET_KEY is missing in environment variables.");
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.userId);
        return user;
    }
    catch (err) {
        console.error("❌ Invalid token:", err);
        return null;
    }
};
export const verifyToken = (token) => {
    if (!SECRET_KEY)
        throw new Error("Missing JWT_SECRET_KEY");
    console.log("🔑 Decoded Token:", jwt.decode(token));
    return jwt.verify(token, SECRET_KEY);
};
