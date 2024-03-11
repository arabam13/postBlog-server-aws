import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// userSchema.plugin(uniqueValidator);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
