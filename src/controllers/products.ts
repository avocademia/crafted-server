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
const asyncUnlink = promisify(fs.unlink)

interface DeleteRequestBody {
    path?: string;
}

export const addProduct = async (req:MulterRequest,res:Response) => {

    const {id} = req.params
    if (req.body.type === 'retail') {

        const {name,cost,category,sub_category,quantity,description,condition,type} = req.body

        const goodRequest = name&&cost&&description&&
                            condition&&quantity&&
                            category&&sub_category&&
                            validator.isNumeric(cost) &&
                            validator.isNumeric(quantity)
        if (!goodRequest) {
            res.status(400).json({error: 'Some required fields are missing'})
        } else {
            try {

                const productData = {
                    name: validator.escape(name),
                    cost: parseFloat(cost),
                    category: category as Category,
                    sub_category: validator.escape(sub_category),
                    quantity: quantity,
                    description: validator.escape(description),
                    product_condition: condition as ProductCondition,
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
    }

    if (req.body.type === 'custom') {

        const {name,cost,category,sub_category,production_time,description,type} = req.body
        const goodRequest = name&&cost&&description&&
                            production_time&&category&&
                            sub_category&&type&&
                            validator.isNumeric(cost) &&
                            validator.isNumeric(production_time)
        if (!goodRequest) {
            res.status(400).json({error: 'Some required fields are missing'})
        } else {
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
   
    }

    if (req.body.type === 'digital') {

        const {name,cost,description,type, path} = req.body
        const goodRequest = name&&cost&&description&&
                            path&&validator.isNumeric(cost)
        if (!goodRequest) {
            res.status(400).json({error: 'Some required fields are missing'})
        } else {
            try {

                const productData = {
                    name: validator.escape(name),
                    cost: parseFloat(cost),
                    path: validator.escape(path),
                    description: validator.escape(description),
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

    }

    if (req.body.type === 'books') {

        const {name,cost,summary,condition,type,quantity,author} = req.body
        const genres: string[] = req.body.genres
        const goodRequest = name&&cost&&summary&&
                            condition&&quantity&&
                            genres&&author&&
                            validator.isNumeric(cost) &&
                            validator.isNumeric(quantity)
        if (!goodRequest) {
            res.status(400).json({error: 'some required fields are missing or inadequate'})
        } else {
            try {

                const productData = {
                    name: validator.escape(name),
                    cost: parseFloat(cost),
                    summary: validator.escape(summary),
                    book_condition: condition as ProductCondition,
                    quantity: quantity,
                    kloset_id: parseInt(id),
                    author: validator.escape(author),
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
        res.status(400).json({ error: 'empty body or path missing' });
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
            const newName = validator.escape(value)
            if (type === 'retail') {
                
                RetailProducts.updateName(newName, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: err.message})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'custom') {
                CustomProducts.updateName(newName, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'digital') {
                DigitalProducts.updateName(newName, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
    
            if (type === 'books') {
                Books.updateName(newName, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    } else {
                        res.status(200).json({message: 'success!'})
                    }
                })
            }
        }

        if (field=== 'cost' && product_id && validator.isNumeric(value)) {
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
            const newSubCategory = validator.escape(value)
            if (type === 'custom') {
                CustomProducts.updateSubCategory(newSubCategory, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'retail') {
                RetailProducts.updateSubCategory(newSubCategory, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if(field === 'category' && product_id) {
            const newCategory = validator.escape(value) as Category
            if (type === 'custom') {
                CustomProducts.updateCategory(newCategory, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'retail') {
                RetailProducts.updateCategory(newCategory, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if (field === 'description' && product_id) {
            const newDescription = validator.escape(value)
            if (type === 'retail') {
                RetailProducts.updateDescription(newDescription, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'custom') {
                CustomProducts.updateDescription(newDescription, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }

            if (type === 'digital') {
                DigitalProducts.updateDescription(newDescription, parseInt(product_id), (err) => {
                    if (err) {
                        res.status(500).json({error: 'database error'})
                    }
                })
            }
        }

        if (field === 'summary' && product_id) {
            const newSummary = validator.escape(value)
            Books.updateSummary(newSummary, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        } 

        if (field === 'author' && product_id) {
            const newAuthor= validator.escape(value)
            Books.updateAuthor(newAuthor, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        }

        if (field === 'quantity' && product_id && validator.isNumeric(value)) {
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

        if (field === 'production_time' && product_id && validator.isNumeric(value)) {
            CustomProducts.updateProductionTime(value, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        }

        if (field === 'path' && product_id) {
            const newPath = validator.escape(value)
            DigitalProducts.updatePath(newPath, parseInt(product_id), (err) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
            })
        } 

    } catch (error) {
       res.status(500).json({error: 'unexpected server error'}) 
    }
}

export const deleteProductPhoto = async (req:RequestWithParams, res:Response) => {

    const __filepath = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filepath)
    const {photo}= req.body
    const photoName = photo.replace('uploads/product-photos/', '')
    const fullPath = path.join(__dirname, '../../', photo)
    console.log('photo:',photoName)
    console.log('path:', fullPath)

    if (photo) {
        ProductPhotos.delete(photo, async (err) => {
            console.log('Inside ProductPhotos.delete callback');
            if (err) {
                res.status(500).json({error: 'database error'})
            }
                
                try {                 
                    console.log('full path:', fullPath)
                    await asyncUnlink(fullPath)
                } catch (error) {
                    res.status(500).json({error: 'unexpected error deleting file'})
                }
        })
    }
}

export const addProductPhoto = async (req:MulterRequest, res:Response) => {

    const {file} = req
    const {product_id, product_type} = req.body

    try {

        if (file) {
            const path =  `uploads/product-photos/${file.filename}`
            ProductPhotos.add(path, parseInt(product_id), product_type, (err,photo) => {
                if (err) {
                    res.status(500).json({error: 'database error'})
                }
                
                if (photo && !err){
                    res.status(200).json({photo: photo.path})
                }
            })
        }

    } catch (error) {
        res.status(500).json({error: 'unexpected error'})
    }
    
}