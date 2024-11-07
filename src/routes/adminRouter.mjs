import express from "express"
import { uploadKlosetDp } from "../services/upLoadKlosetDp.mjs"
import { verifyTokens } from "../services/verifyTokens.mjs"
import { createKloset, fetchSingleKloset, klosetsByUserId } from "../controllers/klosets.mjs"
import { 
         changeRole, 
         fetchUsers, 
         isFirstAdmin 
        } from "../controllers/user.mjs"
import { addProduct,
         sendProductPath,
         deleteDigitalProduct, 
         getProductsByKloset,
         getSingleProduct
        } from "../controllers/products.mjs"
import { uploadDigitalFile } from "../services/uploadDigitalFile.mjs"
import { uploadProductPhotos } from "../services/uploadProductPhotos.mjs"

export const adminRouter = express.Router()

adminRouter.post('/add-kloset', verifyTokens, (req,res,next) => {
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
adminRouter.post('/kloset/:id/add-product',verifyTokens, (req,res,next) => {

    uploadProductPhotos(req, res, (err) => {
        if (err) {
            return res.status(500).json({message: `The message ${err.message}`})
        }
        next() 
    })
}, addProduct)
adminRouter.get('/kloset/:kloset_id&:type/products', verifyTokens, getProductsByKloset)
adminRouter.get('/:product_id&:type', verifyTokens, getSingleProduct)
adminRouter.post('/save-digital-product',verifyTokens, (req,res,next) => {
    
        uploadDigitalFile(req, res, (err) => {
            if (err) {
                return res.status(500).json({message: `${err.message}`})
            }
            next()
        })
}, sendProductPath )
adminRouter.post('/delete-digital-product',verifyTokens, deleteDigitalProduct)