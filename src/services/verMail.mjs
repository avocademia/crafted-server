import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import { verificationToken } from "./jwt.mjs";

dotenv.config();

export const sendVerification = (email, id) => {
    const token = verificationToken({ id, email });
    const craftedEmail = process.env.DEV_EMAIL;
    const craftedEmailPassword = process.env.DEV_PASSWORD;
    const emailProvider = process.env.DEV_PROVIDER;
    const environment = process.env.NODE_ENV;

    const transporter = nodemailer.createTransport({
        service: emailProvider,
        auth: {
            user: craftedEmail,
            pass: craftedEmailPassword
        },
        secure: false,
        tls: {
            rejectUnauthorized: environment === 'production' ? true : false
        }
    });

    const link = `${process.env.DEV_CLIENT_URL}/api/users/verify/${token}`;

    const mailOptions = {
        from: craftedEmail,
        to: email,
        subject: 'Account Verification',
        text: `Click the link to verify your account: ${link}`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);  // Pass the error back
            }
            resolve(info);  // Pass the info back on success
        });
    });
};

export default { sendVerification };
