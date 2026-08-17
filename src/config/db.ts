import mongoose from "mongoose";
import { env } from "./env.js";



const connectDB = async () => {
  try {
    const connect = await mongoose.connect(env.MONGODB_URI);

    console.log(`MongoDB Connected : ${connect.connection.host}`);
  } catch (error: any) {
    console.error(`Error in MongoDB : ${error.message}`);
    process.exit(1); // Exit the process with a non-zero exit code
  }
};

export default connectDB;