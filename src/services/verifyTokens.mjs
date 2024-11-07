import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import { createAccessToken } from "./jwt.mjs"

dotenv.config()

export const verifyTokens = async (req, res , next) => {

    const accessToken = req.cookies.accessToken
    const refreshToken = req.cookies.refreshToken
    const ACCESS_SECRET = process.env.ACCESS_SECRET
    const REFRESH_SECRET = process.env.REFRESH_SECRET

    try {
        jwt.verify(accessToken, ACCESS_SECRET, (err,decoded) => {
            if (err) {

                jwt.verify(refreshToken, REFRESH_SECRET, (err, decodedRefresh) => {

                    if (err) {
                        res.clearCookie('accessToken', {httpOnly: true, sameSite: 'stict'})
                        res.clearCookie('refreshToken', {httpOnly: true, sameSite: 'stict'})
                        return res.status(403).json({message: 'session expired, sign in again'})
                    }
    
                    const { id, role } = decodedRefresh;
                    const newAccessToken = createAccessToken({id: id,role: role})
    
                    res.cookie('accessToken', newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production'? true: false,
                        sameSite: 'strict',
                        maxAge: 30 * 24 * 60 * 1000,
                        path: '/' //30d
                    })

                    req.userId = id
                    return next()
                })
            } else {
                req.userId = decoded.id
                return next()
            }   
        })
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }
}