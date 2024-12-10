import bcrypt from 'bcryptjs'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import validator from 'validator'
import dotenv from 'dotenv'
import { User } from '../models/User'
import {sendVerification} from '../services/verMail'
import { sendResetEmail } from '../services/resetMail'
import {
    createRefreshToken, 
    createAccessToken, 
    createResetToken,
    verifyResetToken
} from '../services/jwt.js'
import { Request, Response } from 'express'
import { UserData, UserRole, UserSignUpData } from '../types.js'
import { MysqlError } from 'mysql'

dotenv.config()

export const signup = async (req:Request, res:Response) => {
    const { first_name, last_name, username, email, password, whatsapp_number } = req.body

    if (!first_name || !last_name || !username || !email || !whatsapp_number || !password) {
        res.status(400).json({ error: 'All fields are required' })
    }

    const sanitizedFirstName = validator.escape(first_name)
    const sanitizedLastName = validator.escape(last_name)
    const sanitizedUsername = validator.escape(username)
    const sanitizedEmail = validator.normalizeEmail(email)
    const profilePicture = req.file ? `uploads/profile_pictures/${req.file.filename}` : null
    const hashedPassword = await bcrypt.hash(password, 10)
    const isFirstAdmin = email === process.env.FIRST_ADMIN_EMAIL

    if (!validator.isStrongPassword(password)) {
        res.status(401).json({ error: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols' })
    }

    if (!sanitizedEmail) {
        res.status(400).json({error: 'invalid email'})
    } else {

        const userData:UserSignUpData = {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            username: sanitizedUsername,
            email: sanitizedEmail,
            password: hashedPassword,
            whatsapp_number: whatsapp_number,
            role: isFirstAdmin ? 'admin' : 'customer' as UserRole,
            authenticated: isFirstAdmin ? true : false,
            profile_picture: profilePicture
        }
    
        User.create(userData, (err,user) => {
            if (err && !userData.role) {
                res.status(500).json({ error: `database error occured creating user` })
            }

            if (user && userData.role && user.insertId) {

                try {
    
                    sendVerification(user.insertId, userData.email, (err) => {
                        if (err) {
                            res.status(500).json({error: 'error sending verification email'})
                        } else {
                            res.status(201).json({
                                message: 'Account successfully created! verify email and sign in',
                            }) 
                        }
                    })
                    
                } catch (error) {
                    res.status(500).json({error: `Error occured sending the verification email`,})
                }
            }
        })

    }
}

export const verifyAcount = async (req:Request,res:Response) => {

    const token = req.params.token
    const verificationSecret = process.env.VERIFICATION_SECRET as Secret

    try {
        const decodedToken = jwt.verify(token, verificationSecret) as JwtPayload
        const {id} = decodedToken
        User.updateAuthenticatedStatus(id, true, (err) => {
            if (err) {
                res.status(500).json({error: 'database error updating authentication'})
            }
        })
        res.status(200).json({message: 'acount successfully verified'})

    } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            res.status(401).json({error: `expired token`})
        } else {
            res.status(500).json({error: 'error verifying account'})
        }
    }
}

export const signin = async (req:Request, res:Response) => {

    const {identifier,password} = req.body
    const isEmail = validator.isEmail(identifier)

    interface sendUserProps {
        accessToken: string,
        foundUser: UserData
    }

    const sendUser = ({accessToken, foundUser}: sendUserProps) => {

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            maxAge: 30*24*60*1000 //30days
        })

        res.status(200).json({

            user: {
                first_name: foundUser.first_name,
                username: foundUser.username,
                role: foundUser.role,
                authenticated: foundUser.authenticated,
                profile_picture: foundUser.profile_picture
            }
        })           

    }

    try {

        let accessToken: string
        let refreshToken: string

        if (isEmail) {

            const sanitizedEmail = validator.normalizeEmail(identifier)

            if (!sanitizedEmail) {
                res.status(400).json({error: 'Invalid email'})
            } 
            
            if (password && sanitizedEmail) {

                User.findUserByEmail(sanitizedEmail, (err, foundUser:UserData) => {

                    if (err) {
                        res.status(500).json({error: 'database error searching for user'})
                    } 

                    if (!foundUser) {
                        res.status(404).json({error: 'invalid credentials'})  
                    } else {

                        bcrypt.compare(password, foundUser.password, (err,match) => {
                            if (err) {
                                res.status(500).json({error: 'error validating password'})
                            }
                            
                            if (match) {
                                accessToken = createAccessToken(foundUser.id, foundUser.role)
                                refreshToken = createRefreshToken(foundUser.id, foundUser.role)
        
                                User.updateRefreshToken(foundUser.id, refreshToken, (err) => {
                                    if (err) {
                                        res.status(500).json({error: 'database error updating token'})
                                    }
                                })
        
                                sendUser({
                                    accessToken, 
                                    foundUser
                                })
                            } else {
                                res.status(404).json({error: 'invalid credentials'})
                            }
                        })  
                    }
                })  

            } 

        } else {

            const sanitizedUsername = validator.escape(identifier)
            User.findByUsername(sanitizedUsername, (err, foundUser:UserData) => {
                if (err)  {
                    res.status(500).json({error: `unknown error occured fetchiing user`})
                }

                if (!foundUser) {
                    return res.status(404).json({error: 'invalid credentials'})
                } else {

                    bcrypt.compare(password, foundUser.password, (err,match) => {
                        if (err) {
                            res.status(500).json({error: 'unknown error validating credentials'})
                        }
    
                        if (match) {
                            accessToken = createAccessToken(foundUser.id, foundUser.role)
                            refreshToken = createRefreshToken(foundUser.id, foundUser.role)
    
                            User.updateRefreshToken(foundUser.id, refreshToken, (err) => {
                                if (err) {
                                    res.status(500).json({error: 'database error updating token'})
                                }
                            })
    
                            sendUser({
                                accessToken, 
                                foundUser
                            })
                        } else {
                            res.status(404).json({error: 'invalid credentials'})
                        }
                    })

                }
            })
        }

    } catch (error) {
        res.status(500).json({error: `unknown error signing in`})
    }     
}

export const signout = (req:Request,res:Response) => {

    try {

        res.cookie('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            expires: new Date(0)
        })

        res.status(200).json({message: 'Successfully Logged Out'})
        
    } catch (error) {
        res.status(500).json({error: `unknown error signing out`})
    }
}

export const requestPasswordReset = async (req:Request, res:Response) => {

    const {email}= req.body
    const sanitizedEmail = validator.normalizeEmail(email)

    if(!sanitizedEmail) {
        res.status(400).json({error: 'Invalid email'})
    }
    let user: UserData
    let resetPasswordToken: JsonWebKey

    try {
        User.findUserByEmail(email, (err:MysqlError|null, foundUser:UserData) => {
        if(err) {
            res.status(404).json({error: 'User not found'})
        }

        user = foundUser
        resetPasswordToken = createResetToken(user.id) as JsonWebKey
        sendResetEmail(email, resetPasswordToken, (err) => {

        })
        })
    } catch (error) {
        res.status(500).json({error: 'error occured creating token'})
    }

    const resetPasswordExpiration = new Date()
    resetPasswordExpiration.setHours(resetPasswordExpiration.getHours() + 1)

    /*User.updateResetPasswordToken({id: user.id, resetPasswordToken, resetPasswordExpiration}, (err) =>{
        if (err) res.status(500).json({message: 'server error'})
        
        sendResetEmail({email: sanitizedEmail, resetPasswordToken}, (err) => {
        if (err) res.status(500).json({message: 'Error sending reset password email'})  
        })
    })*/

    res.status(200).json({message: 'Reset Password Link sent succesfully'})    
}

export const resetPassword = async (req:Request, res:Response) => {

    const {token, newPassword} = req.body
    let user: UserData
    const hashedNewPassword = await bcrypt.hash(newPassword,10)

    try {

        verifyResetToken(token, (err) => {
            if (err) {
                res.status(400).json({error: 'token is invalid or expired'})
            }
          
            User.findUserByResetToken(token, (err, foundUser) => {
                if (err) {
                   res.status(404).json({error: 'user not found'}) 
                }
                user = foundUser
             
                User.updatePassword(user.id, hashedNewPassword, (err:MysqlError|null) => {
                    if (err) {
                       res.status(500).json({error: 'server error updating updating password'}) 
                    }
                    res.status(200).json({message: 'Password sucessfully changed!'})
                })
            })
        })

    } catch (error) {
        res.status(500).json({error: 'Unknown error occured reseting password'})
    }

}

export const fetchUsers = async (req:Request, res:Response) => {
    const token = req.cookies?.accessToken
    const accessSecret = process.env.ACCESS_SECRET
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL

    if (!token) {
        res.status(403).json({error: 'no token detected'})
    } 

    if (!accessSecret) {
        res.status(500).json({error: 'no secret provided'})
    } else {

        try {

            const decoded = jwt.verify(token, accessSecret)
            const payload = decoded as jwt.JwtPayload;
            const {id} = payload
    
            User.findUserById(parseInt(id), (err,foundUser) => {
                if (err) {
                    res.status(500).json({error: 'database error fetching user'})
                }
                
                if (foundUser && foundUser.email === firstAdminEmail ) {
                    User.getAllUsers ((err, users) => {
                        if (err) {
                            res.status(500).json({error: 'error fetching users'})
                        }
                        res.status(200).json({users: users})
                    })
                } else {
                    res.status(403).json({error: 'unauthorized request'})
                }
            })
            
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching users`})
        }

    }
}

interface FirstAdminReq extends Request {
    accessToken?: string
}

export const isFirstAdmin = async (req:FirstAdminReq, res:Response) => {
    const token = req.accessToken || req.cookies.accessToken
    const accessSecret = process.env.ACCESS_SECRET as Secret
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL

    if (!token) {
        res.status(401).json({error: 'Unauthorized request'})
    } else {

        try {
            const decoded = jwt.verify(token, accessSecret)
            const decodedSecret = decoded as JwtPayload
            const { id } = decodedSecret

            User.findUserById(parseInt(id), (err,foundUser) => {
                if (err) {
                    res.status(500).json({error: 'databse error admin'})
                }
    
                if (foundUser && foundUser.email === firstAdminEmail) {
                    res.status(200).json({isFirstAdmin: true})
                } else {
                    res.status(401).json({isFirstAdmin: false})
                }
    
            })
    
        } catch (error) {
            res.status(500).json({ error: 'unknown error occured verifying admin' })
        }

    }
}

export const changeRole = async (req:Request, res:Response) => {
    const role = req.body.role
    const id = req.body.id
    let newRole:UserRole

    if (role !== 'customer' && role !== 'admin') {
        res.status(400).json({error: 'bad request'})
    }

    if (role === 'customer') {
        newRole = 'admin'
    } else {
        newRole = 'customer'
    }

    try {
        User.updateRole(newRole, id, (err) =>{
            if (err) {
                res.status(500).json({error: `Internal Server Error`})
            }
            res.status(200).json({message: `Role Change Successful`})
        })
    } catch (error) {
        res.status(500).json({error: `unknown error occured updating role`})
    }
}

