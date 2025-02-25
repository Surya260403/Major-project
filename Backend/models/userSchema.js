import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    minLength: [3, "Username must contain at least 3 characters."],
    maxLength: [40, "Username can not exceed 40 characters."],
  },
  password: {
    type: String,
    selected: false,
    minLength: [8, "Password must contain at least 8 characters."],
    maxLength: [32, "Password can not exceed 32 characters."],
  },
  email: String,
  address: String,
  phone: {
    type: String,

    minLength: [10, "Phone number must contain at exact 10 digits."],
    maxLength: [10, "Phone number must contain at exact 10 digits."],
  },
  profileImage: {
    public_id: {
      type: String,
      requied: true,
    },
    url: {
      type: String,
      requied: true,
    },
  },
  paymentMethods: {
    bankTransfer: {
      bankAccountNumber: String,
      bankAccountName: String,
      bankName: String,
    },
    UPI: {
      UPIId: Number,
    },
  },
  role: {
    type: String,
    enum: ["Auctioneer", "Bidder", "Super Admin"],
  },
  unpaidCommission: {
    type: Number,
    default: 0,
  },
  auctionsWon: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function(next){
  if(!this.isModified("password")){
    next()
  }
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async  function (enteredPassword){
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function(){
  return jwt.sign({id : this._id}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRE})
}

const User =mongoose.models.User || mongoose.model("User",userSchema);
export{User};

