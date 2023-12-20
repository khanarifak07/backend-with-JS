import { app } from "./app.js";
import connectDB from "./db/db_connection.js";

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error while connecting to server", err);
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log("server is running at port 3000");
    });
  })
  .catch((err) => {
    console.log("Error connecting to database", err);
  });

//First approach to connect to database via IIFE (Imidiately Invoked Function Expression)
/* (async () => {
  try {
  await  mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
    console.log("Connected to MongoDB!");

    app.on("error", (error) => {
      console.log("erroe while connecting to mongo db", error);
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log("server is running at port 3000");
    });
  } catch (error) {
    console.log("Error while connecting to database", error);
    
  }
})(); */
