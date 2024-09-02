import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const tweetRouter = Router()

tweetRouter.use(verifyJWT)

tweetRouter.route("/create-tweet").post(createTweet)

tweetRouter.route("/:userID").get(getUserTweets)

tweetRouter.route("/:tweetID")
.patch(updateTweet)
.delete(deleteTweet)

export default tweetRouter