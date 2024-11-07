import validator from "validator";
import { Kloset } from "../models/Klosets.mjs";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const createKloset = async (req,res) => {

    try {
        const {name,slogan,type,category,address,delivery,delivery_time,user_id} = req.body

    if (!name||!slogan||!type||!category||!address||!delivery||!delivery_time||!user_id) {
        return res.status(400).json({message: "All fields are required"})
    }
    
    if (!name || !slogan || !type || !category || !address || !delivery || !delivery_time || !user_id) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (type !== 'custom' && type !== 'retail' && type !== 'digital' && type !== 'books') {
        return res.status(400).json({ message: 'Invalid type' });
    }
    
    if (category !== 'apparel' && category !== 'jewellery' && category !== 'decor' && category !== 'books' && category !== 'select' && category === undefined) {
        return res.status(400).json({ message: 'Invalid category' })
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
        delivery: category === 'select'? 0 : deliveryBoolean,
        user_id: user_id,
        dp: displayPicture,
        delivery_time: category === 'select'? 1 : delivery_time,
        active: false,
        status: 'pending'
    }

    Kloset.create(klosetData, (err,kloset) => {
        if (err) {
            return res.status(500).json({message: 'Error creating kloset'})
        }
        return res.status(201).json({message: "Kloset successfully created", kloset})
    }) 
    } catch (error) {
        res.status(500).json({message: `${error.message}`})
    }
}

export const klosetsByUserId = async (req,res) => {
    const token = req.cookies?.accessToken
    const ACCESS_SECRET = process.env.ACCESS_SECRET

    if (!token) {
        return res.status(404).json({message: 'Unauthorised access'})
    }

    try {

        const decoded = jwt.verify(token, ACCESS_SECRET)
        const userId = decoded.id
        Kloset.findKlosetsByUserId(userId, (err, klosets) => {
            if (err) {
                return res.status(500).json({message: `${err.message}`})
            }
            return res.status(200).json({klosets: klosets})
        })

    } catch (error) {
        res.status(500).json({message: `${error.message}`})
    }
}

export const fetchSingleKloset = async (req,res) => {
    const {id} = req.params
    
    try {
        Kloset.findKlosetById(id, (err, kloset) => {
            if (err) {
                return res.status(500).jason({message: 'error fetching kloset'})
            }
            return res.status(200).json({kloset: kloset})
        })
    } catch (error) {
        res.status(500).json({message: `${error.message}`})
    }
}