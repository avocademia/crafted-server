import validator from "validator"
import { Kloset } from "../models/Klosets"
import { RetailProducts, DigitalProducts, CustomProducts, Books } from "../models/Products"
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Response, Request } from "express"
import {KlosetStatus, RequestWithParams} from "../types"
import { stat } from "fs"

dotenv.config()

export const createKloset = async (req:Request ,res:Response) => {

    try {
        const {name,slogan,type,category,address,delivery,delivery_time,user_id} = req.body

    if (!name||!slogan||!type||!category||!address||!delivery||!delivery_time||!user_id) {
        res.status(400).json({error: "All fields are required"})
    }
    
    if (!name || !slogan || !type || !category || !address || !delivery || !delivery_time || !user_id) {
        res.status(400).json({ error: "All fields are required" });
    }

    if (type !== 'custom' && type !== 'retail' && type !== 'digital' && type !== 'books') {
        res.status(400).json({ error: 'Invalid type' });
    }
    
    if (category !== 'apparel' && category !== 'jewellery' && category !== 'decor' && category !== 'books' && category !== 'select' && category === undefined) {
        res.status(400).json({ error: 'Invalid category' })
    }
    const deliveryBoolean = delivery === 'true'
    const sanitizedName = validator.escape(name)
    const sanitizedSlogan = validator.escape(slogan)
    const sanitizedAddres = validator.escape(address)
    const displayPicture = req.file? `uploads/kloset-dps/${req.file.filename}`: null

    const klosetData = {
        name: sanitizedName,
        slogan: sanitizedSlogan,
        address: sanitizedAddres,
        type: type,
        category: category === 'select'? null: category,
        delivery: category === 'select'? false : deliveryBoolean,
        user_id: user_id,
        dp: displayPicture,
        delivery_time: category === 'select'? 1 : delivery_time,
        active: false,
        status: 'pending' as KlosetStatus
    }

    Kloset.create(klosetData, (err,kloset) => {
        if (err) {
            res.status(500).json({error: 'Error creating kloset'})
        }
        res.status(201).json({message: "Kloset successfully created", kloset})
    }) 
    } catch (error) {
        res.status(500).json({error: `unknown error occured creating kloset`})

    }
}

export const klosetsByUserId = async (req: Request, res: Response) => {
    const token: string = req.cookies?.accessToken
    const accessSecret = process.env.ACCESS_SECRET as Secret

    if (!token) {
        res.status(401).json({ error: "Unauthorized access" })
    }

    try {

        const decoded = jwt.verify(token, accessSecret) as JwtPayload
        const userId = decoded.id

        Kloset.findKlosetsByUserId(userId, (err, klosets) => {
            if (err) {
                res.status(500).json({ error: "Error fetching klosets" })
            }

            if (klosets) {
                res.status(200).json({ klosets })
            } else {
                res.status(404).json({ error: "No klosets found" })
            }
        })
    } catch (error) {
        res.status(400).json({ error: "Invalid token" })
    }
}

export const fetchSingleKloset = async (req:Request, res:Response) => {
    const {kloset_id} = req.params
    
    try {

        Kloset.findKlosetById(parseInt(kloset_id), (err, kloset) => {

            if (err) {
                res.status(500).json({error: err.message})
            }
            if (!kloset && !err) {
                res.status(404).json({error: 'kloset not found'})
            }
            if (kloset) {

                try {

                    if (kloset.type === 'retail') {

                        RetailProducts.getProductsByKloset(kloset.id, (err,products) => {
                
                            if (err) {
                                res.status(500).json({error: 'database error'})
                            }

                            if (products && !err) {
                                res.status(200).json({kloset, products})
                            }
                        })
                    }

                    if (kloset.type === 'custom') {

                        CustomProducts.getProductsByKloset(kloset.id, (err,products) => {
                
                            if (err) {
                                res.status(500).json({error: 'database error'})
                            }

                            if (products && !err) {
                                res.status(200).json({kloset, products})
                            }
                        })
                    }

                    if (kloset.type === 'digital') {

                        DigitalProducts.getProductsByKloset(kloset.id, (err,products) => {
                
                            if (err) {
                                res.status(500).json({error: 'database error'})
                            }

                            if (products) {
                                res.status(200).json({kloset, products})
                            }
                        })
                    }

                    if (kloset.type === 'books') {

                        Books.getBooksByKloset(kloset.id, (err,products) => {
                
                            if (err) {
                                res.status(500).json({error: 'database error'})
                            }

                            if (products) {
                                res.status(200).json({kloset, products})
                            }
                        })
                    }
                    
                } catch (error) {
                    res.status(500).json({error: 'unexpected error fetching products'})
                }
            } 
        })

    } catch (error) {
        res.status(500).json({error: `unknown error occured fetching kloset`})
    }
}

export const getAllKlosets = async (req:Request,res:Response) => {

    try {
        Kloset.getAllKlosets((err,klosets) => {
            if (err) {
                res.status(500).json({error: 'database error'})
            }
            if (klosets && !err) {
                res.status(200).json({klosets})
            }  
        })
    } catch (error) {
        res.status(500).json({error: 'unexprected server error'})
    }
}

export const updateKloset = async (req:Request,res:Response) => {

    const {field, value, kloset_id} = req.body

    const goodRequest = field && value && kloset_id ? true: false

        try {
            
            if (field === 'name') {

                Kloset.updateName(validator.escape(value), kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (field === 'slogan') {
                
                Kloset.updateSlogan(validator.escape(value), kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (field === 'address') {

                Kloset.updateAddress(validator.escape(value), kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: err.message})
                    }
                })
            }

            if (field === 'delivery' && validator.isBoolean(value)) {
                
                Kloset.updateDeliveryStatus(value, kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (field === 'active' && validator.isBoolean(value)) {

                Kloset.updateActiveStatus(value, kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'databse error'})
                    }
                })
            }

            if (field === 'delivery_time' && validator.isNumeric(value)) {
                
                Kloset.updateDeliveryTime(value, kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (field === 'status') {

                Kloset.updateStatus(validator.escape(value), kloset_id, (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

        } catch (error) {
            res.status(500).json({error: 'unexpected error'})
        }
}

export const updateKlosetBanner = async (req:RequestWithParams, res:Response) => {

    const {kloset_id} = req.params
    const {file} = req

    if (file && kloset_id && validator.isNumeric(kloset_id)) {
        const path = `uploads/kloset-banners/${file.filename}`

        try {

            Kloset.updateBanner(path, parseInt(kloset_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                } else {
                    res.status(200).json({path})
                }
            })

        } catch (error) {
            res.status(500).json({error: 'unexpected error'})
        }
    } else {
        res.status(400).json({error: 'bad request'})
    }
    
}

export const updateKlosetDP = async (req:RequestWithParams, res:Response) => {

    const {kloset_id} = req.params
    const {file} = req

    console.log(req.file)
    console.log(req.params)

    if (file && kloset_id && validator.isNumeric(kloset_id)) {
        const path = `uploads/kloset-dps/${file.filename}`

        try {

            Kloset.updateDP(path, parseInt(kloset_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                } else {
                    res.status(200).json(path)
                }
            })
            
        } catch (error) {
            res.status(500).json({error: 'unexpected error'})
        }
    } else {
        res.status(400).json({error: 'bad request'})
    }
    
}