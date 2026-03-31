import Food from "../models/Food.js";
import { getS3ImageUrl } from "../utils/s3.js";

const createFood = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, description, category, price } = req.body;
    // S3 URL set by multer-s3 middleware; falls back to body.image for backward compat
    const image = req.file?.location || req.body.image || null;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, category, and price are required",
      });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can create food items",
      });
    }

    const existingFood = await Food.findOne({ name });

    if (existingFood) {
      return res.status(400).json({
        success: false,
        message: "A food item with this name already exists.",
      });
    }

    const food = await Food.create({
      name: name.trim(),
      description,
      category,
      price: Number(price),
      isAvailable: true,
      image,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Food item created successfully",
      data: food,
    });
  } catch (error) {
    console.error("❌ Create Food Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create food item.",
    });
  }
};

const getAllFoods = async (req, res) => {
  try {
    const { category, isAvailable, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .populate("createdBy", "name email")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Food.countDocuments(filter),
    ]);

    // Generate pre-signed URLs for private S3 images
    const foodsWithSignedUrls = await Promise.all(
      foods.map(async (food) => {
        const foodObj = food.toObject();
        if (foodObj.image) {
          foodObj.image = await getS3ImageUrl(foodObj.image);
        }
        return foodObj;
      })
    );

    res.json({
      success: true,
      data: {
        foods: foodsWithSignedUrls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
const updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFood = await Food.findById(id);

    if (!existingFood) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can update food items",
      });
    }

    const updateData = { ...req.body };
    // If a new image was uploaded to S3, override the image field
    if (req.file?.location) {
      updateData.image = req.file.location;
    }

    const food = await Food.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: "Food item updated successfully",
      data: food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFood = await Food.findById(id);

    if (!existingFood) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can delete food items",
      });
    }

    await Food.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Food item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleFoodAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    if (
      req.user.role !== "SUPER_ADMIN" &&
      req.user.role !== "FRANCHISE_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Super Admin or Franchise Admin can toggle food availability",
      });
    }

    food.isAvailable = !food.isAvailable;
    await food.save();

    res.status(200).json({
      success: true,
      message: `Food item is now ${
        food.isAvailable ? "available" : "unavailable"
      }`,
      data: {
        _id: food._id,
        name: food.name,
        isAvailable: food.isAvailable,
      },
    });
  } catch (error) {
    console.error("Error toggling food availability:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export {
  createFood,
  getAllFoods,
  updateFood,
  deleteFood,
  toggleFoodAvailability,
};
