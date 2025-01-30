
import { Request, Response } from "express";
import { client } from "../db/posgres";
import { OrderStatus } from "../types/EnumData";
import supabase from "../db/db";

export const getOrders = async (req: Request, res: Response) => {
    try {
        const user_id_cookies = req.cookies.id;
        if (!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user_id);

        if (error) throw error;
        
        res.json(data);
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
        const user_id_cookies = req.cookies.id;
        if (!user_id_cookies) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user_id = JSON.parse(user_id_cookies).id;
        const { status, total_amount, shipping_address_id } = req.body;
        console.log(req.body);

        if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
            res.status(400).json({ err: "Invalid status" });
            return;
        }

        // Validate user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select()
            .eq('id', user_id)
            .single();

        if (userError || !user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Validate shipping address exists
        const { data: address, error: addressError } = await supabase
            .from('shipping_addresses')
            .select()
            .eq('id', shipping_address_id)
            .single();

        if (addressError || !address) {
            res.status(404).json({ message: "Shipping address not found" });
            return;
        }

        // Create new order
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id,
                status,
                total_amount,
                shipping_address_id
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        res.json(newOrder);
    } catch (error) {
        res.status(500).json({
            err: error,
            message: "Internal server error"
        });
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
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('quantity, price_at_time')
            .eq('order_id', order_id);

        if (itemsError) throw itemsError;

        const total_amount = orderItems?.reduce((sum, item) => 
            sum + (item.quantity * item.price_at_time), 0) || 0;

        // Update order
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status, total_amount })
            .eq('id', order_id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (updateError) throw updateError;
        if (!updatedOrder) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json(updatedOrder);
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
        const order_id = req.params.id;

        const { data: deletedOrder, error } = await supabase
            .from('orders')
            .delete()
            .eq('id', order_id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;
        if (!deletedOrder) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json({ order_deleted: deletedOrder });
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
        const order_id = req.params.id;

        const { data, error } = await supabase
            .from('orders')
            .select('*') // Explicitly specify columns or use '*'
            .eq('id', order_id)
            .eq('user_id', user_id)
            .single();

        if (error) {
            res.status(400).json({ 
                message: "Error fetching order",
                error: error.message 
            });
            return;
        }

        if (!data) {
            res.status(404).json({ 
                message: "Order not found" 
            });
            return;
        }

        res.status(200).json({ order: data });
    } catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({ 
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

        // Check if product exists
        const { data: product, error: productError } = await supabase
            .from('products')
            .select()
            .eq('id', product_id)
            .single();

        if (productError || !product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        // Check if order exists
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select()
            .eq('id', order_id)
            .single();

        if (orderError || !order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        // Insert order item
        const { data: newItem, error: insertError } = await supabase
            .from('order_items')
            .insert([{
                order_id,
                product_id,
                quantity: parseInt(quantity),
                price_at_time: parseFloat(price_at_time)
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({ item: newItem });
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