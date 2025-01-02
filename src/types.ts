import { Request } from "express"
import { Stream } from "stream"

export type UserRole = 'admin'|'customer'

export type UserData = {
    id: number,
    insertId?: number,
    first_name: string,
    last_name: string,
    username: string,
    email: string,
    password: string,
    whatsapp_number: string,
    role: UserRole,
    authenticated: boolean,
    refresh_token?: string,
    reset_password_token?: string,
    reset_password_token_expiration?: Date,
    profile_picture?: string,
    created_at: Date,
}

export type UserSignUpData = {
    first_name: string,
    last_name: string,
    username: string,
    email: string,
    password: string,
    whatsapp_number: string,
    role?: UserRole,
    authenticated?: boolean,
    profile_picture?: string|null,
}

export type Category = 'apparel'|'shoes'|'decor'|'jewellery'|'digital'|'books'|undefined
export type KlosetStatus = 'pending'|'approved'
export type ProductType = 'books'|'retail'|'digital'|'custom'
export type ProductCondition = 'brand_new'|'used'|'thrifted'

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Buffer,
    stream?: Stream
}

export type KlosetData = {
    id: number,
    name: string,
    slogan: string,
    category: Category,
    user_id: number,
    delivery: boolean,
    active: boolean,
    status: KlosetStatus,
    delivery_time: number,
    address: string,
    type: ProductType,
    dp: string|null,
    created_at: Date,
    banner: string|null,
    followers: string[]|null,
}

export type RawKlosetData = {
    id: number,
    name: string,
    slogan: string,
    category: Category,
    user_id: number,
    delivery: boolean,
    active: boolean,
    status: KlosetStatus,
    delivery_time: number,
    address: string,
    type: ProductType,
    dp: string|null,
    created_at: Date,
    banner: string|null,
    followers: string|null,
}

export type CreateKlosetData = {
    name: string,
    slogan: string,
    category: Category,
    user_id: number,
    delivery: boolean,
    active?: boolean,
    status?: KlosetStatus,
    delivery_time: number,
    address: string,
    type: ProductType,
    dp: string|null,
    banner?: string
}

export type RetailProduct = {
    insertId?: number,
    id?: number,
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    quantity: number,
    sold_out: boolean,
    category: Category,
    sub_category: string,
    product_condition: ProductCondition,
    photos?: string[]
    photo_path?: string
}

export type Book = {
    insertId?: number,
    id?: number,
    kloset_id: number,
    name: string,
    summary: string,
    cost: number,
    quantity: number,
    sold_out: boolean,
    book_condition: ProductCondition,
    author: string,
    photos?: string[],
    photo_path?: string,
    genre?: string
}

export type CustomProduct = {
    insertId?: number,
    id?: number,
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    production_time: number,
    active: boolean,
    category: Category,
    sub_category: string,
    photos?: string[]
    photo_path?: string
}

export type DigitalProduct = {
    insertId?: number,
    id?: number,
    kloset_id: number,
    name: string,
    description: string,
    cost: number,
    active: boolean,
    path: string,
    photos?: string[]
    photo_path?: string
}

export type ProductPathData = {
    path: string,
    linked: boolean,
    created_at: Date
}

export interface MulterRequest extends Request {
    file?: UploadedFile,
    files?: Record<string, UploadedFile[]>,
}

export interface RequestWithParams extends Request {
    params: {
        kloset_id?: string,
        type?: ProductType,
        product_id?: string,
        cart_item_id?: string,
        new_cost?: string,
        new_quantity: string,
        photo: string
    }
}

declare global {
    namespace Express {
        export interface Request {
            file?: UploadedFile;
            files?: Record<string, UploadedFile[]>;
        }
    }
}

export interface ReqWithAcst extends RequestWithParams {
    accessToken?:string,
    userId?: number
}