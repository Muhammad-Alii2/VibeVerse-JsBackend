import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then( () => {
    try {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Listening at port: ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Server connection failed: ", error);
    }
})
.catch((error) => {
    console.log("MongoDB connection failed: ", error);
})