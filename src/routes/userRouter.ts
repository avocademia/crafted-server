import express from 'express'
import {signin, signout, signup, verifyAcount} from '../controllers/user'


export const userRouter = express.Router()

userRouter.get('/verify/:token', verifyAcount)
userRouter.post(`/signup`,signup)
userRouter.post(`/signin`, signin)
userRouter.post(`/signout`, signout)

export default userRouter