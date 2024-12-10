import nodemailer from "nodemailer"

const environment = process.env.NODE_ENV
const craftedEmail = environment === 'production'? process.env.PROD_EMAIL :process.env.DEV_EMAIL
const craftedEmailPassword = environment === 'production'? process.env.PROD_EMAIL_PASSWORD:process.env.DEV_EMAIL_PASSWORD
const emailProvider = process.env.DEV_PROVIDER

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

export default transporter