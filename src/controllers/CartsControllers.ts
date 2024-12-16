import { parse } from "dotenv";
import { client } from "../db/posgres";
import { Request, Response } from "express";

export const getCarts = async (req: Request, res: Response) => {
  try {
    const response = await client.query("SELECT * FROM shopping_carts");
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const createCart = async (req: Request, res: Response) => {
  try {
    const userCokkiesId = req.cookies.id;
    console.log(userCokkiesId);
    if (!userCokkiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCokkiesId).id;
    console.log(user_id);
    const user = await client.query("SELECT * FROM users WHERE id = $1", [user_id]);
    if (user.rows.length == 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const response = await client.query(
      "INSERT INTO shopping_carts (user_id) VALUES ($1) RETURNING *",
      [user_id]
    );
    res.status(201).json({ cart: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};
//deleteCart
export const deleteCart = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.id;

    const response = await client.query("DELETE FROM shopping_carts WHERE id = $1", [
      cartId,
    ]);
    res.status(200).json({ message: "Cart Deleted Successfully" });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};
//getidCart
export const getCartById = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.id;
    const response = await client.query("SELECT * FROM shopping_carts WHERE id = $1", [
      cartId,
    ]);
    if (response.rows.length == 0) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }
    res.status(200).json({ cart: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};