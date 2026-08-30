import {prisma} from "../config/db.js"
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
    console.log("AUTH CONTROLLER LOADED");
    const {name, email, password} = req.body;

    const userExist = await prisma.user.findUnique({
        where: {email: email},
    });
    if (userExist) {
        res.status(400).json("User already exists with email");
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);

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
                name: name,
                email: email
            }
        }
    });
};