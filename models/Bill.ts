import { Schema, Types, model, models, type InferSchemaType } from "mongoose";

const billSchema = new Schema(
  {
    date: {
      type: Date,
      required: [true, "date is required"],
    },
    remarks: {
      type: String,
      maxlength: [255, "remarks cannot exceed 255 characters"],
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: Types.ObjectId,
      ref: "BillCategory",
      required: [true, "category is required"],
    },
    home: {
      type: Types.ObjectId,
      ref: "Home",
      required: [true, "home is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for the two hot query paths
billSchema.index({ home: 1, date: -1, createdAt: -1 });
billSchema.index({ category: 1, date: -1, createdAt: -1 });


export type BillDocument = InferSchemaType<typeof billSchema>;

const Bill = models.Bill || model("Bill", billSchema);

export default Bill;
