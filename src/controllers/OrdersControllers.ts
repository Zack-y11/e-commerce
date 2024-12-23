import { IOrders, IOrderItems } from "../types/IOrders";
import { Request, Response } from "express";
import { client } from "../db/posgres";
import { OrderStatus } from "../types/EnumData";

export const getOrders = async (req: Request, res: Response) => {
    try {
        const  user_id_cookies  = req.cookies.id;
        if(!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const response = await client.query("SELECT * FROM orders WHERE user_id = $1", [user_id]);
        res.json(response.rows);
    } catch (error) {
        res.status(500).json({ 
            err: error,
            message: "Internal server error"
        });
    }
}

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const user_id_cookies  = req.cookies.id;
        if(!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const { status, total_amount, shipping_address_id } = req.body;
        //validate status
        if(!Object.values(OrderStatus).includes(status as OrderStatus)) {
            res.status(400).json({ err: "Invalid status" });
            return;
        }
        const newOrder: IOrders = {
            user_id,
            status,
            total_amount,
            shipping_address_id
        };
        //validate user_id
        const userExist = await client.query("SELECT * FROM users WHERE id = $1", [user_id]);
        if(userExist.rowCount === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        //validate shipping_address_id
        const addressExist = await client.query("SELECT * FROM shipping_addresses WHERE id = $1", [shipping_address_id]);
        if(addressExist.rowCount === 0) {
            res.status(404).json({ message: "Shipping address not found" });
            return;
        }
        const response = await client.query(
            "INSERT INTO orders (user_id, status, total_amount, shipping_address_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [newOrder.user_id, newOrder.status, newOrder.total_amount, newOrder.shipping_address_id]
        );
        res.json(response.rows[0]);
    } catch (error) {
        res.status(500).json({ 
            err: error,
            message: "Internal server error"
        });
        return;
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const user_id_cookies = req.cookies.id;
        if (!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const { status } = req.body;
        const order_id = req.params.id;

        // Validate status
        if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
            res.status(400).json({ err: "Invalid status" });
            return;
        }

        // Calculate total amount
        const total_amount_result = await client.query(
            "SELECT SUM(quantity * price_at_time) AS total FROM order_items WHERE order_id = $1",
            [order_id]
        );
        const total_amount = total_amount_result.rows[0]?.total || 0;

        // Check if order exists and update
        const response = await client.query(
            "UPDATE orders SET status = $1, total_amount = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
            [status, total_amount, order_id, user_id]
        );

        if (response.rowCount === 0) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json(response.rows[0]);
    } catch (error) {
        res.status(500).json({
            err: error,
            message: "Internal server error",
        });
    }
};


//delete order
export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const user_id_cookies = req.cookies.id;
        if(!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const order_id  = req.params.id;
        const response = await client.query(
            "DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING *",
            [order_id, user_id]
        );
        if(response.rowCount === 0) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        res.json({order_deleted:response.rows[0]});
    } catch (error) {
        res.status(500).json({ 
            err: error,
            message: "Internal server error"
        });
    }
};
//get order by user and id
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const user_id_cookies = req.cookies.id;
        if(!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const order_id  = req.params.id;
        const response = await client.query(
            "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
            [order_id, user_id]
        );
        if(response.rowCount === 0) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        res.status(200).json({order: response.rows[0]});
    } catch (error) {
        res.status(500).json({ 
            err: error,
            message: "Internal server error"
        });
    }
};

export const addItemsToOrder = async (req: Request, res: Response) => {
    try {
      const order_id = req.params.idOrder;
      const { product_id, quantity, price_at_time } = req.body;
  
      if (quantity <= 0) {
        res.status(400).json({ message: "Invalid quantity" });
        return;
      }
      if (!order_id || !product_id || !quantity || !price_at_time) {
        res.status(400).json({ message: "Invalid or missing data" });
        return;
      }
  
      const productExist = await client.query("SELECT * FROM products WHERE id = $1", [product_id]);
      const orderExist = await client.query("SELECT * FROM orders WHERE id = $1", [order_id]);
  
      if (productExist.rowCount === 0) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      if (orderExist.rowCount === 0) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
  
      const response = await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4) RETURNING *",
        [order_id, product_id, parseInt(quantity), parseFloat(price_at_time)]
      );
  
      res.status(201).json({ item: response.rows[0] });
    } catch (error) {
      res.status(500).json({
        err: error,
        message: "Internal server error"
      });
    }
  };

export const removeItemsFromOrder = async (req: Request, res: Response) => {
    try {
        const order_id = req.params.idOrder;
        const { product_id } = req.body;

        const productExist = await client.query("SELECT * FROM products WHERE id = $1", [product_id]);
        const orderExist = await client.query("SELECT * FROM orders WHERE id = $1", [order_id]);

        if (productExist.rowCount === 0) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        if (orderExist.rowCount === 0) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        const response = await client.query(
            "DELETE FROM order_items WHERE order_id = $1 AND product_id = $2 RETURNING *",
            [order_id, product_id]
        );

        if (response.rowCount === 0) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        // Check if the order has any remaining items
        const remainingItems = await client.query("SELECT * FROM order_items WHERE order_id = $1", [order_id]);
        if (remainingItems.rowCount === 0) {
            // If no items remain, delete the order
            await client.query("DELETE FROM orders WHERE id = $1 RETURNING *", [order_id]);
            res.status(200).json({ message: "Order and item removed" });
            return;
        }

        res.status(200).json({ removedItem: response.rows[0] });
    } catch (error) {
        res.status(500).json({
            err: error,
            message: "Internal server error"
        });
    }
};


//get a order with all user info and shipping address
export const getOrderWithInfo = async (req: Request, res: Response) => {
    try {
      const user_id_cookies = req.cookies.id;
      if (!user_id_cookies) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user_id = JSON.parse(user_id_cookies).id;
      const order_id = req.params.id;
  
      const orderResponse = await client.query(
        "SELECT orders.*, users.*, shipping_addresses.* FROM orders INNER JOIN users ON orders.user_id = users.id INNER JOIN shipping_addresses ON orders.shipping_address_id = shipping_addresses.id WHERE orders.id = $1 AND orders.user_id = $2",
        [order_id, user_id]
      );
  
      if (orderResponse.rowCount === 0) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
  
      const orderItemsResponse = await client.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [order_id]
      );
  
      const orderWithInfo = {
        ...orderResponse.rows[0],
        items: orderItemsResponse.rows
      };
  
      res.json(orderWithInfo);
    } catch (error) {
      res.status(500).json({
        err: error,
        message: "Internal server error"
      });
    }
  };