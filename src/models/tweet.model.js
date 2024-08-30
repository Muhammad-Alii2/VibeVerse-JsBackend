import {Schema, model} from "mongoose";

const tweetSchema = Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    }
},{
    timestamps: true
})

export const Tweet = model("Tweet", tweetSchema)