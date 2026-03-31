import dotenv from "dotenv";
dotenv.config();

import { app } from "./src/app.js";
import connectDB from "./src/config/db.js";


connectDB()
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

console.log("EMAIL_USER:", process.env.EMAIL_USER)
console.log("CLIENT_ID:", process.env.CLIENT_ID)
console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET)
console.log("REFRESH_TOKEN:", process.env.REFRESH_TOKEN)