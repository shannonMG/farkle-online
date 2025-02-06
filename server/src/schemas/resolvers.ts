import bcrypt from 'bcrypt';
import User from './../models/User.js';

const resolvers = {
    Query: {
        users: async () => await User.find(),
    },
    Mutation: {
        register: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, email, password: hashedPassword });
            return await newUser.save();
        }
    }
};

export default resolvers;
