import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const existingUser = await User.findById(userId)
        const accessToken = existingUser.generateAccessToken()
        const refreshToken = existingUser.generateRefreshToken()

        existingUser.refreshToken = refreshToken
        await existingUser.save({
            validateBeforeSave: false
        })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Error generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {
        userName,
        email,
        fullName,
        password
    } = req.body

    if (
        [
            userName,
            email,
            fullName,
            password
        ].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "Some of the fields are missing");
    }

    const existingUser = await User.findOne({
        $or: [
            {
                userName
            },
            {
                email
            }
        ]
    })
    if (existingUser) {
        throw new ApiError(400, "User with the same username or email already exists");
    }

    // const avatarLocalPath = req.files?.avatar[0]?.path || ""
    // const coverImageLocalPath = req.files?.coverImage[0]?.path || ""

    let avatarLocalPath
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.create({
        userName,
        email,
        fullName,
        password,
        avatar: avatar?.url || "",
        avatarPublicID: avatar?.public_id || "",
        coverImage: coverImage?.url || "",
        coverPublicID: coverImage?.public_id || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error while registering the user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser)
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const {userName, email, password} = req.body

    if (!userName && !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    const existingUser = await User.findOne({
        $or: [{
            userName
        },{
            email
        }]
    })

    if (!existingUser) {
        throw new ApiError(404, "No existing user")
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "Password not valid")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existingUser._id)

    const loggedInUser = await User.findById(existingUser._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },"User successfully logged in")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        }, {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "Uer logged out")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const existingUser = await User.findById(decodedToken?._id)
    
        if (!existingUser) {
            throw new ApiError(401, "No such user found")
        }
    
        if (incomingRefreshToken !== existingUser?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existingUser._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken, refreshToken
            },"Access token refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeUserPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const existingUser = await User.findById(req.user?._id)

    const isPasswordValid = await existingUser.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, "invalid old password");
    }

    existingUser.password = newPassword
    await existingUser.save({
        validateBeforeSave: false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password updated")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {userName, email, fullName} = req.body

    const dataToUpdate = {}
    if (userName) dataToUpdate.userName = userName
    if (email) dataToUpdate.email = email
    if (fullName) dataToUpdate.fullName = fullName

    if (Object.keys(dataToUpdate).length === 0) {
        throw new ApiError(400, "No data to update")
    }

    const updateUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: dataToUpdate
    },{
        new: true
    }).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateUser, "Details updated")
    )
})

const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarImageLocalPath = req.file?.path

    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar image missing");
    }

    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath)

    if (!avatarImage.url) {
        throw new ApiError(400, "Avatar image upload error");
    }

    const avatarToBeDeleted = req.user?.avatarPublicID

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
            avatar: avatarImage.url,
            avatarPublicID: avatarImage.public_id
        }
    },{
        new: true
    })
    .select("-password -refreshToken")

    await deleteFromCloudinary(avatarToBeDeleted)

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Avatar updated")
    )
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Cover image upload error");
    }

    const coverToBeDeleted = req.user?.coverPublicID

    const updatedUser = await User.findByIdAndUpdate(req.user?._id,{
        $set: {
            coverImage: coverImage.url,
            coverPublicID: coverImage.public_id
        }
    },{
        new: true
    })
    .select("-password -refreshToken")

    await deleteFromCloudinary(coverToBeDeleted)

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Cover updated")
    )
})

const getChannelProfile = asyncHandler(async (req, res) => {
    const {userName} = req.params

    if (!userName?.trim()) {
        throw new ApiError(400, "Username missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
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
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id, "$subscribers.subscriber"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscriptionsCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new  ApiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel details fetched")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
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
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory
}