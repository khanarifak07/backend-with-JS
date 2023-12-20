import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

//cross origin resourse sharing(cors) configuration
//use is middleware
app.use(
  cors({
    origin: process.env.CORS,
    credentials: true,
  })
);

//json configuration via express
app.use(
  express.json({
    limit: "16kb",
  })
);

//url configuration via express
app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

//cookie pareser configuration
app.use(cookieParser());

//assets configuration eg. files, pdf, images, etc
app.use(express.static("public"));

//import router
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };
