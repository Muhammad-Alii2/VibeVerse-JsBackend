import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const subscriptionRouter = Router()

subscriptionRouter.use(verifyJWT)

subscriptionRouter.route("/c/:channelID")
.get(getUserChannelSubscribers)
.post(toggleSubscription)

subscriptionRouter.route("/:subscriberID").get(getSubscribedChannels)

export default subscriptionRouter