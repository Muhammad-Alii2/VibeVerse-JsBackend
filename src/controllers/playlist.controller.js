import { Playlist } from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description=""} = req.body
    //TODO: create playlist
    if (!name) {
        throw new ApiError(400, "Name is missing")
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!newPlaylist) {
        throw new ApiError(500, "Error creating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, newPlaylist, "Playlist created")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userID} = req.params
    //TODO: get user playlists
    if (!userID) {
        throw new ApiError(400, "User ID missing")
    }

    const userPlaylists = await Playlist.find({
        owner: userID
    })

    if (userPlaylists.length === 0) {
        throw new ApiError(404, "No playlist found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists, "Playlists fetched")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistID} = req.params
    //TODO: get playlist by id
    if (!playlistID) {
        throw new ApiError(400, "Playlist ID missing")
    }

    const playlist = await Playlist.findById(playlistID)

    if (!playlist) {
        throw new ApiError(500, "No playlist found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistID, videoID} = req.params

    if (!playlistID || !videoID) {
        throw new ApiError(400, "Required fields are missing")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistID,{
        $push: {
            videos: videoID
        }
    }, {
        new: true
    })

    if (!updatedPlaylist) {
        throw new ApiError(400, "Error updating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistID, videoID} = req.params
    // TODO: remove video from playlist
    if (!playlistID || !videoID) {
        throw new ApiError(400, "Required fields are missing")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistID,{
        $pull: {
            videos: videoID
        }
    }, {
        new: true
    })

    if (!updatedPlaylist) {
        throw new ApiError(400, "Error updating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistID} = req.params
    // TODO: delete playlist
    if (!playlistID) {
        throw new ApiError(400, "Playlist ID missing")
    }

    const isDeleted = await Playlist.deleteOne({
        _id: playlistID
    })

    if (isDeleted.deletedCount === 0) {
        throw new ApiError(400, "Playlist not found or already deleted");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist deleted")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistID} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistID) {
        throw new ApiError(400, "Playlist ID missing")
    }
    if (!name && !description) {
        throw new ApiError(400, "No data to update")
    }

    const dataToUpdate = {}
    if (name) dataToUpdate.name = name
    if (description) dataToUpdate.description = description

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistID, {
        $set: dataToUpdate
    }, {
        new: true
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}