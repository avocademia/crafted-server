import { MysqlError } from 'mysql'
import db from '../config/db'
import { ProductType } from '../types'
import _default from 'validator'

export type ItemData = {
    user_id: number,
    product_id: number,
    product_name: string,
    quantity?: number,
    sold_out: boolean,
    active_status: boolean,
    cost: number,
    product_type: ProductType,
    item_quantity: number,
}

export const Cart = {
    add: (item_data:ItemData, callback:(err:MysqlError|null) => void) => {

        const sql = `INSERT INTO cart_items (
                        user_id,
                        product_id,
                        product_name,
                        quantity,
                        sold_out,
                        active_status,
                        cost,
                        product_type,
                        item_quantity
                     ) VALUES (?,?,?,?,?,?,?,?,?)`
    
        db.query(sql, [
            item_data.user_id,
            item_data.product_id,
            item_data.product_name,
            item_data.quantity,
            item_data.sold_out,
            item_data.active_status,
            item_data.cost,
            item_data.product_type,
            item_data.item_quantity
        ], (err) => {
            if (err) {
                return callback(err)
            }
        })

    },

    remove: (id:number, callback:(err: MysqlError|null) =>void) => {

        const sql = `DELETE FROM cart_items WHERE id = ?`

        db.query(sql, id, (err:MysqlError|null) => {
            if (err) {
                return callback(err)
            }
        })
    },

    updateQuantity: (quantity:number, id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE TABLE cart_items SET quantity = ? WHERE id = ?`

        db.query(sql, [quantity, id], (err) => {
            if (err) {
                return callback(err)
            }
        })
    },

    updateCost: (cost:number, id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE TABLE cart_items SET cost = ? WHERE id = ?`

        db.query(sql, [cost, id], (err) => {
            if (err) {
                return callback(err)
            }
        })
    },

    getOneItem: (product_id:number, user_id:number, product_type:ProductType ,callback:(err:MysqlError|null, item:ItemData|null)=>void) => {

        const sql = `SELECT * FROM cart_items WHERE 
                        product_id = ? AND 
                        user_id = ? AND 
                        product_type = ?
                    `
        
        db.query(sql, [product_id, user_id, product_type], (err, item) => {
            if(err) {
                return callback(err,null)
            }
            if (item){
                return callback(null,item[0])
            }
        })
    },

    getFullCart: (userId:number, callback:(err:MysqlError|null, items:ItemData[]|null)=>void) => {

        const sql = `SELECT * FROM cart_items WHERE user_id = ?`

        db.query(sql, userId, (err,items) => {
            if (err) {
                callback(err,null)
            }
            if (items) {
                callback(null,items)
            }
        })
    },
}