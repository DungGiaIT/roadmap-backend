import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/db.js";

const PORT = Number(process.env.PORT) || 3000;

await prisma.$connect();
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
