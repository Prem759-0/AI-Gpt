import { model, models, Schema, type InferSchemaType } from "mongoose";

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const ChatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    messages: {
      type: [MessageSchema],
      default: []
    }
  },
  { timestamps: true }
);

export type ChatDoc = InferSchemaType<typeof ChatSchema>;

export default models.Chat || model("Chat", ChatSchema);
