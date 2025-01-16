import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = new Schema({
    subscriber :{
        type : Schema.Types.ObjectId, // one that subscribes
        ref: "User"
    },
    channel : {
        type: Schema.Types.ObjectId, // user to whom the subscriber subscribes to
        ref: "User"
    }

}, {timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
