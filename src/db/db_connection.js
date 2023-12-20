import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//second appraoch to connect to database
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `Connected to MONGO DB !! :${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Error while connnecting to MONGODB", error);
    process.exit(1); // 1 is use for failure
  }
};

export default connectDB;
