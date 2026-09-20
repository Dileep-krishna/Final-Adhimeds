import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// List of all Kerala districts
const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad'
];

const staffMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[0-9\s\-\(\)]{10,15}$/, 'Please enter a valid phone number'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role is required'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: false,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: {
        values: KERALA_DISTRICTS,
        message: '{VALUE} is not a valid district in Kerala'
      },
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Indexes
staffMemberSchema.index({ storeId: 1 });
staffMemberSchema.index({ status: 1 });
staffMemberSchema.index({ district: 1 });

// Pre-save hook for new documents and save() calls
staffMemberSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Pre-update middleware for findOneAndUpdate
staffMemberSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  
  // Check if password is being updated directly
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
  
  // Check for $set operator (when using { $set: { password: 'newPass' } })
  if (update.$set && update.$set.password) {
    const salt = await bcrypt.genSalt(10);
    update.$set.password = await bcrypt.hash(update.$set.password, salt);
    this.setUpdate(update);
  }
});

// Pre-update middleware for updateOne
staffMemberSchema.pre('updateOne', async function() {
  const update = this.getUpdate();
  
  // Check if password is being updated directly
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
  
  // Check for $set operator
  if (update.$set && update.$set.password) {
    const salt = await bcrypt.genSalt(10);
    update.$set.password = await bcrypt.hash(update.$set.password, salt);
    this.setUpdate(update);
  }
});

// Static method to hash password (for manual updates)
staffMemberSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password method
staffMemberSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const StaffMember = mongoose.model('StaffMember', staffMemberSchema);
export default StaffMember;