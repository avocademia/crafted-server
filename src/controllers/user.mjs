import bcrypt from 'bcryptjs'
import validator from 'validator'
import { upload, scanUpload} from '../services/dpUpload.mjs'
import { clamscan } from '../services/clamscan.mjs'
import { User } from '../models/User.mjs'
import {sendVerification} from '../services/verMail.mjs'
import { sendResetEmail } from '../services/resetMail.mjs'
import {
    createRefreshToken, 
    createAccessToken, 
    createResetToken,
    verifyResetToken
} from '../services/jwt.mjs'




export const signup = async (req,res) => {

    const  {first_name, last_name, username, email, password, whatsapp_number} = req.body

    scanUpload(req,res, async (err) => {
        if (err) {
            return res.status(500).json({message: 'Error setting up file for scan'})
        }

        if (req.file) {
                try {
                    await clamscan.scanFile(req.file.buffer)
                    if (res.isInfected) {
                        return res.status(400).json({message: 'File rejected due to potential malware risk'})
                    }   
                } catch (error) {
                    return res.status(500).json({message: 'Error scanning file'})
                }
        }

        upload(res, (err) => {
            if (err) {
                return res.status(500).json({message: 'Error saving profile picture'})
            }
        })
    })

    

    if (!first_name||!last_name||!username||email||whatsapp_number||password) {
        return res.status(400).json({message: 'All fields are required'})
    }

    const sanitizedFirstName = await validator.escape(first_name)
    const sanitizedLastName = await validator.escape(last_name)
    const sanitizedUsername = await validator.escape(username)
    const sanitizedNumber = await validator.escape(whatsapp_number)
    const sanitizedEmail = await validator.normalizeEmail(email)
    const profilePicture = await req.file? `uploads/profile_pictures/${req.file.filename}` : null
    const hashedPassword = await bcrypt.hash(password,10)
    const isFirstAdmin = await email === process.env.FIRST_ADMIN_EMAIL

    if(!validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({message: 'Invalid email'})
    }

    if(!validator.isStrongPassword(password)) {
        return res.status(400).json({message: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols'})
    }

    try {
        
        const userData = {

            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            username: sanitizedUsername,
            email: sanitizedEmail,
            password: hashedPassword,
            whatsapp_number: sanitizedNumber,
            role: isFirstAdmin? 'admin' : 'customer',
            authenticated: isFirstAdmin? true : false,
            profile_picture: profilePicture

        }

        const user = User.create(userData)

        sendVerification({email: userData.email, id: user.id})

        const userResponse = {

            id: user.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            username: newUser.username,
            role: newUser.role,
            authenticated: newUser.authenticated

        }

        res.status(201).json(userResponse)

    } catch (error) {
        
        res.status(500).json({message: 'server error'})

    }
}

export const login = async (req,res) => {

    const {email,password} = req.body

    const sanitizedEmail = await validator.normalizeEmail(email)

    if (!validator.isEmail(sanitizedEmail)) {
        return res.status(400).json({message: 'Invalid Email'})
    }

    const user = User.findUserByEmail(sanitizedEmail, (err,user) => {

        if (err || !user) {
            res.status(404).json({message: 'User not found'})
        }

    })  

    bcrypt.compare(password, user.password, (err,isMatch) => {

        if (err || !isMatch) {
            res.status(401).json({message: 'Invalid credentials'})
        }

    })

    const accessToken = createRefreshToken({id: user.id, role: user.role})
    const refreshToken = createAccessToken({id: user.id})

    User.updateRefreshToken({id: user.id, refreshToken}, (err) => {

        if (err) {
            return res.status(500).json({message: 'server error'})
        }
     })

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 15*60*1000 //15 min
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: 30*24*60*60*1000 //30 days
    })

    res.status(200).json({

        user: {
            id: user.id,
            firtName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            role: user.role,
            authenticated: user.authenticated
        }
    })

    

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

        res.status(200).json({message: 'Reset Password Link sent succesfully'})    
}

export const resetPassword = (req,res) => {

    const {token, newPassword} = req.body

    verifyResetToken({resetPasswordToken: token, newPassword}, (err) => {

        if (err) return res.status(400).json({message: 'token is invalid or expired'})
        
        const user = User.findUserByResetToken({resetToken: token}, (err) => {
            if (err) return res.staus(404).json({message: 'user not found'})
        })

        const hashedNewPassword = bcrypt.hash(newPassword,10)
             
        User.updatePassword({id: user.id, newPassword: hashedNewPassword}, (err) => {
            if (err) return res.status(500).json({message: 'server error updating updating password'})
        })
    })

    res.status(200).json({message: 'Password sucessfully changed!'})
}

export default {
    signup,
    login,
    requestPasswordReset,
    resetPassword,
}
