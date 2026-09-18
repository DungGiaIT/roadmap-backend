import {prisma} from "../config/db.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
    const {name, email, password} = req.body;

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            userName: name,
            email,
            password: hashedPassword
        }
    });

    return res.status(201).json({
        status: "success",
        data: {
            user: {
                id: user.userID,
                name: user.userName,
                email: user.email
            },
        }
    });
};

const login = async (req, res) =>{
    const {email, password} = req.body;

    const userExist = await prisma.user.findUnique({
        where: {email: email},
    });
    if (!userExist) { 
        return res.status(401).json({ status: "error", message: "Invalid email" }); 
    }

    const isPasswordValid = await bcrypt.compare(password, userExist.password);
    if (!isPasswordValid) { 
        return res.status(401).json({ status: "error", message: "Invalid password" }); 
    }

    const token = jwt.sign(
        { id: userExist.userID },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 3,
    });
    
    return res.status(200).json({
        status: "success",
        data: {
            user: {
                id: userExist.userID,
                name: userExist.userName,
                email: userExist.email
            },
        }
    });
    
};

const logout = async (req, res) =>{
    res.cookie("jwt", "", {
        httpOnly:true,
        expires: new Date(0),
    });
    return res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        status: "success",
        data: {
            user: {
                id: req.user.userID,
                name: req.user.userName,
                email: req.user.email,
            },
        },
    });
};

export { register, login, logout, getCurrentUser };
