import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const likeRouter = Router()

likeRouter.use(verifyJWT)

likeRouter.route("/v/:videoID").post(toggleVideoLike)

likeRouter.route("/c/:commentID").post(toggleCommentLike)

likeRouter.route("/t/:tweetID").post(toggleTweetLike)

likeRouter.route("/videos").get(getLikedVideos)

export default likeRouter