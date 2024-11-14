import { Order } from "../model/order.model.js";
import { Item } from "../model/items.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";

const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { items } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "No items provided for the order");
  }

  // Calculate total price
  let totalPrice = 0;
  for (const item of items) {
    const itemData = await Item.findById(item.itemId);
    if (!itemData) {
      throw new ApiError(404, `Item with ID ${item.itemId} not found`);
    }
    totalPrice += itemData.price * item.quantity;
  }

  // Create and save the order
  const order = new Order({
    userId,
    items,
    totalPrice,
  });

  const savedOrder = await order.save();

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $push: { orderHistory: savedOrder._id },
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, savedOrder, "Order placed successfully"));
});

const deliverOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Find the order by ID
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Update the status to Delivered
  order.status = "Delivered";
  const updatedOrder = await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order delivered successfully"));
});

export { placeOrder, deliverOrder };
