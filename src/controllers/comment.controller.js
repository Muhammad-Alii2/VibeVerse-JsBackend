import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoID} = req.params
    let {page = 1, limit = 10} = req.query

    if (!videoID) {
        throw new ApiError(400, "Video ID missing")
    }

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoID)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
            $unwind: "$owner"
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    if (!videoComments?.length) {
        throw new ApiError(404, "No comment found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoComments, "Comments fetched")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoID} = req.params
    const {content} = req.body

    if (!videoID) {
        throw new ApiError(400, "Video ID missing")
    }
    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoID,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Error while saving the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentID} = req.params
    const {updatedContent} = req.body

    if (!commentID) {
        throw new ApiError(400, "Comment ID missing")
    }
    if (!updatedContent) {
        throw new ApiError(400, "Content is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentID, {
        $set: {
            content: updatedContent
        }
    }, {
        new: true
    })

    if (!updatedComment) {
        throw new ApiError(400, "Error updating the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentID} = req.params

    if (!commentID) {
        throw new ApiError(400, "Comment ID missing")
    }

    const isDeleted = await Comment.deleteOne({
        _id: commentID
    })

    if (isDeleted.deletedCount === 0) {
        throw new ApiError(400, "Comment not found or already deleted");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }