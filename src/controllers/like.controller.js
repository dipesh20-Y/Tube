import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";

//get liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const aggregateQuery = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          _id: 1,
          title: 1,
          description: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          ownerDetails: {
            _id: 1,
            username: 1,
            fullName: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const likedVideos = await Like.aggregatePaginate(aggregateQuery, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    );
});

//toggleVideoLike
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const Liked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (Liked) {
    await Like.findByIdAndDelete(Liked?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "video unliked successfully"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id
  });

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        {},
        "video liked successfully"
    )
  )
});

const toggleCommentLike = asyncHandler( async (req, res) => {
    const {commentId} = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }
    
    const commentLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (commentLiked) {
        await Like.findByIdAndDelete(commentLiked?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "comment unliked successfully"
            )
        )
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "comment liked successfully"
        )
    )
})

export { getLikedVideos, toggleVideoLike, toggleCommentLike };
