import { Request, Response } from "express";
import { client } from "../db/posgres";
import { QueryResult } from "pg";
import { IProducts } from "../types/IProducts";
import supabase from "../db/db";

export const createProduct = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const {
      sku,
      name,
      description,
      price,
      stock_quantity,
      category_id,
      image_url,
      weight,
      dimensions,
      is_active,
    }: IProducts = req.body;

    if (
      !sku ||
      !name ||
      !price ||
      typeof price !== "number" ||
      !stock_quantity ||
      typeof stock_quantity !== "number"
    ) {
      res
        .status(400)
        .json({ message: "Bad Request: Missing or invalid required data" });
      return;
    }

    // Check for existing product using Supabase
    const { data: existingProduct } = await supabase
      .from("products")
      .select()
      .eq('sku', sku)
      .single();

    if (existingProduct) {
      res
        .status(400)
        .json({ message: "Product with the same SKU already exists" });
      return;
    }

    // Insert new product
    const { data, error } = await supabase
      .from("products")
      .insert({
        sku,
        name,
        description,
        price,
        stock_quantity,
        category_id,
        image_url,
        weight,
        dimensions,
        is_active,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "Product Created Successfully",
      body: { product: data },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
//update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const sku = req.params.sku;
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      image_url,
      weight,
      dimensions,
      is_active,
    }: IProducts = req.body;

    if (
      !sku ||
      !name ||
      !price ||
      typeof price !== "number" ||
      !stock_quantity ||
      typeof stock_quantity !== "number"
    ) {
      res
        .status(400)
        .json({ message: "Bad Request: Missing or invalid required data" });
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        price,
        stock_quantity,
        category_id,
        image_url,
        weight,
        dimensions,
        is_active,
      })
      .eq("sku", sku)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Product Updated Successfully",
      body: { product: data },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const sku = req.params.sku;
    if (!sku) {
      res.status(400).json({ message: "Bad Request: Missing SKU parameter" });
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("sku", sku);

    if (error) throw error;

    res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//get product data
export const getProduct = async (req: Request, res: Response) => {
  try {
    const sku = req.params.sku;
    if (!sku) {
      res.status(400).json({ message: "Bad Request: Missing SKU parameter" });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories!inner(name)')
      .eq('sku', sku)
      .single();

    if (error) throw error;

    res.status(200).json({ 
      message: "Product Data", 
      body: { product: data } 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;

    res.status(200).json({ products: data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    if (!category) {
      res.status(400).json({ message: "Bad Request: Missing category parameter" });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories!inner(name)')
      .eq('categories.name', category);

    if (error) throw error;

    res.status(200).json({ products: data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}