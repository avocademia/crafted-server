import express from 'express'
import {signin, signout, signup, verifyAcount} from '../controllers/user'
import { follow } from '../controllers/klosetFollowers'
import { verifyTokens } from '../services/verifyTokens'


export const userRouter = express.Router()

userRouter.get('/verify/:token', verifyAcount)
userRouter.post(`/signup`,signup)
userRouter.post(`/signin`, signin)
userRouter.post(`/signout`, signout)
userRouter.post(`/follow`,verifyTokens ,follow)

export default userRouter