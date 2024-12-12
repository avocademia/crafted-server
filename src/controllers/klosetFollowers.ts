import { KlosetFollowers } from "../models/KlosetFollowers";
import { Response } from "express";
import { ReqWithAcst } from "../types";

export const follow = async (req:ReqWithAcst, res:Response) => {

    const user_id = req.userId
    const {kloset_id} = req.body
    if (kloset_id && user_id) {
        try {
            KlosetFollowers.follow(user_id, parseInt(kloset_id), (err) => {
                if (err){
                    res.status(500).json({error: 'database error'})
                }
            })
        } catch (error) {
            res.status(500).json({error: 'unexpected error try again'})
        }
    }
}