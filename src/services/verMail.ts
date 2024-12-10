import nodemailer from "nodemailer"
import dotenv from 'dotenv'
import { verificationToken } from "./jwt"

dotenv.config()

export const sendVerification = (id:number, email:string, callback:(err:Error|null) => void ) => {
    const environment = process.env.NODE_ENV
    const token = verificationToken(id)
    const craftedEmail = environment === 'production'? process.env.PROD_EMAIL :process.env.DEV_EMAIL
    const craftedEmailPassword = environment === 'production'? process.env.PROD_EMAIL_PASSWORD:process.env.DEV_EMAIL_PASSWORD
    const emailProvider = process.env.DEV_PROVIDER
    const url = environment === 'production'? process.env.PROD_CLIENT_URL:process.env.DEV_CLIENT_URL

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
    })

    const link = `${url}/users/verify/${token}`

    const mailOptions = {
        from: craftedEmail,
        to: email,
        subject: 'Account Verification',
        text: `Click the link to verify your account: ${link}`
    }

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return callback(error)
            }
        })
}

export default { sendVerification }
