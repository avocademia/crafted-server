import jwt, { Secret } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { UserRole } from '../types'

dotenv.config()

const accessSecret = process.env.ACCESS_SECRET as Secret
const refreshSecret = process.env.REFRESH_SECRET as Secret
const verificationSecret = process.env.VERIFICATION_SECRET as Secret
const resetSecret = process.env.RESET_SECRET as Secret

export const createAccessToken = (id:number, role:UserRole, expiresIn = '15m') => {
    return jwt.sign({id,role}, accessSecret, {expiresIn})
}

export const verificationToken = (id:number, expiresIn = '1h') => {
    return jwt.sign({id}, verificationSecret, {expiresIn})
}

export const createResetToken = (id:number, expiresIn = '1h') => {
    return jwt.sign({id}, resetSecret, {expiresIn})
}

export const createRefreshToken = (id:number, role:UserRole, expiresIn = '30d') => {
    return jwt.sign({id,role}, refreshSecret, {expiresIn})
}

export const verifyResetToken = (resetToken: string, callback:(err:Error|null) => void) => {

    jwt.verify(resetToken, resetSecret, (err,res) => {

        if (err) {
            return callback(err)
        }
        return callback(null)
    })
}

export default {
    createAccessToken,
    createRefreshToken,
    verificationToken,
    createResetToken,
    verifyResetToken
}