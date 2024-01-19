import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "All fields are required!!");
  }
  const userId = await User.findById(req.user._id).select("_id");
  if (!userId) {
    throw new ApiError(400, "Login First");
  }
  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // const { userId } = await User.findById(req.user._id).select("_id");
  const userPlaylist = await Playlist.find({ owner: userId });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylist,
        "Current user playlist fetched successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Playlist by Id fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video id from params
  const { playlistId, videoId } = req.params;
  //check for playlist and video id
  if (!playlistId) {
    throw new ApiError(400, "playlistId not found!!");
  }
  if (!videoId) {
    throw new ApiError(400, "videoId not found!!");
  }
  //get current playlist from playlist id
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist not exist!!");
  }
  //push and video id to current playlist id
  playlist.videos.addToSet(videoId); // Use addToSet to add videoId to the videos array, preventing duplicates
  // playlist.videos.push(videoId);  // push is also used to add videoId to the videos array, not preventing duplicates
  //save playlist
  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
  if (!updatedPlaylist) {
    throw new ApiError(500, "Somethig went wrong while updating playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "VideoId successsfully pushed to playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlistId not found!!");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId not found!!");
  }

  // Get current playlist
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "playlist not exist!!");
  }

  // Remove videoId from the videos array
  playlist.videos.pull(videoId);

  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });

  if (!updatedPlaylist) {
    throw new ApiError(500, "Something went wrong while updating playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "VideoId successfully removed from the playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) {
    throw new ApiError(500, "Can't find playlist to delete");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(400, "Playlist id not found");
  }
  const playlist = await Playlist.findById(playlistId);
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist,
    {
      $set: {
        name,
        description,
      },
    },

    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
};
