import db from '../config/db.mjs'

export const RetailProducts = {
    create: (productData, callback) => {
        const sql = `INSERT INTO retail_products 
        (name,description,cost,quantity,category,
        sub_category,product_condition,kloset_id)
        VALUES (?,?,?,?,?,?,?,?)`
        
        const {name, description, cost, quantity, category, sub_category, product_condition, kloset_id} = productData
        const values = [name, description, cost, quantity, category, sub_category, product_condition, kloset_id]

        db.query(sql, values, (err,product) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,product)
        })
    },

    getAllProducts: (callback) => {
        const sql = `SELECT rp.*, pp.path AS photo_path
                     FROM retail_products rp
                     LEFT JOIN product_photos pp ON rp.id == pp.product_id
                     WHERE pp.product_type = 'retail'
                    `
        
        db.query(sql, (err,result) => {
            if (err) {
                return callback(err,null)
            }

            const products = result.reduce((acc,row) => {
                const {
                    id,name,description,cost,
                    quantity,category,sub_category,
                    kloset_id,product_condition,sold_out,
                    photo_path
                } = row

                if (!acc[id]) {
                    acc[id] = {id,name,description,cost,
                        quantity,category,sub_category,
                        kloset_id,product_condition,sold_out,
                        photos: []}
                }

                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getProductsByKloset: (kloset_id,callback) => {
        const sql = `SELECT rp.*, pp.path AS photo_path
                     FROM retail_products rp
                     LEFT JOIN product_photos pp ON rp.id = pp.product_id
                     WHERE rp.kloset_id =? AND pp.product_type = 'retail'
                    `
        
        db.query(sql,[kloset_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }

            const products = result.reduce((acc,row) => {
                const {
                    id,name,description,cost,
                    quantity,category,sub_category,
                    kloset_id,product_condition,sold_out,
                    photo_path
                } = row

                if (!acc[id]) {
                    acc[id] = {id,name,description,cost,
                        quantity,category,sub_category,
                        kloset_id,product_condition,sold_out,
                        photos: []}
                }

                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id, callback) => {

        const sql = `SELECT rp.*, pp.path AS photo_path
                     FROM retail_products rp
                     LEFT JOIN product_photos pp ON rp.id = pp.product_id
                     WHERE rp.id =? AND pp.product_type = 'retail'
                    `

        db.query(sql,[product_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            
            const product = result.reduce((acc,row) => {
                const {
                    id, name, description, cost,
                    quantity, category, sub_category,
                    kloset_id, product_condition, sold_out,
                    photo_path
                    } = row
            
                if (!acc[id]) {
                    acc[id] = {id, name, description, cost,
                        quantity, category, sub_category,
                        kloset_id, product_condition, sold_out,
                        photos: []}
                }
            
                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})
            
            return callback(err,product)
        })
    }
}

export const CustomProducts = {
    create: (productData, callback) => {
        const sql = `INSERT INTO custom_products (
            name,
            cost,
            category,
            sub_category,
            description,
            production_time,
            kloset_id
        ) VALUES (?,?,?,?,?,?,?)`

        const {name,cost,category,sub_category,description,production_time, kloset_id} = productData
        const values = [name,cost,category,sub_category,description,production_time,kloset_id]

        db.query(sql, values, (err,product) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,product)
        })
    },

    getProductsByKloset: (kloset_id,callback) => {
        const sql = `SELECT cp.*, pp.path AS photo_path
                     FROM custom_products cp
                     LEFT JOIN product_photos pp ON cp.id = pp.product_id
                     WHERE cp.kloset_id =? AND pp.product_type = 'custom'
                    `
        
        db.query(sql,[kloset_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }

            const products = result.reduce((acc,row) => {
                const {
                    id,name,description,cost,
                    production_time,category,sub_category,
                    kloset_id,active,
                    photo_path
                } = row

                if (!acc[id]) {
                    acc[id] = {id,name,description,cost,
                        production_time,category,sub_category,
                        kloset_id,active,
                        photos: []}
                }

                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id, callback) => {

        const sql = `SELECT cp.*, pp.path AS photo_path
                     FROM custom_products cp
                     LEFT JOIN product_photos pp ON cp.id = pp.product_id
                     WHERE cp.id =? AND pp.product_type = 'custom'
                    `

        db.query(sql,[product_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            
            const product = result.reduce((acc,row) => {
                const {
                    id, name, description, cost,
                    production_time, category, sub_category,
                    kloset_id, active,
                    photo_path
                } = row
            
                if (!acc[id]) {
                    acc[id] = {id, name, description, cost,
                        production_time, category, sub_category,
                        kloset_id, active,
                        photos: []}
                }
            
                if (photo_path) {
                acc[id].photos.push(photo_path)
                }
                return acc
            }, {})
            
            return callback(err,product)
        })
    }
}

export const DigitalProducts = {
    create: (productData, callback) => {
        const disableFK = 'SET FOREIGN_KEY_CHECKS=0'
        const enableFK = 'SET FOREIGN_KEY_CHECKS=1'
        const insertSql = `
            INSERT INTO digital_products (
                name,
                cost,
                path,
                description,
                kloset_id
            ) VALUES (?, ?, ?, ?, ?)
        `

        const { name, description, cost, kloset_id, path } = productData
        const values = [name, cost, path, description, kloset_id]

        db.query(disableFK, (err) => {
            if (err) return callback(err, null)

            db.query(insertSql, values, (insertErr, product) => {
                if (insertErr) {
                    db.query(enableFK)
                    return callback(insertErr, null)
                }

                db.query(enableFK, (fkErr) => {
                    if (fkErr) return callback(fkErr, null)
                    return callback(null, product)
                })
            })
        })
    },

    getProductsByKloset: (kloset_id,callback) => {
        const sql = `SELECT dp.*, pp.path AS photo_path
                     FROM digital_products dp
                     LEFT JOIN product_photos pp ON dp.id = pp.product_id
                     WHERE dp.kloset_id =? AND pp.product_type = 'digital'
                    `
        
        db.query(sql,[kloset_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }

            const products = result.reduce((acc,row) => {
                const {
                    id,name,description,cost,
                    kloset_id,active,path,
                    photo_path
                } = row

                if (!acc[id]) {
                    acc[id] = {
                        id,name,description,cost,
                        kloset_id,path,active,
                        photos: []}
                }

                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id, callback) => {

        const sql = `SELECT dp.*, pp.path AS photo_path
                     FROM digital_products dp
                     LEFT JOIN product_photos pp ON dp.id = pp.product_id
                     WHERE dp.id =? AND pp.product_type = 'digital'
                    `

        db.query(sql,[product_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            
            const product = result.reduce((acc,row) => {
                const {
                    id,name,description,cost,
                    kloset_id,active,path,
                    photo_path
                } = row
            
                if (!acc[id]) {
                    acc[id] = {
                        id,name,description,cost,
                        kloset_id,path,active,
                        photos: []}
                }
            
                if (photo_path) {
                    acc[id].photos.push(photo_path)
                }
                return acc
            }, {})
            
            return callback(err,product)
        })
    }
}

export const Books = {
    create: (productData, callback) => {
        const sql = `INSERT INTO books (
                        name,
                        author,
                        summary,
                        cost,
                        quantity,
                        book_condition,
                        kloset_id
                    ) VALUES (?,?,?,?,?,?,?)`
        
        const {name,author,summary,cost,quantity,book_condition,kloset_id} = productData
        const values = [name,author,summary,cost,quantity,book_condition,kloset_id]
            
        db.query(sql, values, (err,product) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,product)
        })
    },

    getBooksByKloset: (kloset_id, callback) => {

        const sql = `SELECT b.*, pp.path AS photo_path, bg.genre AS genre
                     FROM books b
                     LEFT JOIN book_genres bg on b.id = bg.book
                     LEFT JOIN product_photos pp ON b.id = pp.product_id
                     WHERE b.kloset_id = ? AND pp.product_type = 'books'
                     `
        
        db.query(sql,[kloset_id], (err,result) => {
            if (err) {
            return callback(err,null)
            }
            
            const products = result.reduce((acc,row) => {
                const {
                    id,name,summary,cost,
                    kloset_id,sold_out,quantity,book_condition,
                    photo_path,genre
                } = row
            
                if (!acc[id]) {
                    acc[id] = {
                        id,name,summary,cost,
                        kloset_id,quantity,sold_out,book_condition,
                        photos: [],genres: []}
                }
            
                if (photo_path && genre) {
                    acc[id].photos.push(photo_path)
                    acc[id].genres.push(genre)
                }
                return acc
            }, {})
            
            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleBook: (product_id, callback) => {

        const sql = `SELECT b.*, pp.path AS photo_path, bg.genre AS genre
                     FROM books b
                     LEFT JOIN book_genres bg on b.id = bg.book
                     LEFT JOIN product_photos pp ON b.id = pp.product_id
                     WHERE b.id = ? AND pp.product_type = 'books'
                     `

         db.query(sql,[product_id], (err,result) => {
            if (err) {
                return callback(err,null)
            }
                        
            const book = result.reduce((acc,row) => {
            const {
                    id,name,summary,cost,
                    kloset_id,sold_out,quantity,book_condition,
                    photo_path,genre
                  } = row
                        
                if (!acc[id]) {
                    acc[id] = {
                        id,name,summary,cost,
                        kloset_id,quantity,sold_out,book_condition,
                        photos: [],genres: []}
                }
                        
                if (photo_path && genre) {
                    acc[id].photos.push(photo_path)
                    acc[id].genres.push(genre)
                }
                    return acc
                }, {})
                        
            return callback(err,book)
        })
    }
}

export const ProductPath = {

    create: (filePath, callback) => {
        const sql = `INSERT INTO product_path (path) VALUES (?)`

        db.query(sql, [filePath], (err,path) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,path)
        })
    },

    updateLinkStatus: (path,callback) => {
        const linked = true
        const sql = `UPDATE product_path 
        SET linked = ? WHERE path = ?`

        db.query(sql, [linked, path], (err,path) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,path)
        })
    },

    delete: (path,callback) => {
        const sql = `DELETE FROM product_path WHERE path = ?`

        console.log('path', path)

        db.query(sql, [path], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,result)
        })
    }
}

export const ProductPhotos = {
    
    addMultiple: (photos, callback) => {
        const sql = `INSERT INTO product_photos (
                        product_id,
                        product_type,
                        path
                    ) VALUES ?`

        const values = photos.map(photo => [photo.product_id, photo.product_type, photo.path])
        db.query(sql, [values], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,result)
        })
    }
}

export const BookGenres = {
    addMultiple: (mappedGenres, callback) => {
        const sql = `INSERT INTO book_genres (genre,book) VALUES ?`
        
        const values = mappedGenres.map(genre => [genre.value,genre.book])
        db.query(sql, [values], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,result)
        })
    }
}