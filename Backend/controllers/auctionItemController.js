import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Auction item Image Required.", 400));
  }

  const { image } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(image.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const {
    title,
    description,
    category,
    condition,
    startingBid,
    startTime,
    endTime,
  } = req.body;
  if (
    !title ||
    !description ||
    !category ||
    !condition ||
    !startingBid ||
    !startTime ||
    !endTime
  ) {
    return next(new ErrorHandler("Please provide all details.", 400));
  }
  if (new Date(startTime) <= Date.now()) {
    return next(
      new ErrorHandler(
        "Auction starting time must be greater than present time.",
        400
      )
    );
  }
  if (new Date(startTime) >= new Date(endTime)) {
    return next(
      new ErrorHandler(
        "Auction starting time must be less than ending time.",
        400
      )
    );
  }
  const alreadyOneAuctionActive = await Auction.find({
    createdBy: req.user._id,
    endTime: { $gt: Date.now() },
  });
  if (alreadyOneAuctionActive.length > 0) {
    return next(new ErrorHandler("you already have one  active auction.", 400));
  }
  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(
      image.tempFilePath,
      {
        folder: "DIGITAL_AUCTION_STORE_AUCTIONS",
      }
    );
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloduinary error:",
        cloudinaryResponse.error || "Unknown cloudinary error."
      );
      return next(
        new ErrorHandler("Failed to upload Auction image to cloudinary.", 500)
      );
    }
    const AuctionItem = await Auction.create({
      title,
      description,
      category,
      condition,
      startingBid,
      startTime,
      endTime,
      image: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: `Auction item created and will be listed on the auction page at ${startTime}.`,
      auctionItem: AuctionItem,
    });
  } catch (error) {
    return next(
      new ErrorHandler(error.message || "Failed to create auction.", 500)
    );
  }
});
export const getAllItems = catchAsyncErrors(async (req, res, next) => {
  let items = await Auction.find();
  res.status(200).json({ success: true, items });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
  const {} = req.user._id;
  const items = await Auction.find({ createdBy: req.user._id });
  res.status(200).json({
    sucess: true,
    items,
  });
});

export const getAuctionDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionitem = await Auction.findById(id);
  if (!auctionitem) {
    return next(new ErrorHandler("Auction not foumd.", 404));
  }
  const bidders = auctionitem.bids.sort((a, b) => b.bid - a.bid);
  res.status(200).json({
    success: true,
    auctionitem,
    bidders,
  });
});
export const removeFromAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionitem = await Auction.findById(id);
  if (!auctionitem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  await auctionitem.deleteOne();
  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});
export const republishItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  let auctionitem = await Auction.findById(id);
  if (!auctionitem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  if(!req.body.startTime || !req.body.endTime){
    return next(new ErrorHandler("Start time and end time for republish is mandatory."))
  }
  if (new Date(auctionitem.endTime) > Date.now()) {
    return next(
      new ErrorHandler("Auction is already active,cannot republish", 400)
    );
  }
  let data = {
    startTime: new Date(req.body.startTime),
    endTime: new Date(req.body.endTime),
  };
  if (data.startTime < Date.now()) {
    return next(
      new ErrorHandler(
        "Auction starting time must be greater than present time",
        400
      )
    );
  }
  if (data.startTime >= data.endTime) {
    return next(
      new ErrorHandler(
        "Auction starting time must be less thean ending time",
        400
      )
    );
  }
  data.bids = [];
  data.commissionCalculated = false;
  auctionitem = await Auction.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });
  const createdBy = await User.findByIdAndUpdate(req.user._id,{unpaidCommission: 0},
    {
      new : true,
      runValidators: false,
      userFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    auctionitem,
    message: `Auction republished and will be active on ${req.body.startTime}`,
  });
});
