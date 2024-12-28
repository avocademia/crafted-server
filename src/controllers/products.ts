import validator from "validator"
import { CustomProducts, 
         DigitalProducts, 
         ProductPath, 
         RetailProducts,
         ProductPhotos, 
         BookGenres,
         Books} from "../models/Products"
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { MulterRequest, RequestWithParams, Category, ProductCondition } from "../types"
import { Request, Response } from "express"
import { promisify } from "util"
import { error } from "console"
const asyncUnlink = promisify(fs.unlink)

interface DeleteRequestBody {
    path?: string;
}

export const addProduct = async (req:MulterRequest,res:Response) => {

    const {id} = req.params
    if (req.body.type === 'retail') {

        const {name,cost,category,sub_category,quantity,description,condition,type} = req.body
        if (!name||!cost||!category||!sub_category||!quantity||!description||!condition) {
            res.status(400).json({error: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedCost = validator.escape(cost)
            const sanitizedCategory = category as Category
            const sanitizedSubCategory = validator.escape(sub_category)
            const sanitizedQuantity = validator.escape(quantity)
            const sanitizedDescription = validator.escape(description)
            const sanitizedCondition = condition as ProductCondition

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                category: sanitizedCategory,
                sub_category: sanitizedSubCategory,
                quantity: parseInt(sanitizedQuantity),
                description: sanitizedDescription,
                product_condition: sanitizedCondition,
                kloset_id: parseInt(id),
                sold_out: false
            }

            RetailProducts.create(productData, (err, product) => {
                if (err) {
                    res.status(500).json({error: `database error creating product`})
                }

                if (product && req.files) {

                    try {

                        const allFiles = Object.values(req.files).flat()
                        const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                        const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))
    
                        ProductPhotos.addMultiple(photoData, (err) => {
                            if (err) {
                                res.status(500).json({error: 'Database Error saving photos'})
                            }
                            res.status(201).json({message: 'product successfully created'})
                        })
                    } catch (error) {
                        res.status(500).json({error: `unknown error occured adding retail product photos`})
                    }
                } 
                if (!product && !err) {
                    res.status(404).json({error: 'error fetching product after creation'})
                }
            })      
        } catch (error) {
            res.status(500).json({error: `unknown error occured creating retail product`})
        }
    }

    if (req.body.type === 'custom') {

        const {name,cost,category,sub_category,production_time,description,type} = req.body
        if (!name||!cost||!category||!sub_category||!production_time||!description||!type) {
            res.status(400).json({error: 'Some required fields are missing'})
        }
        try {


            const sanitizedName = validator.escape(name)
            const sanitizedCost = validator.escape(cost)
            const sanitizedCategory = category as Category
            const sanitizedSubCategory = validator.escape(sub_category)
            const sanitizedProductionTime = validator.escape(production_time)
            const sanitizedDescription = validator.escape(description)

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                category: sanitizedCategory,
                sub_category: sanitizedSubCategory,
                production_time: parseInt(sanitizedProductionTime),
                description: sanitizedDescription,
                kloset_id: parseInt(id),
                active: true
            }

            CustomProducts.create(productData, (err, product) => {
                if (err) {
                    res.status(500).json({error: 'Database error creating product'})
                }

                if (product && req.files) {

                    try {

                        const allFiles = Object.values(req.files).flat()
                        const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                        const photoData = photoPaths.map(path => ({product_id: product.id, product_type: type, path: path}))
    
                        ProductPhotos.addMultiple(photoData, (err) => {
                            if (err) {
                                res.status(500).json({error: `database error saving photos`})
                            }
                            res.status(201).json({message: 'product successfully created'})
                        })
                    } catch (error) {
                        res.status(500).json({error: `unknown error occured adding custom product photos`})
                    }
                } 

                if (!err && !product) {
                    res.status(404).json({error: 'error fetching product after creation'})
                }
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured`})
        }
    }

    if (req.body.type === 'digital') {

        const {name,cost,description,type, path} = req.body
        if (!name||!cost||!description||!path) {
            res.status(400).json({error: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedCost = validator.escape(cost)
            const sanitizedDescription = validator.escape(description)

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                path: path,
                description: sanitizedDescription,
                kloset_id: parseInt(id),
                active: true
            }

            DigitalProducts.create(productData, (err, product) => {
                if (err) {
                    res.status(500).json({error: `${err.message}`})
                }

                if (product && req.files) {

                    try {
                    
                        const allFiles = Object.values(req.files).flat()
                        const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                        const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))
    
                        ProductPhotos.addMultiple(photoData, (err) => {
                            if (err) {
                                res.status(500).json({error: 'Database Error saving photos'})
                            }
                            ProductPath.updateLinkStatus(path, (err) => {
                                if (err) {
                                    res.status(500).json({error: `${err.message}`})
                                }
                                res.status(201).json({message: 'product successfully created'})
                            }) 
                        })
                        
                    } catch (error) {
                        res.status(500).json({error: `unknown error occured adding digital product photos`})
                    }

                } else {
                    res.status(404).json({error: 'error fetching product after creation'})
                }

            })

        } catch (error) {
            res.status(500).json({error: `unknown error occured creating digital product`})
        }
    }

    if (req.body.type === 'books') {

        const {name,cost,summary,condition,type,quantity,author} = req.body
        const genres: string[] = req.body.genres
        if (!name||!cost||!summary||!condition||!quantity||!genres||!author) {
            res.status(400).json({error: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedSummary = validator.escape(summary)
            const sanitizedCost = validator.escape(cost)
            const sanitizedQuantity = validator.escape(quantity)
            const sanitizedCondition = condition as ProductCondition
            const sanitizedAuthor = validator.escape(author)

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                summary: sanitizedSummary,
                book_condition: sanitizedCondition,
                quantity: parseInt(sanitizedQuantity),
                kloset_id: parseInt(id),
                author: sanitizedAuthor,
                sold_out: false,
            }

            Books.create(productData, (err, product) => {
                if (err) {
                    res.status(500).json({error: `database error creating book`})
                }

                if (product && req.files) {

                    try {
                    
                        const allFiles = Object.values(req.files).flat()
                        const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                        const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))
                        const mappedGenres = genres.map(genre => ({value: genre, book: product.insertId}))
    
                        ProductPhotos.addMultiple(photoData, (err) => {
                            if (err) {
                                res.status(500).json({error: 'Database Error saving photos'})
                            }
    
                            try {
    
                                if (mappedGenres[0].book === undefined) {
                                    res.status(500).json({error: 'error saving product photos'})
                                }
                                BookGenres.addMultiple(mappedGenres, (err) => {
                                    if (err) {
                                        res.status(500).json({error: 'genre database error'})
                                    }
                                    res.status(201).json({message: 'product successfully created'})
                                })
                            } catch (error) {
                                res.status(500).json({error: 'error saving genres'})
                            }
                        })
    
                    } catch (error) {
                        res.status(500).json({error: `unknown error adding book photos`})
                    }

                } else {
                    res.status(404).json({error: 'error fetching product after creation'})
                }
            })
            
        } catch (error) {
            res.status(500).json({error: `unknown error occured creating book listing`})
        }
    }
}

export const sendProductPath = async (req:MulterRequest,res:Response) => {

    try {
        const file = req.file
        if (!file) {
            res.status(400).json({error: 'No file detected'})
        } else {

            const productPath = `uploads/digital-products/${file.filename}`
            ProductPath.create(productPath, (err, path) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }
                res.status(201).json({message: `path added succesfully`, path: productPath, success: path})
            })

        }
    } catch (error) {
        res.status(500).json({error: `unknown error occured sending product path`})
    }
}

export const deleteDigitalProduct = async (req:Request, res:Response) => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename) 
    const body = req.body as DeleteRequestBody;
    if (!body || !body.path) {
        res.status(400).json({ error: 'Empty body or path missing' });
    }
    const filePath = body.path

    if (filePath) {

        try {

            ProductPath.delete(filePath, async (err) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }
    
                const fullPath = path.join(__dirname, '../../', filePath)
    
                try {
                    await asyncUnlink(fullPath)
                } catch (error) {
                    res.status(500).json({error: 'error occured unlinking file'})
                }
            })
            
        } catch (error) {
            res.status(500).json({error: `unknown error occured deleting degital file`})
        }
    }
}

export const getProductsByKloset = async (req:RequestWithParams, res:Response) => {
    const {kloset_id, type} = req.params

    if (!kloset_id||!type) {
        res.status(400).json({error: 'missing parameters'})
    }

    if (type === 'retail' && kloset_id) {
        try {
            RetailProducts.getProductsByKloset(parseInt(kloset_id), (err, productList) => {
                if (err) {
                    res.status(500).json({error: `database`})
                }
                res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching kloset products`})
        }
   }

   if (type === 'custom' && kloset_id) {
        try {
            CustomProducts.getProductsByKloset(parseInt(kloset_id), (err, productList) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }
                res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching kloset products`})
        }
   }

   if (type === 'digital' && kloset_id) {
        try {
            DigitalProducts.getProductsByKloset(parseInt(kloset_id), (err, productList) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }
                res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching kloset products`})
        }
    }

    if (type === 'books' && kloset_id) {
        try {
            Books.getBooksByKloset(parseInt(kloset_id), (err, productList) => {
                if (err) {
                    res.status(500).json({error: `${err.message}`})
                }
                res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching kloset products`})
        }
   }
}

export const getSingleProduct = async (req:RequestWithParams, res:Response) => {
    const {product_id, type} = req.params

    if (!product_id) {
        res.status(400).json({error: 'unknown product'})
    }

    if (type === 'retail' && product_id) {
        try {      
            const id = parseInt(product_id) 
            RetailProducts.getSingleProduct(id, (err, product) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }
                if (product) {
                    res.status(200).json({product})  
                }  
                if (!product && !err) {
                    res.status(404).json({error: 'product not found'})
                }                                                     
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching product`})
        }
    }

    if (type === 'custom' && product_id) {
        try {   
            const id = parseInt(product_id)   
            CustomProducts.getSingleProduct(id, (err, product) => {
                if (err) {
                    res.status(500).json({error: `database error`})
                }

                if (product) {
                    res.status(200).json({product})  
                } 
                if (!product && !err) {
                    res.status(404).json({error: 'product not found'})
                }
                
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching product`})
        }
    }

    if (type === 'digital' && product_id) {
        try {   
            const id = parseInt(product_id)  
            DigitalProducts.getSingleProduct(id, (err, product) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
                if (product) {
                    res.status(200).json({product})  
                }
                if (!product && !err) {
                    res.status(404).json({error: 'product not found'})
                }
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching product`})
        }
    }

    if (type === 'books' && product_id) {
        try {     
            const id = parseInt(product_id)  
            Books.getSingleBook(id, (err,book) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
                if (book) {
                    res.status(200).json({product: book})  
                }
            })
        } catch (error) {
            res.status(500).json({error: `unknown error occured fetching product`})
        }                          
    }
}

export const getAllProducts = async (req:Request, res:Response) => {

    let allProducts = []

    try {

        RetailProducts.getAllProducts((err,retailProducts) => {

            if (err) {
                res.status(500).json({error: 'database error'})
            }

            if (retailProducts){
    
                CustomProducts.getAllProducts((err, customProducts) => {

                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }

                    if (customProducts) {
    
                        DigitalProducts.getAllProducts((err,digitalProducts) => {

                            if (err) {
                                res.status(500).json({error: 'database error'})
                            }
                            
                            if (digitalProducts) {
    
                                Books.getAllProducts((err, books) => {

                                    if (err) {
                                        res.status(500).json({error: 'database error'})
                                    }
    
                                    if (books) {
                                        allProducts = [
                                            ...digitalProducts, 
                                            ...customProducts,
                                            ...retailProducts,
                                            ...books
                                        ]
                                        res.status(200).json({products: allProducts})
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
        
    } catch (error) {
        res.status(500).json({error: 'unexpected error fetching products'})
    }
}

export const updateProduct = async (req:RequestWithParams, res:Response) => {

    const {field, value} = req.body
    const {product_id, type} = req.params

    if (!field||!value||!product_id||!type) {
        res.status(400).json({error: 'Bad Request'})
    }

    try {
        
        if (field === 'name' && product_id) {

            if (type === 'retail') {
                RetailProducts.updateName(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: err.message})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'custom') {
                CustomProducts.updateName(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'digital') {
                DigitalProducts.updateName(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'books') {
                Books.updateName(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
        }

        if (field=== 'cost' && product_id) {
            if (type === 'retail') {
                RetailProducts.updateCost(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'custom') {
                CustomProducts.updateCost(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'digital') {
                DigitalProducts.updateCost(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'books') {
                Books.updateCost(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if(field === 'sub_category' && product_id) {
            if (type === 'custom') {
                CustomProducts.updateSubCategory(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'retail') {
                RetailProducts.updateSubCategory(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if(field === 'category' && product_id) {
            if (type === 'custom') {
                CustomProducts.updateCategory(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'retail') {
                RetailProducts.updateCategory(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if (field === 'description' && product_id) {
            if (type === 'retail') {
                RetailProducts.updateDescription(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'custom') {
                CustomProducts.updateDescription(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'digital') {
                DigitalProducts.updateDescription(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if (field === 'summary' && product_id) {
            Books.updateSummary(value, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        } 

        if (field === 'author' && product_id) {
            Books.updateAuthor(value, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        }

        if (field === 'quantity' && product_id) {
            if (type === 'retail') {
                RetailProducts.updateQuantity(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'books') {
                Books.updateQuantity(value, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if (field === 'production_time' && product_id) {
            CustomProducts.updateProductionTime(value, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        }

        if (field === 'path' && product_id) {
            DigitalProducts.updatePath(value, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        } 

    } catch (error) {
       res.status(500).json({error: 'unexpected server error'}) 
    }
}