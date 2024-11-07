import validator from "validator"
import { CustomProducts, 
         DigitalProducts, 
         ProductPath, 
         RetailProducts,
         ProductPhotos, 
         BookGenres,
         Books} from "../models/Products.mjs"
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

export const addProduct = async (req,res) => {

    const {id} = req.params
    if (req.body.type === 'retail') {

        const {name,cost,category,sub_category,quantity,description,condition,type} = req.body
        if (!name||!cost||!category||!sub_category||!quantity||!description||!condition) {
            return res.status(400).json({message: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedCost = validator.escape(cost)
            const sanitizedCategory = validator.escape(category)
            const sanitizedSubCategory = validator.escape(sub_category)
            const sanitizedQuantity = validator.escape(quantity)
            const sanitizedDescription = validator.escape(description)
            const sanitizedCondition = validator.escape(condition)

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                category: sanitizedCategory,
                sub_category: sanitizedSubCategory,
                quantity: parseInt(sanitizedQuantity),
                description: sanitizedDescription,
                product_condition: sanitizedCondition,
                kloset_id: parseInt(id)
            }

            RetailProducts.create(productData, (err, product) => {
                if (err) {
                    return res.status(500).json({message: `${err.message}`})
                }

                try {
                    
                    const allFiles = Object.values(req.files).flat()
                    const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                    const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))

                    ProductPhotos.addMultiple(photoData, (err) => {
                        if (err) {
                            return res.status(500).json({message: 'Database Error saving photos'})
                        }
                        return res.status(201).json({message: 'product successfully created'})
                    })
                } catch (error) {
                    res.status(400).json({message: `${error.message}`})
                }
            })      
        } catch (error) {
            return res.status(500).json({message: `Fill all image slots`})
        }
    }

    if (req.body.type === 'custom') {

        const {name,cost,category,sub_category,production_time,description,type} = req.body
        if (!name||!cost||!category||!sub_category||!production_time||!description||!type) {
            return res.status(400).json({message: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedCost = validator.escape(cost)
            const sanitizedCategory = validator.escape(category)
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
                kloset_id: parseInt(id)
            }

            CustomProducts.create(productData, (err, product) => {
                if (err) {
                    return res.status(500).json({message: 'Database error'})
                }

                try {

                    const allFiles = Object.values(req.files).flat()
                    const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                    const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))

                    ProductPhotos.addMultiple(photoData, (err) => {
                        if (err) {
                            return res.status(500).json({message: 'Database Error saving photos'})
                        }
                        return res.status(201).json({message: 'product successfully created'})
                    })
                } catch (error) {
                    res.status(400).json({message: `fill all image slots`})
                }
            })
        } catch (error) {
            return res.status(500).json({message: 'Error adding product'})
        }
    }

    if (req.body.type === 'digital') {

        const {name,cost,description,type, path} = req.body
        if (!name||!cost||!description||!path) {
            return res.status(400).json({message: 'Some required fields are missing'})
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
                kloset_id: parseInt(id)
            }

            DigitalProducts.create(productData, (err, product) => {
                if (err) {
                    return res.status(500).json({message: `${err.message}`})
                }

                try {
                    
                    const allFiles = Object.values(req.files).flat()
                    const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                    const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))

                    ProductPhotos.addMultiple(photoData, (err) => {
                        if (err) {
                            return res.status(500).json({message: 'Database Error saving photos'})
                        }
                        ProductPath.updateLinkStatus(path, (err) => {
                            if (err) {
                                return res.status(500).json({message: `${err.message}`})
                            }
                            return res.status(300).json({message: 'product successfully created'})
                        }) 
                    })


                } catch (error) {
                    res.status(400).json({message: `${error.message}`})
                }
            })
        } catch (error) {
            return res.status(500).json({message: `${error.message}`})
        }
    }

    if (req.body.type === 'books') {

        const {name,cost,summary,condition,type,quantity,genres,author} = req.body
        if (!name||!cost||!summary||!condition||!quantity||!genres||!author) {
            return res.status(400).json({message: 'Some required fields are missing'})
        }
        try {

            const sanitizedName = validator.escape(name)
            const sanitizedSummary = validator.escape(summary)
            const sanitizedCost = validator.escape(cost)
            const sanitizedQuantity = validator.escape(quantity)
            const sanitizedCondition = validator.escape(condition)
            const sanitizedAuthor = validator.escape(author)

            const productData = {
                name: sanitizedName,
                cost: parseFloat(sanitizedCost),
                summary: sanitizedSummary,
                book_condition: sanitizedCondition,
                quantity: parseInt(sanitizedQuantity),
                kloset_id: parseInt(id),
                author: sanitizedAuthor
            }

            Books.create(productData, (err, product) => {
                if (err) {
                    return res.status(500).json({message: `${err.message}`})
                }

                try {
                    
                    const allFiles = Object.values(req.files).flat()
                    const photoPaths = allFiles.map(file => `uploads/product-photos/${file.filename}`)
                    const photoData = photoPaths.map(path => ({product_id: product.insertId, product_type: type, path: path}))
                    const mappedGenres = genres.map(genre => ({value: genre, book: product.insertId}))

                    ProductPhotos.addMultiple(photoData, (err) => {
                        if (err) {
                            return res.status(500).json({message: 'Database Error saving photos'})
                        }

                        try {
                            BookGenres.addMultiple(mappedGenres, (err) => {
                                if (err) {
                                    return res.status(500).json({message: 'genre database error'})
                                }
                                return res.status(201).json({message: 'product successfully created'})
                            })
                        } catch (error) {
                            res.status(500).json({message: 'error saving genres'})
                        }
                    })
                } catch (error) {
                    res.status(400).json({message: `${error.message}`})
                }
            })
        } catch (error) {
            return res.status(500).json({message: 'Error adding product'})
        }
    }
}

export const sendProductPath = async (req,res) => {

    try {
        const productPath = `uploads/digital-products/${req.file.filename}`
        ProductPath.create(productPath, (err, path) => {
            if (err) {
                return res.status(500).json({message: `${err}`})
            }
            return res.status(201).json({message: `path added succesfully`, path: productPath, success: path})
        })
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }
}

export const deleteDigitalProduct = async (req,res) => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename) 
    const filePath = req.body.path
        
    try {

        ProductPath.delete(filePath, (err,result) => {
            if (err) {
                return res.status(500).json({message: `${err.message}`})
            }

            const fullPath = path.join(__dirname, '../../', filePath)

            fs.unlink(fullPath, (err) => {
                if (err) {
                    return res.status(500).json({message: 'error deleting previous file'})
                }
                return res.status(201).json({message: 'deleted successfully'})
            })
        })
        
    } catch (error) {
        return res.status(500).json({message: `${error.message}`})
    }
}

export const getProductsByKloset = async (req,res) => {
   const {kloset_id, type} = req.params

   if (type === 'retail') {
        try {
            RetailProducts.getProductsByKloset(parseInt(kloset_id), (err,productList) => {
                if (err) {
                    return res.status(500).json({message: `database`})
                }
                return res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({message: 'Unexpectewd error'})
        }
   }

   if (type === 'custom') {
        try {
            CustomProducts.getProductsByKloset(parseInt(kloset_id), (err,productList) => {
                if (err) {
                    return res.status(500).json({message: `database error`})
                }
                return res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({message: 'Unexpectewd error'})
        }
   }

   if (type === 'digital') {
        try {
            DigitalProducts.getProductsByKloset(parseInt(kloset_id), (err,productList) => {
                if (err) {
                    return res.status(500).json({message: `database error`})
                }
                return res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({message: 'Unexpectewd error'})
        }
    }

    if (type === 'books') {
        try {
            Books.getBooksByKloset(parseInt(kloset_id), (err,productList) => {
                if (err) {
                    return res.status(500).json({message: `${err.message}`})
                }
                return res.status(200).json({products: productList})
            })
        } catch (error) {
            res.status(500).json({message: 'Unexpectewd error'})
        }
   }
}

export const getSingleProduct = async (req,res) => {
    const {product_id, type} = req.params

    if (type === 'retail') {
        try {
            
            RetailProducts.getSingleProduct(product_id, (err,product) => {
                if (err) {
                    return res.status(500).json({message: 'database error'})
                }
                return res.status(200).json({product})
            })
        } catch (error) {
            res.status(500).json({message: 'server error'})
        }
    }

    if (type === 'custom') {
        try {
            
            CustomProducts.getSingleProduct(product_id, (err,product) => {
                if (err) {
                    return res.status(500).json({message: 'database error'})
                }
                return res.status(200).json({product})
            })
        } catch (error) {
            res.status(500).json({message: 'server error'})
        }
    }

    if (type === 'digital') {
        try {
            
            DigitalProducts.getSingleProduct(product_id, (err,product) => {
                if (err) {
                    return res.status(500).json({message: 'database error'})
                }
                return res.status(200).json({product})
            })
        } catch (error) {
            res.status(500).json({message: 'server error'})
        }
    }

    if (type === 'books') {
        try {
            
            Books.getSingleBook(product_id, (err,book) => {
                if (err) {
                    return res.status(500).json({message: 'database error'})
                }
                return res.status(200).json({product: book})
            })
        } catch (error) {
            res.status(500).json({message: `${error.message}`})
        }
    }
}