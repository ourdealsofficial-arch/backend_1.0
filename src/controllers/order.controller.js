import Food from "../models/Food.js";
import OrderBill from "../models/Order.js";
const createDirectBill = async (req, res) => {
  try {
    const {
      orderType = "DINE_IN",
      paymentMethod,
      discount = 0,
      customerDetails,
      items,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided",
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const food = item.foodId
        ? await Food.findById(item.foodId)
        : await Food.findOne({
            name: { $regex: new RegExp(`^${item.foodName}$`, "i") },
          });

      if (!food) {
        return res.status(404).json({
          success: false,
          message: `Food not found: ${item.foodName || item.foodId}`,
        });
      }
      if (!food.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Food item "${food.name}" is currently unavailable`,
        });
      }

      const quantity = item.quantity || 1;
      const price = food.price;
      const itemSubtotal = quantity * price;
      subtotal += itemSubtotal;

      orderItems.push({
        foodId: food._id,
        foodName: food.name,
        quantity,
        price,
        subtotal: itemSubtotal,
        specialInstructions: item.specialInstructions || null,
      });
    }

    const totalAmount = subtotal - discount;
    const billNumber = `BILL-${Date.now()}`;

    const newBill = new OrderBill({
      billNumber,
      orderType,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      customerDetails,
      generatedBy: req.user._id,
      items: orderItems,
    });

    await newBill.save();

    res.status(201).json({
      success: true,
      message: "Bill created and saved successfully",
      data: newBill,
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateBill = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBill = await OrderBill.findById(id);
    if (!existingBill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    const {
      items,
      discount = existingBill.discount,
      paymentMethod = existingBill.paymentMethod,
      customerDetails = existingBill.customerDetails,
      orderType = existingBill.orderType,
    } = req.body;

    let subtotal = 0;
    let updatedItems = [];

    if (items && items.length > 0) {
      for (const item of items) {
        let food;

        if (item.foodId) {
          food = await Food.findById(item.foodId);
        } else if (item.foodName) {
          food = await Food.findOne({
            name: { $regex: new RegExp(`^${item.foodName}$`, "i") },
          });
        }

        if (!food) {
          return res.status(404).json({
            success: false,
            message: `Food not found: ${item.foodName || item.foodId}`,
          });
        }
        if (!food.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Food item "${food.name}" is currently unavailable`,
          });
        }

        const quantity = item.quantity || 1;
        const price = food.price;
        const itemSubtotal = quantity * price;
        subtotal += itemSubtotal;

        updatedItems.push({
          foodId: food._id,
          foodName: food.name,
          quantity,
          price,
          subtotal: itemSubtotal,
          specialInstructions: item.specialInstructions || null,
        });
      }
    } else {
      updatedItems = existingBill.items;
      subtotal = existingBill.subtotal;
    }

    const totalAmount = subtotal - discount;

    existingBill.items = updatedItems;
    existingBill.subtotal = subtotal;
    existingBill.discount = discount;
    existingBill.totalAmount = totalAmount;
    existingBill.paymentMethod = paymentMethod;
    existingBill.customerDetails = customerDetails;
    existingBill.orderType = orderType;
    existingBill.updatedAt = new Date();

    await existingBill.save();

    res.status(200).json({
      success: true,
      message: "Bill updated successfully",
      data: existingBill,
    });
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await OrderBill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    await bill.deleteOne();

    res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
      data: {
        billNumber: bill.billNumber,
        totalAmount: bill.totalAmount,
        customer: bill.customerDetails.name,
      },
    });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getAllBills = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      paymentMethod,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (req.user.role !== "SUPER_ADMIN") {
      filter.generatedBy = req.user._id;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod.toUpperCase();
    }

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } },
      ];
    }

    const bills = await OrderBill.find(filter)
      .populate("generatedBy", "name email role")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Bills fetched successfully",
      data: bills,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await OrderBill.findById(id).populate(
      "generatedBy",
      "name email role"
      
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bill fetched successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
const getBillByNumber = async (req, res) => {
  try {
    const { billNumber } = req.body;

    const bill = await OrderBill.findOne({ billNumber }).populate(
      "generatedBy",
      "name email"
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bill fetched successfully",
      data: bill,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


const getFranchiseBills = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const {
      startDate,
      endDate,
      paymentMethod,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const skip = (page - 1) * limit;

    const User = (await import("../models/user.js")).default;
    const franchiseAdmin = await User.findOne({ 
      franchiseId: franchiseId,
      role: "FRANCHISE_ADMIN" 
    });

    if (!franchiseAdmin) {
      return res.status(404).json({
        success: false,
        message: "Franchise admin not found",
      });
    }

    const filter = { generatedBy: franchiseAdmin._id };

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod.toUpperCase();
    }

    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } },
      ];
    }

    const bills = await OrderBill.find(filter)
      .populate("generatedBy", "name email role")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBills = await OrderBill.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Bills fetched successfully",
      data: bills,
      pagination: {
        total: totalBills,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalBills / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching franchise bills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export {
  createDirectBill,
  updateBill,
  deleteBill,
  getAllBills,
  getBillById,
  getBillByNumber,
  getFranchiseBills,
};
