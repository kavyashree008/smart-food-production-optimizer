import { Festival } from "../models/Festival.js";

export async function getFestivals(req, res, next) {
  try {
    const festivals = await Festival.find().sort({ startDate: 1 });
    return res.status(200).json({ success: true, count: festivals.length, festivals });
  } catch (error) {
    return next(error);
  }
}

export async function createFestival(req, res, next) {
  try {
    const festival = await Festival.create(req.body);
    return res.status(201).json({ success: true, message: "Festival created", festival });
  } catch (error) {
    return next(error);
  }
}

export async function updateFestival(req, res, next) {
  try {
    const festival = await Festival.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!festival) {
      return res.status(404).json({ success: false, message: "Festival not found" });
    }
    return res.status(200).json({ success: true, message: "Festival updated", festival });
  } catch (error) {
    return next(error);
  }
}

export async function deleteFestival(req, res, next) {
  try {
    const festival = await Festival.findByIdAndDelete(req.params.id);
    if (!festival) {
      return res.status(404).json({ success: false, message: "Festival not found" });
    }
    return res.status(200).json({ success: true, message: "Festival deleted" });
  } catch (error) {
    return next(error);
  }
}