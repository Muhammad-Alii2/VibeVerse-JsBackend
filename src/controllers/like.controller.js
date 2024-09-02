import mongoose from "mongoose"
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoID} = req.params
    //TODO: toggle like on video
    if (!videoID) {
        throw new ApiError(400, "Video ID missing")
    }

    const existingVideoLike = await Like.findOne({
        video: videoID,
        owner: req.user._id
    })
    
    if (existingVideoLike) {
        await Like.deleteOne({
            _id: existingVideoLike._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Like removed")
        );
    }

    const newLike = await Like.create({
        video: videoID,
        owner: req.user._id
    })

    const videoLike = await Like.findById(newLike._id)
    .select("-comment -tweet")

    if (!videoLike) {
        throw new ApiError(500, "Error liking the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoLike, "Video liked")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentID} = req.params
    //TODO: toggle like on comment
    if (!commentID) {
        throw new ApiError(400, "Comment ID missing")
    }

    const existingCommentLike = await Like.findOne({
        comment: commentID,
        owner: req.user._id
    })
    
    if (existingCommentLike) {
        await Like.deleteOne({
            _id: existingCommentLike._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Like removed")
        );
    }

    const newLike = await Like.create({
        comment: commentID,
        owner: req.user._id
    })

    const commentLike = await Like.findById(newLike._id)
    .select("-video -tweet")

    if (!commentLike) {
        throw new ApiError(500, "Error liking the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentLike, "Comment liked")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetID} = req.params
    //TODO: toggle like on tweet
    if (!tweetID) {
        throw new ApiError(400, "Tweet ID missing")
    }

    const existingTweetLike = await Like.findOne({
        tweet: tweetID,
        owner: req.user._id
    })
    
    if (existingTweetLike) {
        await Like.deleteOne({
            _id: existingTweetLike._id
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Like removed")
        );
    }

    const newLike = await Like.create({
        tweet: tweetID,
        owner: req.user._id
    })

    const tweetLike = await Like.findById(newLike._id)
    .select("-video -comment")

    if (!tweetLike) {
        throw new ApiError(500, "Error liking the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweetLike, "Tweet liked")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "likeOwner",
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
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
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
                        $unwind: "$videoOwner"
                    }
                ]
            }
        },
        {
            $unwind: "$likeOwner"
        },
        {
            $unwind: "$likedVideos"
        }
    ])

    if (!likedVideos) {
        throw new ApiError(400, "Error retrieving liked videos");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Liked videos fetched")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}