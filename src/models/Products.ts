import { MysqlError } from 'mysql'
import db from '../config/db'
import { Category, ProductCondition, ProductPathData, ProductType } from '../types'

export interface CreateProductData {
    kloset_id?: number,
    name?: string,
    description?: string,
    cost?: number,
    active?: boolean,
    path?: string,
    production_time?: number,
    category?: Category,
    sub_category?: string,
    genre?: string,
    author?: string,
    summary?: string,
    quantity?: number,
    sold_out?: boolean,
    book_condition?: ProductCondition,
    product_condition?: ProductCondition,
}
export interface RawRP {
    id: number;
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    sold_out: boolean,
    quantity: number,
    photos: string,
    category: Category|null,
    sub_category: string,
    product_condition: ProductCondition
}
export interface FinalRP {
    insertId?: number,
    id: number,
    name: string,
    description: string,
    cost: number,
    quantity: number,
    category: Category|null,
    sub_category: string,
    kloset_id: number,
    product_condition: ProductCondition,
    sold_out: boolean,
    photos: string[],
    type: ProductType
}
export interface RawCP {
    id: number;
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    active: boolean,
    production_time: number,
    photos: string,
    category: Category|null,
    sub_category: string
}
export interface FinalCP {
    insertId?: number,
    id: number,
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    production_time: number,
    active: boolean,
    category: Category|null,
    sub_category: string,
    photos: string[],
    type: ProductType
}
export interface RawDP {
    id: number;
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    active: boolean,
    path: string,
    photos: string
}
export interface FinalDP {
    insertId?: number,
    id: number,
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    active: boolean,
    path: string,
    photos: string[],
    type: ProductType
}
export interface RawBook  {
    id: number;
    kloset_id: number;
    name: string;
    summary: string;
    cost: number;
    quantity: number;
    sold_out: boolean;
    book_condition: ProductCondition;
    author: string;
    photos: string;
    genre: string;
}
export interface FinalBook {
    insertId?: number,
    id: number,
    kloset_id: number,
    name: string,
    summary: string,
    cost: number,
    quantity: number,
    sold_out: boolean,
    book_condition: ProductCondition,
    author: string,
    photos: string[],
    genre: string[],
    type: ProductType
}
export interface ProductPhotos {
    id?: number,
    product_id?: number,
    product_type: ProductType,
    path: string
}
export interface GenreTable {
    value: string,
    book?: number
}


export const RetailProducts = {
    
    create: (productData: CreateProductData, callback:(err:MysqlError|null, product: FinalRP|null) => void) => {
        const sql = `INSERT INTO retail_products 
        (name,description,cost,quantity,category,
        sub_category,product_condition,kloset_id)
        VALUES (?,?,?,?,?,?,?,?)`
        
        const {name, description, cost, quantity, category, sub_category, product_condition, kloset_id} = productData
        const values = [name, description, cost, quantity, category, sub_category, product_condition, kloset_id]

        db.query(sql, values, (err,product) => {
            if (err) {
                return callback(err, null)
            }

            if (product) {
                return callback(null,product)
            }
        })
    },

    getProductsByKloset: (kloset_id:number, callback:(err:MysqlError|null, products:FinalRP[]|null) => void) => {
        const sql = `SELECT rp.*, pp.path AS photos
                     FROM retail_products rp
                     LEFT JOIN product_photos pp ON rp.id = pp.product_id
                     WHERE rp.kloset_id =? AND pp.product_type = 'retail'
                    `
        
        db.query(sql,[kloset_id], (err,result:RawRP[]) => {
            if (err) {
                return callback(err,null)
            }

            const productWithType = result.map(product => ({
                ...product,
                type: 'retail' as ProductType
            }))

            const products = productWithType.reduce<Record<number, FinalRP>>((acc,row) => {
                const {
                    id,name,description,cost,
                    quantity,category,sub_category,
                    kloset_id,product_condition,sold_out,
                    photos,type
                } = row

                if (!id || !category) {
                    return acc
                }

                if (!acc[id]) {
                    acc[id] = {id,name,description,cost,
                        quantity,category,sub_category,
                        kloset_id,product_condition,sold_out,type,
                        photos: []}
                }

                if (photos) {
                    acc[id].photos.push(photos)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id: number, callback: (err: MysqlError | null, product: FinalRP | null) => void) => {
        const sql = `
            SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.sold_out, p.quantity,p.category, p.sub_category,p.product_condition, 
            GROUP_CONCAT(DISTINCT pp.path) AS photos 
            FROM retail_products p
            LEFT JOIN product_photos pp ON p.id = pp.product_id
            WHERE p.id = ? AND pp.product_type = 'retail'
            GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.quantity, p.sold_out, p.category, p.sub_category, p.product_condition
        `
    
        db.query(sql, [product_id], (err: MysqlError | null, result: RawRP[] | null) => {
            if (err || !result) {
                return callback(err, null);
            }
    
            const retailProduct = result[0]

            const finalRP: FinalRP= {
                id: retailProduct.id,
                name: retailProduct.name,
                description: retailProduct.description,
                cost: retailProduct.cost,
                kloset_id: retailProduct.kloset_id,
                sold_out: retailProduct.sold_out? true: false,
                photos: retailProduct.photos ? retailProduct.photos.split(',') : [], 
                quantity: retailProduct.quantity,
                sub_category: retailProduct.sub_category,
                category: retailProduct.category,
                product_condition: retailProduct.product_condition,
                type: 'retail' as ProductType
            }
            callback(null,finalRP)
        })
    },

    getAllProducts: (callback:(err: MysqlError|null, product: FinalRP[]|null) => void)   => {

        const sql = `
                    SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.sold_out, p.quantity,p.category, p.sub_category,p.product_condition, 
                    GROUP_CONCAT(DISTINCT pp.path) AS photos 
                    FROM retail_products p
                    LEFT JOIN product_photos pp ON p.id = pp.product_id
                    WHERE pp.product_type = 'retail'
                    GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.quantity, p.sold_out, p.category, p.sub_category, p.product_condition
                    `
        
        db.query(sql, (err: MysqlError|null, rawProducts: RawRP[]|null) => {
            if (err) {
                return callback(err,null)
            }

            if (rawProducts) {
               const finalProducts:FinalRP[] = rawProducts?.map(product => ({
                    ...product,
                    type: 'retail' as ProductType,
                    photos: product.photos.split(',')
                })) 

                return callback(null, finalProducts)
            }
        })
    },

    updateName : (name:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET name = ? WHERE id = ?`

        db.query(sql, [name,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateDescription : (description:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET description = ? WHERE id = ?`

        db.query(sql, [description,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateCost : (cost:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET cost = ? WHERE id = ?`

        db.query(sql, [cost,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateSubCategory : (sub_category:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET sub_category = ? WHERE id = ?`

        db.query(sql, [sub_category,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateQuantity : (quantity:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET quantity = ? WHERE id = ?`

        db.query(sql, [quantity,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },
}

export const CustomProducts = {
    create: (productData: CreateProductData, callback:(err:MysqlError|null, product:FinalCP|null) => void) => {
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

    getProductsByKloset: (kloset_id:number, callback:(err:MysqlError|null, product:FinalCP[]|null) => void)=> {
        const sql = `SELECT cp.*, pp.path AS photos
                     FROM custom_products cp
                     LEFT JOIN product_photos pp ON cp.id = pp.product_id
                     WHERE cp.kloset_id =? AND pp.product_type = 'custom'
                    `
        
        db.query(sql,[kloset_id], (err,result:RawCP[]) => {
            if (err) {
                return callback(err,null)
            }

            const productWithType = result.map (product => ({
                ...product,
                type: 'custom' as ProductType
            }))

            const products = productWithType.reduce<Record<number, FinalCP>>((acc,row) => {
                const {
                    id,name,description,cost,
                    production_time,category,sub_category,
                    kloset_id,active,
                    photos,type
                } = row

                if (!id) {
                    return acc
                }

                if (!acc[id]) {
                    acc[id] = {id,name,description,cost,
                        production_time,category,sub_category,
                        kloset_id,active,type,
                        photos: []}
                }

                if (photos) {
                    acc[id].photos.push(photos)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id: number, callback: (err: MysqlError | null, product: FinalCP | null) => void) => {
        const sql = `
            SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.active, p.production_time,p.category, p.sub_category, 
            GROUP_CONCAT(DISTINCT pp.path) AS photos 
            FROM custom_products p
            LEFT JOIN product_photos pp ON p.id = pp.product_id
            WHERE p.id = ? AND pp.product_type = 'custom'
            GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.production_time, p.active, p.category, p.sub_category
        `
    
        db.query(sql, [product_id], (err: MysqlError | null, result: RawCP[] | null) => {
            if (err || !result) {
                return callback(err, null);
            }
    
            const customProduct = result[0]

            const finalCP: FinalCP= {
                id: customProduct.id,
                name: customProduct.name,
                description: customProduct.description,
                cost: customProduct.cost,
                kloset_id: customProduct.kloset_id,
                active: customProduct.active? true: false,
                photos: customProduct.photos ? customProduct.photos.split(',') : [], 
                production_time: customProduct.production_time,
                sub_category: customProduct.sub_category,
                category: customProduct.category,
                type: 'custom' as ProductType
            }
            callback(null,finalCP)
        })
    } ,
    
    getAllProducts: (callback:(err: MysqlError|null, product: FinalCP[]|null) => void)   => {

        const sql = `
                    SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.active, p.production_time,p.category, p.sub_category, 
                    GROUP_CONCAT(DISTINCT pp.path) AS photos 
                    FROM custom_products p
                    LEFT JOIN product_photos pp ON p.id = pp.product_id
                    WHERE pp.product_type = 'custom'
                    GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.production_time, p.active, p.category, p.sub_category
                    `
        
        db.query(sql, (err: MysqlError|null, rawProducts: RawCP[]|null) => {
            if (err) {
                callback(err,null)
            }

            if (rawProducts) {
                const finalProducts:FinalCP[] = rawProducts?.map(product => ({
                     ...product,
                     type: 'custom',
                     photos: product.photos.split(',')
                 })) 
 
                 return callback(null, finalProducts)
             }
        })
    },

    updateName : (name:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET name = ? WHERE id = ?`

        db.query(sql, [name,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateDescription : (description:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET description = ? WHERE id = ?`

        db.query(sql, [description,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateCost : (cost:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET cost = ? WHERE id = ?`

        db.query(sql, [cost,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateCategory : (category:Category, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET category = ? WHERE id = ?`

        db.query(sql, [category,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateSubCategory : (sub_category:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET sub_category = ? WHERE id = ?`

        db.query(sql, [sub_category,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateActiveStatus : (active:boolean, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET active = ? WHERE id = ?`

        db.query(sql, [active,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateProductionTime : (production_time:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE custom_products SET production_time = ? WHERE id = ?`

        db.query(sql, [production_time,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },
}

export const DigitalProducts = {
    create: (productData: CreateProductData, callback:(err:MysqlError|null, product:FinalDP|null) => void) => {
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

    getProductsByKloset: (kloset_id:number, callback:(err:MysqlError|null, product:FinalDP[]|null) => void) => {
        const sql = `SELECT dp.*, pp.path AS photos
                     FROM digital_products dp
                     LEFT JOIN product_photos pp ON dp.id = pp.product_id
                     WHERE dp.kloset_id =? AND pp.product_type = 'digital'
                    `
        
        db.query(sql,[kloset_id], (err,result: RawDP[]) => {
            if (err) {
                return callback(err,null)
            }

            const productWithType = result.map(product => ({
                ...product,
                type: 'digital' as ProductType
            }))

            const products = productWithType.reduce<Record<number, FinalDP>>((acc,row) => {
                const {
                    id,name,description,cost,
                    kloset_id,active,path,
                    photos,type,
                } = row

                if (!id) {
                    return acc
                }

                if (!acc[id]) {
                    acc[id] = {
                        id,name,description,cost,
                        kloset_id,path,active,type,
                        photos: []}
                }

                if (photos) {
                    acc[id].photos.push(photos)
                }
                return acc
            }, {})

            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleProduct: (product_id: number, callback: (err: MysqlError | null, product: FinalDP | null) => void) => {
        const sql = `
            SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.active, p.path, 
            GROUP_CONCAT(DISTINCT pp.path) AS photos 
            FROM digital_products p
            LEFT JOIN product_photos pp ON p.id = pp.product_id
            WHERE p.id = ? AND pp.product_type = 'digital'
            GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
            p.path, p.active
        `

        db.query(sql, [product_id], (err: MysqlError | null, result: RawDP[] | null) => {
            if (err || !result) {
                return callback(err, null);
            }
    
            const digitalProduct = result[0]

            const finalDP: FinalDP= {
                id: digitalProduct.id,
                name: digitalProduct.name,
                description: digitalProduct.description,
                cost: digitalProduct.cost,
                kloset_id: digitalProduct.kloset_id,
                active: digitalProduct.active? true: false,
                photos: digitalProduct.photos ? digitalProduct.photos.split(',') : [], 
                path: digitalProduct.path,
                type: 'digital'
            }
            callback(null,finalDP)
        })
    },
    
    getAllProducts: (callback:(err: MysqlError|null, product: FinalDP[]|null) => void)   => {

        const sql = `
                    SELECT p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.active, p.path, 
                    GROUP_CONCAT(DISTINCT pp.path) AS photos 
                    FROM digital_products p
                    LEFT JOIN product_photos pp ON p.id = pp.product_id
                    WHERE pp.product_type = 'digital'
                    GROUP BY p.id, p.name, p.description, p.cost, p.kloset_id, 
                    p.active, p.path
                    `
        
        db.query(sql, (err: MysqlError|null, rawProducts: RawDP[]|null) => {
            if (err) {
                callback(err,null)
            }

            if (rawProducts) {
                const finalProducts:FinalDP[] = rawProducts?.map(product => ({
                     ...product,
                     type: 'digital',
                     photos: product.photos.split(',')
                 })) 
 
                 return callback(null, finalProducts)
             }
        })
    },

    updateName : (name:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE digital_products SET name = ? WHERE id = ?`

        db.query(sql, [name,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateDescription : (description:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE digital_products SET description = ? WHERE id = ?`

        db.query(sql, [description,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateCost : (cost:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE digital_products SET cost = ? WHERE id = ?`

        db.query(sql, [cost,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updatePath : (path:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE digital_products SET path = ? WHERE id = ?`

        db.query(sql, [path,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateActiveStatus : (active:boolean, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE digital_products SET active = ? WHERE id = ?`

        db.query(sql, [active,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },
}

export const Books = {
    create: (productData: CreateProductData, callback:(err:MysqlError|null, product:FinalBook|null) => void) => {
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
            
        db.query(sql, values, (err:MysqlError|null,product:FinalBook|null) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,product)
        })
    },

    getBooksByKloset: (kloset_id:number, callback:(err:MysqlError|null, product:FinalBook[]|null) => void) => {

        const sql = `SELECT b.*, pp.path AS photos, bg.genre AS genre
                     FROM books b
                     LEFT JOIN book_genres bg on b.id = bg.book
                     LEFT JOIN product_photos pp ON b.id = pp.product_id
                     WHERE b.kloset_id = ? AND pp.product_type = 'books'
                     `
        
        db.query(sql,[kloset_id], (err,result:RawBook[]) => {
            if (err) {
            return callback(err,null)
            }

            const booksWithType = result.map(book => ({
                ...book,
                type: 'books' as ProductType
            }))
            
            const products = booksWithType.reduce<Record<number, FinalBook>>((acc,row) => {
                const {
                    id,name,author, summary,cost,
                    kloset_id,sold_out,quantity,book_condition,
                    photos,genre,type
                } = row

                if (!id) {
                    return acc
                }
            
                if (!acc[id]) {
                    acc[id] = {
                        id,name,author,summary,cost,
                        kloset_id,quantity,sold_out,book_condition,type,
                        photos: [],genre: []}
                }

                if (photos && genre) {
                    acc[id].photos.push(photos)
                    acc[id].genre.push(genre)
                }
                return acc
            }, {})
            
            const productList = Object.values(products)
            return callback(err,productList)
        })
    },

    getSingleBook: (product_id: number, callback: (err: MysqlError | null, product: FinalBook | null) => void) => {
        const sql = `
            SELECT b.id, b.name, b.author, b.summary, b.cost, b.kloset_id, 
            b.quantity, b.sold_out, b.book_condition, 
            GROUP_CONCAT(DISTINCT pp.path) AS photos, 
            GROUP_CONCAT(DISTINCT bg.genre) AS genre
            FROM books b
            LEFT JOIN book_genres bg ON b.id = bg.book
            LEFT JOIN product_photos pp ON b.id = pp.product_id
            WHERE b.id = ? AND pp.product_type = 'books'
            GROUP BY b.id, b.name, b.author, b.summary, b.cost, b.kloset_id, 
            b.quantity, b.sold_out, b.book_condition
        `
    
        db.query(sql, [product_id], (err: MysqlError | null, result: RawBook[] | null) => {
            if (err || !result) {
                return callback(err, null);
            }
    
            const book = result[0]

            const finalBook: FinalBook = {
                id: book.id,
                name: book.name,
                author: book.author,
                summary: book.summary,
                cost: book.cost,
                kloset_id: book.kloset_id,
                quantity: book.quantity,
                sold_out: book.sold_out,
                book_condition: book.book_condition,
                photos: book.photos ? book.photos.split(',') : [],  
                genre: book.genre ? book.genre.split(',') : [],
                type: 'books'
            }
            callback(null,finalBook)
            
        })
    },
    
    getAllProducts: (callback:(err: MysqlError|null, product: FinalBook[]|null) => void)   => {

        const sql = `
                    SELECT b.id, b.name, b.author, b.summary, b.cost, b.kloset_id, 
                    b.sold_out, b.book_condition, b.quantity, 
                    GROUP_CONCAT(DISTINCT pp.path) AS photos ,
                    GROUP_CONCAT(DISTINCT bg.genre) AS genre
                    FROM books b
                    LEFT JOIN product_photos pp ON b.id = pp.product_id
                    LEFT JOIN book_genres bg ON b.id = bg.book
                    WHERE pp.product_type = 'books'
                    GROUP BY b.id, b.name, b.author, b.summary, b.cost, b.kloset_id, 
                    b.sold_out, b.book_condition, b.quantity
                    `
        
        db.query(sql, (err: MysqlError|null, rawProducts: RawBook[]|null) => {
            if (err) {
                callback(err,null)
            }

            if (rawProducts) {
                const finalProducts:FinalBook[] = rawProducts?.map(product => ({
                     ...product,
                     type: 'books',
                     genre: product.genre.split(','),
                     photos: product.photos.split(',')
                 })) 
                 return callback(null, finalProducts)
             }
        })
    },

    updateName : (name:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE books SET name = ? WHERE id = ?`

        db.query(sql, [name,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateAuthor : (author:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE books SET author = ? WHERE id = ?`

        db.query(sql, [author,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateQuantity : (quantity:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE retail_products SET quantity = ? WHERE id = ?`

        db.query(sql, [quantity,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateSummary : (summary:string, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE books SET summary = ? WHERE id = ?`

        db.query(sql, [summary,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },

    updateCost : (cost:number, id:number, callback:(err:MysqlError|null)=>void) => {
        const sql = `UPDATE books SET cost = ? WHERE id = ?`

        db.query(sql, [cost,id], (err) => {
            if (err) {
                return callback(err);
            }
        })
    },
}

export const ProductPath = {

    create: (filePath:string,  callback:(err:MysqlError|null, product:ProductPathData|null) => void) => {
        const sql = `INSERT INTO product_path (path) VALUES (?)`

        db.query(sql, [filePath], (err,path) => {
            if (err) {
                return callback(err,null)
            }
            return callback(null,path)
        })
    },

    updateLinkStatus: (path:string,callback:(err:MysqlError|null, product:ProductPathData|null) => void) => {
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

    delete: (path: string,callback:(err:MysqlError|null, product:any) => void) => {
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
    
    addMultiple: (photos: ProductPhotos[], callback:(err:MysqlError|null, res: null) => void) => {
        const sql = `INSERT INTO product_photos (
                        product_id,
                        product_type,
                        path
                    ) VALUES ?`

        const values = photos.map(photo => [photo.product_id, photo.product_type, photo.path])
        db.query(sql, [values], (err) => {
            if (err) {
                return callback(err,null)
            }
            return
        })
    },

    add: (path:string, product_id:number, product_type:ProductType, callback:(err:MysqlError|null, productPhoto:ProductPhotos|null ) => void) => {

        const sql = `INSERT INTO product_photos (
            product_id,
            product_type,
            path
        ) VALUES (?,?,?)`

        db.query(sql, [product_id,product_type,path], (err, response)=> {
            if (err) {
                return callback(err, null)
            } else {

                const query = `SELECT * FROM product_photos WHERE id = ?`

                db.query(query, response.insertId, (err, productPhoto) => {
                    if (err) {
                        return callback(err,null)
                    }
                    return callback(null, productPhoto[0])
                })
            }
            
        })
    },

    delete: (path:string, callback:(err:MysqlError|null) => void) => {
        const sql = `DELETE FROM product_photos WHERE path = ?`

        db.query(sql, path, (err) => {
            if (err) {
                return callback(err)
            }
            return callback(null)
        })
    },
}

export const BookGenres = {
    addMultiple: (mappedGenres:GenreTable[], callback:(err:MysqlError|null, res:null) => void) => {
        const sql = `INSERT INTO book_genres (genre,book) VALUES ?`
        
        const values = mappedGenres.map(genre => [genre.value,genre.book])
        db.query(sql, [values], (err,result) => {
            if (err) {
                return callback(err,null)
            }
            return
        })
    }
}