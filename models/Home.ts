import { Schema, model, models, type InferSchemaType } from "mongoose";

const homeSchema = new Schema(
  {
    houseNo: {
      type: String,
      required: [true, "houseNo is required"],
      maxlength: [10, "houseNo cannot exceed 10 characters"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "address is required"],
      maxlength: [50, "address cannot exceed 50 characters"],
      trim: true,
    },
    owners: {
      type: [String],
      default: [],
    },
    // Legacy field kept optional for backward compatibility with older records.
    ownerEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null,
    },
    members: {
      type: [String],
      default: [],
    },
    pendingInvites: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export type HomeDocument = InferSchemaType<typeof homeSchema>;

const Home = models.Home || model("Home", homeSchema);

export default Home;
