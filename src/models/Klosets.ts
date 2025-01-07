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

                if (kloset && !err) {
                    return callback(null,kloset[0])
                }      
            })
        })
    },

    findKlosetById: (id:number, callback:(err:MysqlError|null, kloset:KlosetData|null) => void) => {
        const sql = `
                        SELECT k.*, 
                        GROUP_CONCAT(DISTINCT kf.user_id) AS followers
                        FROM kloset k 
                        LEFT JOIN kloset_followers kf ON k.id = kf.kloset_id
                        WHERE k.id = ?
                        GROUP BY k.id
                    `

        db.query(sql, [id], (err,kloset) => {
            if (err) {
                return callback(err,null)
            }

            
            if (kloset && !err) {
                const finalKloset:KlosetData[] = kloset.map((kloset:any)=> ({
                    ...kloset,
                    followers: typeof kloset.followers ==='string'? kloset.followers.split(','):null
                }))
                callback(null,finalKloset[0])
            }
        })
    },

    findKlosetsByUserId: (userId:number, callback:(err:MysqlError|null, kloset:KlosetData[]|null) => void) => {
        const sql = `
                        SELECT k.*, 
                        GROUP_CONCAT(DISTINCT kf.user_id) AS followers
                        FROM kloset k 
                        LEFT JOIN kloset_followers kf ON k.id = kf.kloset_id
                        WHERE k.user_id = ?
                        GROUP BY k.id

                    `
    
        db.query(sql, [userId], (err,klosets:RawKlosetData[]|null) => {
            if (err|| !klosets) {
                return callback (err,null)
            } 
            
            if (klosets && !err) {
                    const finalKloset = klosets.map (kloset => ({
                        ...kloset,
                        followers: kloset.followers? kloset.followers.split(',') : null,
                    }))
                    return callback(null, finalKloset)
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

            if (klosets && !err) {
                const finalKlosets = klosets.map(kloset => ({
                    ...kloset,
                    followers: typeof kloset.followers ==='string'? kloset.followers.split(','):null
                }))
                callback(null,finalKlosets)
            }
            
        })
    },

    updateName: (name:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET name =? WHERE id =?`

        db.query(sql, [name,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateSlogan: (slogan:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET slogan =? WHERE id =?`

        db.query(sql, [slogan,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateAddress: (address:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET addrress =? WHERE id =?`

        db.query(sql, [address,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
        
    },

    updateActiveStatus: (active:boolean, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET active_status =? WHERE id =?`

        db.query(sql, [active,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateDeliveryStatus: (delivery:boolean, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET active_status =? WHERE id =?`

        db.query(sql, [delivery,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateDeliveryTime: (delivery_time:number, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET delivery_time =? WHERE id =?`

        db.query(sql, [delivery_time,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateDP: (dp:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET dp =? WHERE id =?`

        db.query(sql, [dp,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateBanner: (banner:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET banner =? WHERE id =?`

        db.query(sql, [banner,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },

    updateStatus: (status:string, kloset_id:number, callback:(err:MysqlError|null) => void) => {

        const sql = `UPDATE kloset SET status = ? WHERE id = ?`

        db.query(sql, [status,kloset_id], (err) => {
            if (err) {
                return callback(err)
            }
            return
        })
    },
}