import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
     name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true
      },
      category: {
        type: String,
        enum: ['STARTERS', 'MAIN_COURSE', 'BEVERAGES', 'DESSERTS', 'SNACKS', 'CHAAT'],
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      image: {
        type: String,
        default: null
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }, {
      timestamps: true
});

foodSchema.index({ name: 1 });
foodSchema.index({ category: 1 });
foodSchema.index({ isAvailable: 1 });

const Food = mongoose.model('Food', foodSchema);
export default Food;