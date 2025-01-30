import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../types/User";
import supabase from "../db/db";
dotenv.config();
export const signup = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const { email, password, firstname, lastname, phone }: User = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into users table
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: hashedPassword,
          first_name: firstname,
          last_name: lastname,
          phone,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: "User Created Successfully",
      body: {
        user: { email, firstname, lastname, phone },
      },
    });
  } catch (e) {
    console.log(e);
    if ((e as any).code === "23505") {
      res.status(400).json({
        message: "Email already exists",
      });
      return;
    }
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

//loggin using email and password and jwt
export const login = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const { email, password }: User = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid Password" });
      return;
    }

    //generate jwt
    const token = jwt.sign(
      { email: user.email, id: user.id },
      process.env.SECRET_KEY!,
      { expiresIn: "24h" }
    );

    // Set the JWT in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.cookie("id", JSON.stringify({ id: user.id }), {
      httpOnly: false,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Login Successful", token, user });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};
//logout
export const logout = async (_: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.clearCookie("id", {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logout Successful" });
  return;
};
//update user
export const updateAccount = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      res.status(400).json({ message: "Bad Request: Missing request body" });
      return;
    }
    const { email, password, firstname, lastname, phone }: User = req.body;
    const userIdCookie = req.cookies.id;
    const userId = JSON.parse(userIdCookie).id;
    
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updatedData = {
      email: email || user.email,
      password_hash: password ? await bcrypt.hash(password, 10) : user.password_hash,
      first_name: firstname || user.first_name,
      last_name: lastname || user.last_name,
      phone: phone || user.phone
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(updatedData)
      .eq("id", userId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "User Updated Successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//deleteAccount
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userIdCookie = req.cookies.id;
    const userId = JSON.parse(userIdCookie).id;
    
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) throw error;

    res.clearCookie("token");
    res.clearCookie("id");
    res.status(200).json({ message: "Account Deleted Successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userIdCookie = req.cookies.id;
    const userId = JSON.parse(userIdCookie).id;
    
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User Profile", user });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
