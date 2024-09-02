import {Schema, model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: [true, "Video file is required"],
    },
    videoFilePublicID: {
        type: String,
        required: [true, "Video file public id is required"]
    },
    thumbnail: {
        type: String,
        required: [true, "Thumbnail is required"]
    },
    thumbnailPublicID: {
        type: String,
        required: [true, "Thumbnail public id is required"]
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Ownership is required"],
        index: true
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        index: true
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        index: true
    },
    duration: {
        type: Number,
        required: [true, "Duration is required"],
        index: true
    },
    views: {
        type: Number,
        default: 0,
        index: true
    },
    isPublished: {
        type: Boolean,
        default: true,
        index: true
    }
},
{
    timestamps: true
})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = model("Video", videoSchema)