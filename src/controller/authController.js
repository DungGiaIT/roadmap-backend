import {prisma} from "../config/db.js"
import bcrypt from "bcryptjs";
import { generateToken } from "../untils/generateToken.js";

const register = async (req, res) => {
    console.log("AUTH CONTROLLER LOADED");
    const {name, email, password} = req.body;

    const userExist = await prisma.user.findUnique({
        where: {email: email},
    });
    if (userExist) {
        return res.status(400).json({status: "error", message: "User already exists with email"});
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            userName: name,
            email,
            password: hashedPassword
        }
    });

    res.status(201).json({
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

    generateToken(userExist.userID,res);
    
    res.status(200).json({
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
    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
}

export{register, login, logout};