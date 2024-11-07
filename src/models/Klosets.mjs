import db from '../config/db.mjs'

export const Kloset = {

    create: (klosetData, callback) => {
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

    findKlosetById: (id, callback) => {
        const sql = `SELECT * FROM kloset WHERE id=?`

        db.query(sql, [id], (err,kloset) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,kloset)
        })
    },

    findKlosetsByUserId: (userId, callback) => {
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
    
        db.query(sql, [userId], (err,res) => {
            if (err) {
                return callback (err,null)
            }

            res.forEach(kloset => {
                kloset.followers = kloset.followers ? kloset.followers.split(', ').map(f => {
                    const [followerId, username] = f.split(':')
                    return { followerId, username }
                }) : []
            })
            return callback(null,res)
        })
    },
}