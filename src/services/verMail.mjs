import nodemailer from "nodemailer"
import dotenv from 'dotenv'
import {verificationToken} from "./jwt.mjs"

dotenv.config()

export const sendVerification = (email, id) => {

    const token = verificationToken({ id, email})

    const transporter = nodemailer.createTransport({
        service: process.env.DEV_PROVIDER,
        auth: {
            email: process.env.DEV_EMAIL,
            password: process.env.DEV_PASSWORD
        }
    })

    const link = `${process.env.DEV_URL}/api/users/verify/${token}`

    const mailOptions = {
        from: process.env.DEV_EMAIL,
        to: email,
        subject: 'Account Verification',
        body: `Click the link to verify your account: ${link}`
    }

    transporter.sendMail(mailOptions, (error, info) => {

        if (error) {
            return console.log(error)
        }

        console.log(`Email sent: ${info.response}`)
    })
}

export default {sendVerification}