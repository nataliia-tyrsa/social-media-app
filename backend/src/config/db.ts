import mongoose from "mongoose";
import "dotenv/config";

const connectionString: string = process.env.MONGO_URI || 
  "mongodb+srv://tyrsanatalie047:1234@cluster0.isouahg.mongodb.net/data";


  const connectDB = async (): Promise<void> => {
    try {
      await mongoose.connect(connectionString);
      console.log("Connected successfully to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      process.exit(1);
    }
  };
  
  export default connectDB;