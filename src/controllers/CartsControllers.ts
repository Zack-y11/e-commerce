import { client } from "../db/posgres";
import { Request, Response } from "express";
import ICartItems from "../types/ICartItems";

//shopping_carts CRUD
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
    const userCookiesId = req.cookies.id;
    console.log('Cookie received:', userCookiesId);  // Add this line

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCookiesId).id;

    const user = await client.query("SELECT * FROM users WHERE id = $1", [
      user_id,
    ]);
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

    const cart = await client.query("SELECT * FROM shopping_carts WHERE id = $1", [
      cartId,
    ]);
    
    if (cart.rows.length === 0) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    const response = await client.query(
      "DELETE FROM shopping_carts WHERE id = $1",
      [cartId]
    );
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
    //user id 
    const response = await client.query(
      "SELECT * FROM shopping_carts WHERE user_id = $1",
      [cartId]
    );
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

//addProductToCart
export const addProductToCart = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.id;
    const { productId, quantity }: ICartItems = req.body;
    const cart = await client.query(
      "SELECT * FROM shopping_carts WHERE id = $1",
      [cartId]
    );
    if (cart.rows.length == 0) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }
    // Check if the product already exists in the cart
    const existingCartItem = await client.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );
    if (existingCartItem.rows.length > 0) {
      res.status(400).json({ message: "Product already exists in the cart" });
      return;
    }
    if(quantity <= 0 || !quantity){
      res.status(400).json({ message: "Invalid quantity" });
      return;
    }
    const product = await client.query("SELECT * FROM products WHERE id = $1", [
      productId,
    ]);
    if (product.rows.length == 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const response = await client.query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [cartId, productId, quantity]
    );
    res.status(201).json({ cart_item: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};

//deleteProductFromCart
export const deleteProductFromCart = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.id;
    const productId = req.params.productId;

    const cart = await client.query(
      "SELECT * FROM shopping_carts WHERE id = $1",
      [cartId]
    );
    if (cart.rows.length == 0) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    const product = await client.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );
    if (product.rows.length == 0) {
      res.status(404).json({ message: "Product not found in cart" });
      return;
    }

    await client.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );
    res.status(200).json({ message: "Product Deleted Successfully from Cart" });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};
