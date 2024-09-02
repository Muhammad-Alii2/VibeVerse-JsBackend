import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelID} = req.params
    // TODO: toggle subscription
    if (!channelID) {
        throw new ApiError(400, "Channel ID missing")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelID
    })

    if (isSubscribed) {
        await Subscription.deleteOne({
            _id: isSubscribed._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Unsubscribed")
        );
    }

    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelID
    })

    if (!newSubscription) {
        throw new ApiError(500, "Error Subscribing the channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newSubscription, "Subscribed")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelID} = req.params
    
    if (!channelID) {
        throw new ApiError(400, "Channel ID missing")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelID)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriberDetails"
        }
    ])

    if (subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribers fetched")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberID } = req.params

    if (!subscriberID) {
        throw new ApiError(400, "Subscriber ID missing")
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberID)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscriptions",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriptions"
        }
    ])

    if (subscriptions.length === 0) {
        throw new ApiError(404, "No subscriptions found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriptions, "Subscriptions fetched")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}