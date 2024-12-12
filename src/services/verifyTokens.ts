import jwt, {  JwtPayload, Secret } from "jsonwebtoken"
import dotenv from 'dotenv'
import { createAccessToken } from "./jwt"
import { Request, Response, NextFunction } from "express"
import { User } from "../models/User"
import { ReqWithAcst } from "../types"

dotenv.config()

export const verifyTokens = async (req:ReqWithAcst, res:Response , next:NextFunction) => {

    const accessToken = req.cookies.accessToken as string
    const accessSecret = process.env.ACCESS_SECRET as Secret
    const refreshSecret = process.env.REFRESH_SECRET as Secret

    try {

        const decodedAccess = jwt.verify(accessToken, accessSecret) as JwtPayload
        req.accessToken = accessToken
        req.userId = decodedAccess.id
        next()

    } catch (error) {
        if ( error instanceof Error && error.name === 'TokenExpiredError') {

            try {

                const decodedAccess = jwt.decode(accessToken) as JwtPayload

                const {id} = decodedAccess
                User.findUserById(parseInt(id), (err, foundUser) => {
                    if (err) {
                        res.status(500).json({error: 'database error fetching user for validation'})
                    }

                    if (foundUser && foundUser.refresh_token) {
                        
                        const decodedRefresh = jwt.verify(foundUser.refresh_token, refreshSecret) as JwtPayload
                        const {id, role} = decodedRefresh
                        const newAccessToken = createAccessToken (id, role)
                        req.accessToken = newAccessToken
                        req.userId = id

                        res.cookie('accessToken', newAccessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production'? true: false,
                            sameSite: 'strict',
                            maxAge: 30 * 24 * 60 * 1000,
                            path: '/' //30d
                        })
                    
                        next()

                    } else {
                        res.clearCookie('accessToken')
                        res.status(403).json({error: 'invalid token'})
                    }
                })
                
            } catch (error) {
                if (error instanceof Error) {
                    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' })
                    res.status(403).json({ error: error.message })
                }  else {
                    res.status(500).json({error: 'unexpected error validating tokens'})
                }
            }
            
        } else {
            if (error instanceof Error) {
                res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' })
                res.status(403).json({ error: error.message })
            }  else {
                res.status(500).json({error: 'unexpected error validating tokens'})
            }
        }
    }
}