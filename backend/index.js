import express from 'express';
import dotenv from "dotenv";
import { connectDb } from './db/connectDb.js';
import authRoutes from "./routes/auth.js";
import cookieParser from 'cookie-parser';
import cors from "cors"
import path from "path";
dotenv.config();
const PORT = process.env.PORT || 5000
const __dirname = path.resolve();


const app = express();
app.use(cors({origin: "http://localhost:5173", credentials: true}));

app.use(express.json()); // allows us to parse incoming request: req.body
app.use(cookieParser()); // allows us to parse incoming cookies



app.use("/api/auth", authRoutes);
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}


app.listen(PORT, () => {
    connectDb();
    console.log("Server is running on Port: ", PORT);
})