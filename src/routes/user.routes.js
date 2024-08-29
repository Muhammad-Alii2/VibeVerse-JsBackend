import { Router } from "express";
import { changeUserPassword, getCurrentUser, getChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatarImage, updateCoverImage, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT, logoutUser)

userRouter.route("/refresh-token").post(refreshAccessToken)

userRouter.route("/change-password").post(verifyJWT, changeUserPassword)

userRouter.route("/get-current-user").get(verifyJWT, getCurrentUser)

userRouter.route("/update-account-details").patch(verifyJWT, updateAccountDetails)

userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatarImage)

userRouter.route("/update-cover").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

userRouter.route("/channel/:userName").get(verifyJWT, getChannelProfile)

userRouter.route("/watch-history").get(verifyJWT, getWatchHistory)

export default userRouter