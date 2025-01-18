import express, { NextFunction } from "express"
import { Request, Response } from "express"
import { uploadKlosetDp } from "../services/uploadKlosetDp"
import { uploadKlosetBanner } from "../services/uploadKlosetBanner"
import { verifyTokens } from "../services/verifyTokens"
import { 
         createKloset, 
         fetchSingleKloset, 
         klosetsByUserId, 
         updateKloset,
         updateKlosetBanner,
         updateKlosetDP
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
         updateProduct,
         addProductPhoto,
         deleteProductPhoto,
         deleteProduct
       } from "../controllers/products"
import { uploadDigitalFile } from "../services/uploadDigitalFile"
import { uploadProductPhotos } from "../services/uploadProductPhotos"
import { uploadSingleProductPhoto } from "../services/uploadSingleProductPhoto"

const adminRouter = express.Router()

adminRouter.post('/add-kloset', verifyTokens, (req:Request, res:Response, next:NextFunction) => {
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
adminRouter.get('/kloset/:kloset_id', verifyTokens, fetchSingleKloset)
adminRouter.patch('/kloset', verifyTokens, updateKloset)
adminRouter.patch('/kloset-banner/:kloset_id', verifyTokens, (req:Request, res:Response, next:NextFunction) => {
    uploadKlosetBanner(req,res, (err)=> {

        if (err) {
            res.status(500).json({error: 'unexpected error saving kloset banner'})
        }
        next()
    })
},updateKlosetBanner)
adminRouter.patch('/kloset-dp/:kloset_id', verifyTokens, (req:Request, res:Response, next:NextFunction) => {

    uploadKlosetDp(req, res, (err) => {
        if (err) {
            res.status(500).json({error: 'unexpected error saving displaying picture'})
        }
        next()
    })
}, updateKlosetDP)
adminRouter.post('/kloset/:kloset_id/add-product',verifyTokens, (req:Request, res:Response, next:NextFunction) => {

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
adminRouter.delete('/:product_id&:type', verifyTokens, deleteProduct)
adminRouter.post('/save-digital-product',verifyTokens, (req:Request,res:Response,next:NextFunction) => {
    
        uploadDigitalFile(req, res, (err) => {
            if (err) {
                return res.status(500).json({message: `${err.message}`})
            }
            next()
        })
}, sendProductPath )
adminRouter.post('/delete-digital-product',verifyTokens, deleteDigitalProduct)
adminRouter.post('/product-photo', verifyTokens, (req,res,next) => {

    uploadSingleProductPhoto (req,res, (err) => {
        if (err) {
            res.status(500).json({error: err.message})
        } else {
            next ()
        }
    })
}, addProductPhoto)
adminRouter.post('/product-photo/delete', verifyTokens, deleteProductPhoto)

export default adminRouter