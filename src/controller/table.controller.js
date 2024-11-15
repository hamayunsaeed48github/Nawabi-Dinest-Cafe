import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Table } from "../model/table.model.js";

const tableBooked = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, incomingDate, incomingTime, guestCount } =
    req.body;

  if (
    !fullName ||
    !phoneNumber ||
    !incomingDate ||
    !incomingTime ||
    !guestCount
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const userId = req.user._id;
  const newBooking = new Table({
    fullName,
    phoneNumber,
    incomingDate,
    incomingTime,
    guestCount,
    userId,
    status: "confirmed",
  });

  const savedBooking = await newBooking.save();

  return res
    .status(201)
    .json(new ApiResponse(200, savedBooking, "Table Successfull booked"));
});

const completeTable = asyncHandler(async (req, res) => {
  const { tableId } = req.params;

  const table = await Table.findById(tableId);

  if (!table) {
    return new ApiError(400, "Table cannot exist");
  }

  table.status = "completed";

  const updateStatus = await table.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updateStatus, "Status updated successfully"));
});

export { tableBooked, completeTable };
