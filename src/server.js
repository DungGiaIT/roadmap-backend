import express from "express";
import recipeRouter from "./routes/recipesRoute.js";
import { connectDB, disconnectDB } from "./config/db.js";

import authRouter from "./routes/auth.js";
import categoryRouter from "./routes/categoryRoutes.js"

import {config} from "dotenv";

config()

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/", authRouter);
app.use("/", categoryRouter);
app.use("/", recipeRouter);

app.get("/Home",(req,res) =>{
    res.json({message: "Hello World!"})
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);

    server.close(async () => {
        await disconnectDB();
        process.exit(1);
    });
});


// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
    console.error("Uncaught Exception:", err);

    await disconnectDB();
    process.exit(1);
});


// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");

    server.close(async () => {
        await disconnectDB();
        process.exit(0);
    });
});


const PORT = 3000;

const startServer = async() =>{
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on PORT ${PORT}`)
    });
}

startServer();