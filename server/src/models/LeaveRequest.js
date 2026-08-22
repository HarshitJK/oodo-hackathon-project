const mongoose = require("mongoose");

const approverSchema = new mongoose.Schema(
  {
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["manager", "admin"],
    },
    decision: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    comment: {
      type: String,
      default: "",
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["paid", "sick", "unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // 2-step approval chain: [manager approval, HR/admin approval]
    approverChain: {
      type: [approverSchema],
      default: [],
    },
    approverComments: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
