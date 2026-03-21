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

// Index for getCategoriesByHome query (find by home, sort by createdAt)
billCategorySchema.index({ home: 1, createdAt: -1 });


export type BillCategoryDocument = InferSchemaType<typeof billCategorySchema>;

const BillCategory = models.BillCategory || model("BillCategory", billCategorySchema);

export default BillCategory;
