import {verifyAccessToken, verifyRefreshToken, createAccessToken} from './jwt.mjs'
import {User} from '../models/User.mjs'

export const tokenHandler = (req,res,next) => {

    const accessToken = req.cookies.accessToken
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
        return res.status(403).json({message: 'Access denied. Log in!'})
    }

    verifyAccessToken(accessToken, (err,validAccessToken) => {
        if (!err && validAccessToken) {
            next()
        } 
    })

    verifyRefreshToken(refreshToken, (err,validRefreshToken) => {

        if (err) return res.status(403).json({meesage: 'Invalid or expired token'})

        const {id} = validRefreshToken

        User.findUserById(id, (err,user) => {

            if (err || !user) {
                return res.status(404).json({message: 'User not found'})
            }
            
            const newAccessToken = createAccessToken({id: user.id, role: user.role})

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'strict',
                maxAge: 15*60*1000 //15min
            })

            next()
        })

    })
}