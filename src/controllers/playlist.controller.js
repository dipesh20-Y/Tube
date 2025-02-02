import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  return res
    .status(201) // when something is created, we should return 201 status code
    .json(
      new ApiResponse(
        201,
        newPlaylist,
        "playlist has been created successfully"
      )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: {
          _id: 1,
          title: 1,
          description: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
        },
      },
    },
  ]);

  if (!playlists) {
    throw new ApiError(500, "error occurred while fetching playlists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalvideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalvideos: 1,
        videos: {
          _id: 1,
          title: 1,
          description: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          createdAt: 1,
          updatedAt: 1,
        },
        owner: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  if (!playlistVideos) {
    throw new ApiError(500, "error occurred while fetching playlist videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideos, "playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist id or video id");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "you are not authorized to edit this playlist");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "video already exists in the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "error occurred while adding video to playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "video has been successfully added to the playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist id or video id");
  }
  // we can use Promise.all to run multiple promises concurrently, thus increasing the performance
  const [playlist, video] = await Promise.all([
    Playlist.findById(playlistId),
    Video.findById(videoId),
  ]);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "you are not authorized to delete videos from this playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "error occurred while removing video from playlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "video has been successfully removed from the playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "you are not authorzed to delete this playlist");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(500, "error occurred while deleting the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist
};
