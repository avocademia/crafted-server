import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const ACCESS_SECRET = process.env.ACCESS_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET
const VERIFICATION_SECRET = process.env.VERIFICATION_SECRET
const RESET_SECRET = process.env.RESET_SECRET

export const createAccessToken = (payload, expiresIn = '15m') => {
    return jwt.sign(payload, ACCESS_SECRET, {expiresIn})
}

export const verificationToken = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, VERIFICATION_SECRET, {expiresIn})
}

export const createResetToken = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, RESET_SECRET, {expiresIn})
}

export const createRefreshToken = (payload, expiresIn = '30d') => {
    return jwt.sign(payload, REFRESH_SECRET, {expiresIn})
}

export const verifyAccessToken = (accessToken, callback, next ) => {

    jwt.verify(accessToken, VERIFICATION_SECRET, (err, res) => {

        if (err) {
            return res.status(400).json({message: `invalid or expired token`})
        }
        return callback(res, null)

    })

    next()
}

export const verifyVerificationToken = (req,res,next) => {

    const token = req.params.token

    jwt.verify(token, ACCESS_SECRET, (err, decoded) => {

        if (err) {
            return res.status(400).json({message: `invalid or expired token`})
        }
        return req.user = decoded

    })

    next()
}

export const verifyRefreshToken = (refreshToken, callback, next) => {

    jwt.verify(refreshToken, REFRESH_SECRET, (err,res) => {

        if (err) {
            return res.status(400).json({message: `invalid or expired token`})
        }
        return callback(res, null)

    })

    next()
}

export const verifyResetToken = (refreshToken, callback, next) => {

    jwt.verify(refreshToken, RESET_SECRET, (err,res) => {

        if (err) {
            return res.status(400).json({message: `invalid or expired token`})
        }
        return callback(res, null)

    })

    next()
}

export default {

    createAccessToken,
    createRefreshToken,
    verificationToken,
    createResetToken,
    verifyAccessToken,
    verifyRefreshToken,
    verifyVerificationToken,
    verifyResetToken
    
}