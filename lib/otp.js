const crypto = require("crypto");

const otpStore = new Map();

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function store(chatId, otp) {
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;

  otpStore.set(String(chatId), {
    otp,
    expiresAt
  });
}

function check(chatId, submittedOTP) {
  const key = String(chatId);
  const record = otpStore.get(key);

  if (!record) {
    return {
      success: false,
      message: "❌ No active OTP found."
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);

    return {
      success: false,
      message: "⏰ This OTP has expired. Request a new one."
    };
  }

  if (record.otp !== submittedOTP) {
    return {
      success: false,
      message: "❌ Invalid OTP."
    };
  }

  // OTP is one-time use.
  otpStore.delete(key);

  return {
    success: true,
    message: "✅ OTP verified successfully!"
  };
}

module.exports = {
  generateOTP,
  verifyOTP: {
    store,
    check
  }
};
