import { Request, Response } from "express";
import { client } from "../db/posgres";

export const createCategory = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const { name, description } = req.body;
    if (!name) {
      res
        .status(400)
        .json({ message: "Bad Request: Missing or invalid required data" });
      return;
    }
    const response = await client.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *   ",
      [name, description]
    );
    res.status(201).json({
      message: "Category Created Successfully",
      body: { category: response.rows[0] },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const { name, description } = req.body;
    if (!name) {
      res
        .status(400)
        .json({ message: "Bad Request: Missing or invalid required data" });
      return;
    }
    const response = await client.query(
      "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, req.params.id]
    );
    res.status(200).json({
      message: "Category Updated Successfully",
      body: { category: response.rows[0] },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      res.status(400).json({ message: "Bad Request: Missing required data" });
      return;
    }
    const response = await client.query(
      "DELETE FROM categories WHERE id = $1",
      [req.params.id]
    );
    res.status(200).json({ message: "Category Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
export const getCategory = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) {
        res.status(400).json({ message: "Bad Request: Missing required data" });
        return;
        }
        const response = await client.query(
        "SELECT * FROM categories WHERE id = $1",
        [req.params.id]
        );
        res.status(200).json({ category: response.rows[0] });
    } catch (error) {
        console.log(error);
        res.status(500).json({
        message: "Internal Server Error",
        });
    }
}
//get all categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const response = await client.query("SELECT * FROM categories");
        res.status(200).json({ categories: response.rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({
        message: "Internal Server Error",
        });
    }
};