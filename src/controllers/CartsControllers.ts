import { client } from "../db/posgres";
import { Request, Response } from "express";
import ICartItems from "../types/ICartItems";
import supabase from "../db/db";

//shopping_carts CRUD
export const getCarts = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('shopping_carts')
      .select('*');
      
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const createCart = async (req: Request, res: Response) => {
  try {
    const userCookiesId = req.cookies.id;
    console.log("Cookie received:", userCookiesId);

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user_id = JSON.parse(userCookiesId).id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .insert([{ user_id }])
      .select()
      .single();

    //if (cartError) throw cartError;
    res.status(201).json({ cart });
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

    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    const { error: deleteError } = await supabase
      .from('shopping_carts')
      .delete()
      .eq('id', cartId);

    if (deleteError) throw deleteError;
    
    res.status(200).json({ message: "Cart Deleted Successfully" });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};

//getCartByUserId
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
    res.status(200).json({ cart: response.rows });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
  }
};
//select cart_items where cart_id
export const getCartItems = async (req: Request, res: Response) => {
  try {
    const cartId = req.params.id;
    
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId);

    if (cartItemsError) throw cartItemsError;
    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', cartItems.map(item => item.product_id));

    if (productsError) throw productsError;

    const items = products.map(product => {
      const cartItem = cartItems.find(item => item.product_id === product.id);
      return [product, cartItem];
    });

    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ error: error });
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
    if (quantity <= 0 || !quantity) {
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
