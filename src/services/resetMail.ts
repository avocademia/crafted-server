import dotenv from 'dotenv'
import transporter from "../config/email";

dotenv.config();

export const sendResetEmail = (email:string, resetPasswordToken:JsonWebKey, callback:(err:Error|null) => void) => {
    const environment = process.env.NODE_ENV
    const url = environment === 'production'? process.env.PROD_CLIENT_URL:process.env.DEV_CLIENT_URL
    const link = `${url}/${resetPasswordToken}`
    const craftedEmail = environment === 'production'? process.env.PROD_EMAIL :process.env.DEV_EMAIL

    const mailOptions = {
        from: craftedEmail,
        to: email,
        subject: 'Password Reset',
        html: ` <p>click the link below to rset your password</p>
                <a href=${link}>${link}<a/>
                <p>This link expiires in an hour</p>
              `
    }

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            callback(error)
        }
    })
}

export default {sendResetEmail}