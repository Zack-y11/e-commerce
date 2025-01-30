import IShippingAddress from "../types/IAddress";
import { Request, Response } from "express";
import { client } from "../db/posgres";
import supabase from "../db/db";

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

    const { data: existingAddresses, error: fetchError } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', user_id);

    if (fetchError) throw fetchError;

    let {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    }: IShippingAddress = req.body;

    if (existingAddresses && existingAddresses.length > 0) {
      res.status(400).json({ message: "User already has a shipping address" });
      is_default = false;
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert([
        {
          user_id,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          is_default
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ address: data[0] });
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
    const userCookiesId = req.cookies.id;

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCookiesId).id;

    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error"
    });
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

    const { data: existingAddress, error: fetchError } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingAddress) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .update({
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
      })
      .eq('id', address_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Address updated successfully",
      address: data
    });
  } catch (error) {
    res.status(500).json({ 
      error: error,
      message: "Internal Server Error"
    });
  }
};

export const deleteShippingAddress = async (req: Request, res: Response) => {
  try {
    const userCookiesId = req.cookies.id;

    if (!userCookiesId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = JSON.parse(userCookiesId).id;
    const address_id = req.params.id;

    if (!address_id) {
      res.status(400).json({ message: "Address id is required" });
      return;
    }

    const { data: existingAddress, error: fetchError } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingAddress) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', address_id)
      .eq('user_id', user_id);

    if (error) throw error;

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: "Internal Server Error",
    });
    return;
  }
};
