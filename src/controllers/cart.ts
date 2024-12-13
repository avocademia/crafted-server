import { Response } from "express"
import {Cart, ItemData} from "../models/Cart"
import validator from 'validator'
import { ProductType, ReqWithAcst, RequestWithParams } from "../types"

export interface addCartReqData {
    product_id: number,
    product_name: string,
    photo_path: string,
    quantity?: number,
    cost: number,
    product_type: ProductType
}

export const addItem = async (req:ReqWithAcst, res:Response) => {

    const {itemData} = req.body
    const data:ItemData = itemData

    if (typeof data.cost === 'number' && req.userId) {
        try {
            const sanitizedItemData: ItemData = {
                user_id: req.userId ,
                product_id: data.product_id,
                product_name: validator.escape(data.product_name),
                photo_path: validator.escape(data.photo_path),
                quantity: data.quantity? data.quantity:0,
                sold_out: false,
                active_status: true,
                product_type: data.product_type,
                cost: data.cost,
            }
            Cart.add(sanitizedItemData, (err) => {
                if (err){
                    res.status(500).json({error: err.message})
                }
            })
        } catch (error) {
            res.status(500).json({error: 'unexpected server error'})
        }
    } else {
        res.status(400).json({error: 'missing parameters'})
    }  
}

export const removeItem = (req:RequestWithParams, res:Response) => {

    const {cart_item_id} = req.params

    if (cart_item_id) {

        try {
            Cart.remove(parseInt(cart_item_id), (err) => {
                if (err){
                    res.status(500).json({error: 'database error'})
                } else {
                    res.status(200).json({message: 'removed successfully'})
                }
            })

        } catch (error) {
            res.status(500).json({error: 'unexpected server error'})
        }
    } else {
        res.status(400).json({errpr: 'missing parameters'})
    }
}

export const updateData = (req:RequestWithParams, res:Response) => {

    const {new_cost, new_quantity, cart_item_id} = req.params

    const validCostParams =  typeof new_cost === 'string' &&
                             validator.isNumeric(new_cost) &&
                             typeof cart_item_id === 'string' &&
                             validator.isNumeric(cart_item_id) 
                                
    const validQuantityParams =  typeof new_quantity === 'string' &&
                                 validator.isNumeric(new_quantity) &&
                                 typeof cart_item_id === 'string' &&
                                 validator.isNumeric(cart_item_id)

    if (validCostParams) {
        try {
            Cart.updateCost(parseInt(new_cost), parseInt(cart_item_id), (err)=> {
                if(err){
                    res.status(500).json({error: 'database error'})
                }
            })
        } catch (error) {
            res.status(500).json({error: 'unexpected server error'})
        }
    } else if (validQuantityParams) {
        try {
            Cart.updateQuantity(parseInt(new_quantity), parseInt(cart_item_id), (err)=> {
                if(err){
                    res.status(500).json({error: 'database error'})
                }
            })
        } catch (error) {
            res.status(500).json({error: 'unexpected server error'})
        }
    } else {
        res.status(400).json({error: 'inadequate parameters'})
    }
}

export const verifyItem = async (req:ReqWithAcst,res:Response) => {

    const {product_id, type} = req.params
    const userId = req.userId

    const paramsAreValid = typeof product_id === "string" &&
                           validator.isNumeric(product_id) &&
                           typeof type === 'string' &&
                           validator.isAlphanumeric(type)

    if (paramsAreValid && userId) {

        try {
            const sanitizedType = validator.escape(type) as ProductType
            const sanitizedProductId = parseInt(product_id)

            Cart.getOneItem(sanitizedProductId, userId, sanitizedType, (err,item) => {

                if (err) {
                    res.status(500).json({error: 'database error'})
                }
                if (item) {
                    res.status(200).json({available: true})
                }
                if (!item && !err) {
                    res.status(200).json({available: false})
                }

            })
        } catch (error) {
            res.status(500).json({error: 'unexpected server error'})
        }
    } else {
        res.status(400).json({error: 'inadequate parameters'})
    }
}

