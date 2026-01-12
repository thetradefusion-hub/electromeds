import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'super_admin' | 'doctor' | 'staff';
  isActive: boolean;
  assignedDoctorId?: mongoose.Types.ObjectId; // For staff: assigned doctor
  createdBy?: mongoose.Types.ObjectId; // Who created this user (doctor/admin)
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['super_admin', 'doctor', 'staff'],
      default: 'staff',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false, // Optional, only for staff
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional, tracks who created this user
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes (email index already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ assignedDoctorId: 1 }); // For staff assignment queries
userSchema.index({ createdBy: 1 }); // For tracking who created users

const User = mongoose.model<IUser>('User', userSchema);

export default User;

