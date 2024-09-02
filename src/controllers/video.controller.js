import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 'asc', userID } = req.query

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new ApiError(400, "Invalid page number")
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new ApiError(400, "Invalid limit number")
    }

    // Validate `userID` if provided
    if (userID && !mongoose.Types.ObjectId.isValid(userID)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const allowedSortFields = ['createdAt', 'duration', 'views']
    const sortByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const sortOrder = sortType === 'asc' ? 1 : -1

    try {
        const videos = await Video.aggregate([
            {
                $match: {
                    ...(userID ? { owner: new mongoose.Types.ObjectId(userID) } : {}),
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
                    ]
                }
            },
            {
                $sort: {
                    [sortByField]: sortOrder
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
                $skip: (pageNumber - 1) * limitNumber
            },
            {
                $limit: limitNumber
            }
        ])

        return res.status(200).json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )
    } catch (error) {
        // Handle potential errors
        return res.status(500).json(
            new ApiResponse(500, null, `An error occurred while fetching videos: ${error}`)
        )
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new ApiError(400, "Required fields are missing")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Required files are missing")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        videoFile: videoFile.url,
        videoFilePublicID: videoFile.public_id,
        thumbnail: thumbnail.url,
        thumbnailPublicID: thumbnail.public_id,
        owner: req.user._id,
        title,
        description,
        duration: videoFile.duration
    })

    if (!video) {
        throw new ApiError(500, "Error while publishing the video")
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video published")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoID } = req.params
    //TODO: get video by id
    if (!videoID) {
        throw new ApiError(400, "Video ID required")
    }

    const video = await Video.findById(videoID)

    if (!video) {
        throw new ApiError(500, "No video found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoID } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title, description} = req.body

    if (!videoID) {
        throw new ApiError(400, "Video ID required")
    }

    let thumbnailLocalPath
    if (req.file && Array.isArray(req.file.thumbnail) && req.file.thumbnail.length > 0) {
        thumbnailLocalPath = req.file.thumbnail[0].path
    }

    if(!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "No data to update")
    }

    const dataToUpdate = {}
    let thumbnailToDelete
    if (title) dataToUpdate.title = title
    if (description) dataToUpdate.description = description
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        dataToUpdate.thumbnail = thumbnail.url
        dataToUpdate.thumbnailPublicID = thumbnail.public_id
        const video = await Video.findById(videoID).select("thumbnailPublicID")
        thumbnailToDelete = video.thumbnailPublicID
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoID, {
        $set: dataToUpdate
    }, {
        new: true
    })

    await deleteFromCloudinary(thumbnailToDelete)

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video updated")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoID } = req.params
    //TODO: delete video
    if (!videoID) {
        throw new ApiError(400, "Video ID required")
    }

    const video = await Video.findById(videoID).select("thumbnailPublicID")

    const videoToDelete = video.videoFilePublicID

    const isDeleted = await Video.deleteOne({
        _id: videoID
    })

    if (isDeleted.deletedCount === 0) {
        throw new ApiError(500, "Video not found or already deleted");
    }

    await deleteFromCloudinary(videoToDelete)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoID } = req.params

    if (!videoID) {
        throw new ApiError(400, "Video ID required")
    }

    const video = await Video.findOne({
        _id: videoID
    }).select("isPublished");

    if (!video) {
        throw new ApiError(500, "No video found");
    }

    video.isPublished = !video.isPublished;
    await video.save({
        validateBeforeSave: false
    });

    const message = video.isPublished ? "Video published" : "Video unpublished";

    return res.status(200).json(
        new ApiResponse(200, {}, message)
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}