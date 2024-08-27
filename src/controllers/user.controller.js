import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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
        coverImage: coverImage?.url || ""
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
            $set: {
                refreshToken: undefined
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}