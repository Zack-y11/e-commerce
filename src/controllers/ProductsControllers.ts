import { Request, Response } from "express";
import { client } from "../db/posgres";
import { QueryResult } from "pg";
import { IProducts } from "../types/IProducts";

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
    } : IProducts= req.body;
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
    const existingProduct = await client.query(
      "SELECT * FROM products WHERE sku = $1",
      [sku]
    );
    if (existingProduct.rows.length > 0) {
      res
        .status(400)
        .json({ message: "Product with the same SKU already exists" });
      return;
    }
    const response: QueryResult = await client.query(
      "INSERT INTO products (sku, name, description, price, stock_quantity, category_id, image_url, weight, dimensions, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
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
      ]
    );
    res.status(201).json({
      message: "Product Created Successfully",
      body: { product: response.rows[0] },
    });
  } catch (error) {
    console.log(error);
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
    const response: QueryResult = await client.query(
      "UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, category_id = $5, image_url = $6, weight = $7, dimensions = $8, is_active = $9 WHERE sku = $10 RETURNING *",
      [
        name,
        description,
        price,
        stock_quantity,
        category_id,
        image_url,
        weight,
        dimensions,
        is_active,
        sku,
      ]
    );
    res.status(200).json({
      message: "Product Updated Successfully",
      body: { product: response.rows[0] },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
//delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const sku = req.params.sku;
    if (!sku) {
      res.status(400).json({ message: "Bad Request: Missing SKU parameter" });
      return;
    }
    const response: QueryResult = await client.query(
      "DELETE FROM products WHERE sku = $1",
      [sku]
    );
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
    const response: QueryResult = await client.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.sku = $1`,
      [sku]
    );
    res
      .status(200)
      .json({ message: "Product Data", body: { product: response.rows[0] } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const response: QueryResult = await client.query("SELECT * FROM products");
    res.status(200).json({ products: response.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
