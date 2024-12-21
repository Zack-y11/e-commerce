import IShippingAddress from "../types/IAddress";
import { Request, Response } from "express";
import { client } from "../db/posgres";

//shipping_addresses CRUD
export const createShippingAddress = async (req: Request, res: Response) => {
  try {
    const userCookiesId = req.cookies.id;

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCookiesId).id;
    let is_default = true;
    let userHasAddress = await client.query(
      "SELECT * FROM shipping_addresses WHERE user_id = $1",
      [user_id]
    );
    let {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    }: IShippingAddress = req.body;
    if (userHasAddress.rows.length > 0) {
      res.status(400).json({ message: "User already has a shipping address" });
      is_default = false;
    }
    const response = await client.query(
      "INSERT INTO shipping_addresses (user_id, address_line1, address_line2, city, state, postal_code, country, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        user_id,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
      ]
    );
    res.status(201).json({ address: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
    return;
  }
};

//user Address
export const getShippingAddresses = async (req: Request, res: Response) => {
  try {
    //const userCookiesId = req.cookies.id;
    const user = req.params.id;
    if (!user) {
      res.status(400).json({ message: "User id is required" });
      return;
    }

    const response = await client.query(
      "SELECT * FROM shipping_addresses WHERE user_id = $1",
      [user]
    );
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const updateShippingAddress = async (req: Request, res: Response) => {
  try {
    const userCookiesId = req.cookies.id;

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCookiesId).id;
    const {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    }: IShippingAddress = req.body;
    const address_id = req.params.id;

    const userHasAddress = await client.query(
      "SELECT * FROM shipping_addresses WHERE id = $1 AND user_id = $2",
      [address_id, user_id]
    );

    if (userHasAddress.rows.length === 0) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const response = await client.query(
      "UPDATE shipping_addresses SET address_line1 = $1, address_line2 = $2, city = $3, state = $4, postal_code = $5, country = $6 WHERE id = $7 AND user_id = $8 RETURNING *",
      [
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        address_id,
        user_id,
      ]
    );

    res.status(200).json({
      message: "Address updated successfully",
      address: response.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const deleteShippingAddress = async (req: Request, res: Response) => {
  try {
    const address_id = req.params.id;

    if (!address_id) {
      res.status(400).json({ message: "Address id is required" });
      return;
    }
    const data = await client.query(
      "SELECT * FROM shipping_addresses WHERE id = $1",
      [address_id]
    );
    if (data.rows.length === 0) {
      res.status(404).json({ message: "Address not found" });
      return;
    }
    const response = await client.query(
      "DELETE FROM shipping_addresses WHERE id = $1",
      [address_id]
    );
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
    return;
  }
};
