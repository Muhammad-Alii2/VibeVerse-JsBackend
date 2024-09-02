import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRouter = Router()

videoRouter.use(verifyJWT)

videoRouter.route("/get-videos").get(getAllVideos)

videoRouter.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
)

videoRouter.route("/:videoID")
.get(getVideoById)
.delete(deleteVideo)
.patch(
    upload.single("thumbnail"),
    updateVideo
)

videoRouter.route("/publish/:videoID").patch(togglePublishStatus)

export default videoRouter