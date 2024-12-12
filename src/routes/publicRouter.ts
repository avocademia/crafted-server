import express from "express"
import { getAllProducts } from "../controllers/products"

const publicRouter = express.Router()

publicRouter.get('/shop', getAllProducts)

export default publicRouter