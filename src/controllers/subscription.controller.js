import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  }

  await Subscription.create({
    channel: channelId,
    subscriber: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Subscribed successfully"));
});

//to get the subscribers of a channel
const getUserChannelSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber", // this subscribers contain user document, not the subscription document
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $addFields: {
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscriber._id"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "subscriber._id": 1,
        "subscriber.fullName": 1,
        "subscriber.username": 1,
        "subscriber.avatar.url": 1,
        isSubscribed: 1,
      },
    },
  ]);

  const subscriberCount = subscribers.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribers, subscriberCount },
        "subscribers fetched successfully"
      )
    );
});

//to get the channels that a user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, " invalid subscriber Id")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 0, //exclude the subscription id
                channelDetails: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    const subscriptionCount = channels.length;

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {channels, subscriptionCount},
            "subscribed channels fetched successfully"
        )
    )
});

export { toggleSubscription, getUserChannelSubscriber, getSubscribedChannels };
