import { Schema, model, models, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
  },
  { _id: false }
);

const chatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true, default: "New Chat" },
    messages: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

export type ChatDoc = InferSchemaType<typeof chatSchema> & { _id: string };

export const ChatModel = models.Chat || model("Chat", chatSchema);
