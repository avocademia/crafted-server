import nodemailer from "nodemailer"
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
    service: process.env.DEV_PROVIDER,
    auth: {
        email: process.env.DEV_EMAIL,
        password: process.env.DEV_PASSWORD
    }
})

export const sendResetEmail = (email, resetPasswordToken) => {

    const link = `${process.env.DEV_CLIENT_URL}`

    const mailOptions = {
        from: process.env.DEV_EMAIL,
        to: email,
        subject: 'Password Reset Link',
        html: ` <p>click the link below to rset your password</p>
                <a href=${link}>${link}<a/>
                <p>This link expiires in an hour</p>
              `
    }

    transporter.sendMail(mailOptions, (err,res) => {
        if (err) return console.log(err)
        return console.log('success!', res)
    })
}

export default {sendResetEmail}