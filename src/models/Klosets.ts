import { MysqlError } from 'mysql'
import db from '../config/db'
import { CreateKlosetData, KlosetData, RawKlosetData } from '../types'

export const Kloset = {

    create: (klosetData:CreateKlosetData, callback:(err:MysqlError|null, kloset:KlosetData|null) => void) => {
        const sql = `INSERT INTO kloset 
        (name,slogan,address,type,category,
        delivery,user_id,dp,delivery_time,active,status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`

        db.query(sql, [
            klosetData.name,
            klosetData.slogan,
            klosetData.address,
            klosetData.type,
            klosetData.category,
            klosetData.delivery,
            klosetData.user_id,
            klosetData.dp || null,
            klosetData.delivery_time || 7,
            klosetData.active || false,
            klosetData.status || 'pending'
        ], (err,res) => {
            if (err) return callback(err,null)

            const id = res.insertId
            const query = `SELECT * FROM kloset WHERE id = ?`

            db.query(query, [id], (err,kloset) => {
                if (err) return callback(err,null)
                    return callback(null,kloset[0])
            })
        })
    },

    findKlosetById: (id:number, callback:(err:MysqlError|null, kloset:KlosetData|null) => void) => {
        const sql = `SELECT * FROM kloset WHERE id=?`

        db.query(sql, [id], (err,kloset) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,kloset)
        })
    },

    findKlosetsByUserId: (userId:number, callback:(err:MysqlError|null, kloset:KlosetData[]|null) => void) => {
        const sql = `
                        SELECT k.*, 
                        (
                            SELECT GROUP_CONCAT(CONCAT_WS(':', kf.user_id, u.username) SEPARATOR ', ')
                            FROM kloset_followers kf
                            JOIN users u ON kf.user_id = u.id
                            WHERE kf.kloset_id = k.id
                        ) AS followers
                        FROM kloset k 
                        WHERE k.user_id = ?
                    `
    
        db.query(sql, [userId], (err,klosets:KlosetData[]|null) => {
            if (err|| !klosets) {
                return callback (err,null)
            } else {
                    /*klosets.forEach(kloset => {

                        if (typeof kloset.followers === 'string') {
                            kloset.followers = kloset.followers ? kloset.followers.split(', ').map(f => {
                            const [followerId, username] = f.split(':')
                            return { followerId, username }
                            }) : []
                            return callback(null, klosets)
                        }
                        
                    })*/
                    return callback(null, klosets)
            }    
        })
    },

    getAllKlosets: (callback:(err: MysqlError|null, klosets: KlosetData[]|null)=>void) => {

        const sql = `SELECT k.*,
                     GROUP_CONCAT(DISTINCT kf.user_id) AS followers
                     FROM kloset k
                     LEFT JOIN kloset_followers kf ON k.id = kf.kloset_id
                     GROUP BY k.id
                    `
        
        db.query(sql, (err,klosets:RawKlosetData[]|null) => {
            if (err) {
                callback(err,null)
            }

            if (klosets) {
                const finalKlosets = klosets.map(kloset => ({
                    ...kloset,
                    followers: typeof kloset.followers ==='string'? kloset.followers.split(','):null
                }))
                callback(null,finalKlosets)
            }
            
        })
    }
}