import express from "express"
import { getAllProducts, getSingleProduct } from "../controllers/products"
import { fetchSingleKloset, getAllKlosets } from "../controllers/klosets"

const publicRouter = express.Router()

publicRouter.get('/shop', getAllProducts)
publicRouter.get('/klosets', getAllKlosets)
publicRouter.get('/product/:product_id&:type', getSingleProduct)
publicRouter.get('/kloset/:id', fetchSingleKloset)

export default publicRouter