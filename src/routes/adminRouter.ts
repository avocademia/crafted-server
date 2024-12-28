import express, { NextFunction } from "express"
import { Request, Response } from "express"
import { uploadKlosetDp } from "../services/upLoadKlosetDp"
import { verifyTokens } from "../services/verifyTokens"
import { 
         createKloset, 
         fetchSingleKloset, 
         klosetsByUserId 
       } from "../controllers/klosets"
import { 
         changeRole, 
         fetchUsers, 
         isFirstAdmin 
       } from "../controllers/user"
import {
         addProduct,
         sendProductPath,
         deleteDigitalProduct, 
         getProductsByKloset,
         getSingleProduct,
         updateProduct
       } from "../controllers/products"
import { uploadDigitalFile } from "../services/uploadDigitalFile"
import { uploadProductPhotos } from "../services/uploadProductPhotos"

const adminRouter = express.Router()

adminRouter.post('/add-kloset', verifyTokens, (req:Request,res:Response,next:NextFunction) => {
    uploadKlosetDp(req, res, (err) => {
        if (err) {
            return res.status(500).json({message: `${err.message}`})
        }
        next()
    })
}, createKloset)

adminRouter.get('/fetch-users', verifyTokens, fetchUsers)
adminRouter.get('/verify-first-admin', verifyTokens, isFirstAdmin)
adminRouter.post(`/change-role`, verifyTokens, changeRole)
adminRouter.get('/fetch-klosets', verifyTokens, klosetsByUserId)
adminRouter.get('/kloset/:id', verifyTokens, fetchSingleKloset)
adminRouter.post('/kloset/:id/add-product',verifyTokens, (req:Request,res:Response,next:NextFunction) => {

    uploadProductPhotos(req, res, (err) => {
        if (err) {
            return res.status(500).json({message: `The message ${err.message}`})
        }
        next() 
    })
}, addProduct)
adminRouter.get('/kloset/:kloset_id&:type/products', verifyTokens, getProductsByKloset)
adminRouter.get('/:product_id&:type', verifyTokens, getSingleProduct)
adminRouter.patch('/:product_id&:type', verifyTokens, updateProduct)
adminRouter.post('/save-digital-product',verifyTokens, (req:Request,res:Response,next:NextFunction) => {
    
        uploadDigitalFile(req, res, (err) => {
            if (err) {
                return res.status(500).json({message: `${err.message}`})
            }
            next()
        })
}, sendProductPath )
adminRouter.post('/delete-digital-product',verifyTokens, deleteDigitalProduct)

export default adminRouter