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
// Allow requests from a specific origin
// app.use(cors({ origin: 'http://your-frontend-domain.com' }));

// // Allow multiple origins
// app.use(cors({ origin: ['http://frontend1.com', 'http://frontend2.com'] }));

// Allow all origins, but restrict headers and methods
/* app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization'],
})); */

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
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/videos", videoRouter);

export { app };
