import { Router } from "express";
import { verifyJWT } from "../middlewares/authentication.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const playlistRouter = Router()

playlistRouter.use(verifyJWT)

playlistRouter.route("/create-playlist").post(createPlaylist)

playlistRouter.route("/:playlistID")
.get(getPlaylistById)
.patch(updatePlaylist)
.delete(deletePlaylist)

playlistRouter.route("/add/:videoID/:playlistID").patch(addVideoToPlaylist)

playlistRouter.route("/remove/:videoID/:playlistID").patch(removeVideoFromPlaylist)

playlistRouter.route("/p/:userID").get(getUserPlaylists)

export default playlistRouter