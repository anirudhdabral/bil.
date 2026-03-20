import { Schema, Types, model, models, type InferSchemaType } from "mongoose";

const billCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
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

export type BillCategoryDocument = InferSchemaType<typeof billCategorySchema>;

const BillCategory = models.BillCategory || model("BillCategory", billCategorySchema);

export default BillCategory;
