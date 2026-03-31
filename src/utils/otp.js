import crypto from "crypto";
import dotenv from "dotenv";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

dotenv.config();

// AWS SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const otpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const sendOTPSMS = async (mobileNo, otp) => {
  // Always log OTP to console — useful during AWS SNS sandbox testing
  console.log(`\n📱 OTP for ${mobileNo}: ${otp} (valid 10 min)\n`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("⚠️  AWS credentials missing — OTP only logged to console.");
    return { success: true, messageId: "console-only" };
  }

  try {
    // Ensure E.164 format (+91XXXXXXXXXX for India)
    let formattedNumber = mobileNo.trim();
    if (!formattedNumber.startsWith("+")) {
      formattedNumber = "+91" + formattedNumber;
    }

    const message = `Your verification code is ${otp}. It will expire in 10 minutes. Do not share it with anyone.`;

    const command = new PublishCommand({
      Message: message,
      PhoneNumber: formattedNumber,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "PIZZCON",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    });

    const response = await snsClient.send(command);
    console.log("✅ OTP sent via AWS SNS:", response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    // AWS SNS India sandbox mode only allows verified phone numbers.
    // Log the error but don't block the user — OTP is already saved in DB and logged above.
    console.error("❌ AWS SNS Error:", error.message);
    console.warn("⚠️  SMS not delivered. Use the OTP printed above for testing.");

    // Return success: true so the app doesn't block the user flow.
    // To send real SMS: request SNS production access from AWS Console.
    return { success: true, messageId: "sms-failed-check-console" };
  }
};
