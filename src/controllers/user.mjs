import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import dotenv from 'dotenv'
import { User } from '../models/User.mjs'
import {sendVerification} from '../services/verMail.mjs'
import { sendResetEmail } from '../services/resetMail.mjs'
import {
    createRefreshToken, 
    createAccessToken, 
    createResetToken,
    verifyResetToken
} from '../services/jwt.mjs'

dotenv.config()

export const signup = async (req, res) => {
    const { first_name, last_name, username, email, password, whatsapp_number } = req.body

    if (!first_name || !last_name || !username || !email || !whatsapp_number || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const sanitizedFirstName = validator.escape(first_name)
    const sanitizedLastName = validator.escape(last_name)
    const sanitizedUsername = validator.escape(username)
    const sanitizedEmail = validator.normalizeEmail(email)
    const profilePicture = req.file ? `uploads/profile_pictures/${req.file.filename}` : null
    const hashedPassword = await bcrypt.hash(password, 10)
    const isFirstAdmin = email === process.env.FIRST_ADMIN_EMAIL

    if (!validator.isEmail(sanitizedEmail)) {
        return res.status(401).json({ message: 'Invalid email' })
    }

    if (!validator.isStrongPassword(password)) {
        return res.status(401).json({ message: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols' })
    }

    const userData = {
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
        whatsapp_number: whatsapp_number,
        role: isFirstAdmin ? 'admin' : 'customer',
        authenticated: isFirstAdmin ? true : false,
        profile_picture: profilePicture
    }

    User.create(userData, (err, user) => {
        if (err) {
            return res.status(500).json({ message: `${err}` })
        }

        try {
            sendVerification(userData.email, user.id)
            return res.status(201).json({
                message: 'Account successfully created! verify email and sign in',
                user
            })
        } catch (error) {
            console.error("Error sending email:", error);  // Log the full error for debugging
            return res.status(500).json({
                message: `Error occured sending the verification email: ${error.message}`,
                user
            })
        }
    })
}

export const signin = async (req,res) => {

    const {identifier,password} = req.body
    const isEmail = validator.isEmail(identifier)
    let user 

    try {

        if (isEmail) {

            const sanitizedEmail = validator.normalizeEmail(identifier)
            user = await new Promise((resolve,reject) => {
                User.findUserByEmail(sanitizedEmail, (err,foundUser) => {
                    if (err || !foundUser) {
                        return reject(err)  
                    }
                    resolve(foundUser)
                })  
            })
    
        } else {

            const sanitizedUsername = validator.escape(identifier)
            user = await new Promise ((resolve,reject) => {
                User.findByUsername(sanitizedUsername, (err, foundUser) => {
                    if (err)  {
                        return res.status(404).json({message: `User not found: ${err}`})
                    }
                    if (!foundUser) return reject(new Error('User not found i think'));
                    return resolve(foundUser)
                })
            })
        }      
    
        const isMatch = await new Promise((resolve,reject) => {
            bcrypt.compare(password, user.password, (err,match) => {
                if (err) return reject(err)
                return resolve(match)
            })
        })

        if (!isMatch) {
            return res.status(401).json({message: 'Invalid credentials'})
        }

        const accessToken = createAccessToken({id: user.id, role: user.role})
        const refreshToken = createRefreshToken({id: user.id, role: user.role})

        await new Promise((resolve,reject) => {
            User.updateRefreshToken(user.id, refreshToken, (err) => {
                if (err) return reject(err)
                    return resolve()
            })
        })

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            maxAge: 30*24*60*1000 //30days
        })
    
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            maxAge: 30*24*60*60*1000 //30 days
        })

        res.status(200).json({

            user: {
                id: user.id,
                first_name: user.first_name,
                username: user.username,
                role: user.role,
                authenticated: user.authenticated,
                profile_picture: user.profile_picture
            }
        })           
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }     
}

export const signout = (req, res) => {

    try {

        res.cookie('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            expires: new Date(0)
        })
    
        res.cookie('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'? true : false,
            path: '/',
            sameSite: 'strict',
            expires: new Date(0)
        })

        res.status(200).json({message: 'Successfully Logged Out'})
        
    } catch (error) {
        res.status(500).json({message: `Signout error: ${error}`})
    }
}

export const requestPasswordReset = async (req, res) => {

    const {email}= req.body

    const sanitizedEmail = validator.normalizeEmail(email)

    if(!validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({message: 'Invalid email'})
    }

    const user = User.findUserByEmail(email, (err,user) => {

        if(err) return res.status(404).jason({message: 'User not found'})
        
        return user
    })

    const resetPasswordToken = createResetToken({id: user.id})

    const resetPasswordExpiration = new Date()
    resetPasswordExpiration.setHours(resetTokenExpiration.getHours() + 1)

    User.updateResetPasswordToken({id: user.id, resetPasswordToken, resetPasswordExpiration}, (err) =>{
        if (err) return res.status(500).json({message: 'server error'})
        
        sendResetEmail({email: sanitizedEmail, resetPasswordToken}, (err) => {
        if (err) return res.status(500).json({message: 'Error sending reset password email'})  
        })
    })

        return res.status(200).json({message: 'Reset Password Link sent succesfully'})    
}

export const resetPassword = async (req,res) => {

    const {token, newPassword} = req.body

    try {

        verifyResetToken({resetPasswordToken: token}, (err, res) => {
          if (err) return res.status(400).json({message: 'token is invalid or expired'})
          return res
        })

    } catch (error) {
        return res.status(500).json({message: 'Error verifying token'})
    }

    const user = User.findUserByResetToken({resetToken: token}, (err) => {
        if (err) return res.status(404).json({message: 'user not found'})
    })

    const hashedNewPassword = await bcrypt.hash(newPassword,10)
         
    User.updatePassword({id: user.id, newPassword: hashedNewPassword}, (err) => {
        if (err) return res.status(500).json({message: 'server error updating updating password'})
    })

    return res.status(200).json({message: 'Password sucessfully changed!'})
}

export const fetchUsers = async (req,res) => {
    const token = req.cookies.accessToken
    const ACCESS_SECRET = process.env.ACCESS_SECRET
    const FIRST_ADMIN_EMAIL = process.env.FIRST_ADMIN_EMAIL

    if (!token) {
        return res.status(401).json({message: 'Unauthorised, no token provided'})
    } 

    try {

        const decoded = jwt.verify(token, ACCESS_SECRET)
        const {id} = decoded
        const user = User.findUserById(id)

        if (!user) {
            return res.status(404).json({message: 'user not found'})
        }

        if (user.email === FIRST_ADMIN_EMAIL) {
            return res.status(401).json({message: 'user is not authorised to access data'})
        }

        User.getAllUsers ((err, users) => {
            if (err) {
                return res.status(500).json({message: 'error fetching users'})
            }
            return res.status(200).json({users: users})
        })
        
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }
}

export const isFirstAdmin = async (req, res) => {
    const token = req.cookies?.accessToken || req.accessToken
    const ACCESS_SECRET = process.env.ACCESS_SECRET
    const FIRST_ADMIN_EMAIL = process.env.FIRST_ADMIN_EMAIL

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized request' })
    }

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET)
        const { id } = decoded
        
        const user = await User.findUserById(id)
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (user.email === FIRST_ADMIN_EMAIL) {
            return res.status(200).json({ isFirstAdmin: true })
        }       
        return res.status(200).json({ isFirstAdmin: false })

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' })
    }
}

export const changeRole = async (req, res) => {
    const role = req.body.role
    const id = req.body.id
    let newRole

    if (role !== 'customer' && role !== 'admin') {
        return res.status(400).json({message: 'bad request'})
    }

    if (role === 'customer') {
        newRole = 'admin'
    } else {
        newRole = 'customer'
    }

    try {
        User.updateRole(newRole, id, (err, result) =>{
            if (err) {
                return res.status(500).json({message: `Internal Server Error`})
            }
            return res.status(200).json({message: `Role Change Successful`})
        })
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }
}

