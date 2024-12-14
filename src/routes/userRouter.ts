import express from 'express'
import {signin, signout, signup, verifyAcount} from '../controllers/user'
import { follow } from '../controllers/klosetFollowers'
import { verifyTokens } from '../services/verifyTokens'
import { addItem, getUserCart, removeItem, updateData, verifyItem } from '../controllers/cart'

export const userRouter = express.Router()

userRouter.get('/verify/:token', verifyAcount)
userRouter.post(`/signup`,signup)
userRouter.post(`/signin`, signin)
userRouter.post(`/signout`, signout)
userRouter.post(`/follow`,verifyTokens ,follow)
userRouter.post('/add-cart-item', verifyTokens, addItem)
userRouter.delete('/remove-cart-item/:cart_item_id', verifyTokens,removeItem)
userRouter.patch('/update-cart-item-cost/:new_cost', verifyTokens, updateData)
userRouter.patch('/update-cart-item-quantity/:new_quantity', verifyTokens, updateData)
userRouter.get('/verify-item/:product_id&:type', verifyTokens, verifyItem)
userRouter.get('/populate-cart', verifyTokens, getUserCart)

export default userRouter