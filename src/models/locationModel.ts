import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  address?: string;
  contactPerson?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    unique: true,
    trim: true,
    maxlength: [255, 'Location name cannot exceed 255 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
LocationSchema.index({ name: 1 });

export default mongoose.model<ILocation>('Location', LocationSchema);