require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const nodemailer = require("nodemailer");
const { generateOTP, verifyOTP } = require("./lib/otp");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

bot.onText(/^\/start$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "🤖 Welcome!\n\nUse:\n/otp your@email.com\n\nI will generate a one-time code and send it to that email."
  );
});

bot.onText(/^\/otp\s+(\S+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];

  try {
    const otp = generateOTP();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Your One-Time Password",
      text: `Your OTP is: ${otp}\n\nThis code expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`
    });

    // Store the OTP for this Telegram user.
    verifyOTP.store(chatId, otp);

    await bot.sendMessage(
      chatId,
      "✅ OTP sent successfully.\n\nUse /verify YOUR_CODE to verify it."
    );
  } catch (error) {
    console.error("Email error:", error);

    await bot.sendMessage(
      chatId,
      "❌ Could not send the OTP. Check your SMTP settings."
    );
  }
});

bot.onText(/^\/verify\s+(\d{6})$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];

  const result = verifyOTP.check(chatId, code);

  await bot.sendMessage(chatId, result.message);
});

bot.onText(/^\/verify$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "Usage: /verify 123456"
  );
});

console.log("🤖 Telegram OTP bot is running...");
