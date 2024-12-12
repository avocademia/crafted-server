import express from "express"
import { getAllProducts } from "../controllers/products"
import { getAllKlosets } from "../controllers/klosets"

const publicRouter = express.Router()

publicRouter.get('/shop', getAllProducts)
publicRouter.get('/klosets', getAllKlosets)

export default publicRouter