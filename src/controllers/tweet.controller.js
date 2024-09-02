import { Tweet } from "../models/tweet.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const newTweet = await Tweet.create({
        owner: req.user._id,
        content
    })

    if (!newTweet) {
        throw new ApiError(500, "Error while creating the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newTweet, "Tweet created")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userID} = req.params

    if (!userID) {
        throw new ApiError(400, "User ID missing")
    }

    const userTweets = await Tweet.find({
        owner: userID
    })

    if (userTweets.length === 0) {
        throw new ApiError(404, "No tweets found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "Tweets fetched")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetID} = req.params
    const {content} = req.body

    if (!tweetID) {
        throw new ApiError(400, "Tweet ID missing")
    }
    if (!content) {
        throw new ApiError(400, "No data to update")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetID, {
        $set: {
            content
        }
    }, {
        new: true
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetID} = req.params

    if (!tweetID) {
        throw new ApiError(400, "Tweet ID missing")
    }

    const isDeleted = await Tweet.deleteOne({
        _id: tweetID
    })

    if (isDeleted.deletedCount === 0) {
        throw new ApiError(400, "Tweet not found or already deleted");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet deleted")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}