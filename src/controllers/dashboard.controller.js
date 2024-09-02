import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalLikes: { $sum: { $size: "$likes" } },
                totalComments: { $sum: { $size: "$comments" } },
                totalViews: { $sum: "$views" }
            }
        },
        {
            $project: {
                totalVideos: 1,
                totalLikes: 1,
                totalComments: 1,
                totalViews: 1
            }
        },
    ])

    if (!videoStats || videoStats.length === 0) {
        throw new ApiError(500, "Could not fetch video statistics")
    }

    const profileStats = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriptions"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscriptionsCount: {
                    $size: "$subscriptions"
                },
            }
        },
        {
            $project: {
                subscribersCount: 1,
                subscriptionsCount: 1
            }
        }
    ])

    if (!profileStats || profileStats.length === 0) {
        throw new ApiError(500, "Could not fetch profile statistics")
    }

    const overallStats = {
        ...videoStats[0],
        ...profileStats[0]
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, overallStats, "Statistics fetched")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const allVideos = await Video.find({
        owner: req.user._id
    })

    if (allVideos.length === 0) {
        throw new ApiError(500, "No videos found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, allVideos, "Videos fetched")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }