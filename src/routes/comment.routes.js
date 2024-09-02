import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const commentRouter = Router()

commentRouter.use(verifyJWT)

commentRouter.route("/:videoID").get(getVideoComments).post(addComment)

commentRouter.route("/c/:commentID").patch(updateComment).delete(deleteComment)

export default commentRouter