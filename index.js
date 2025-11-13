import express  from "express"
import cors from"cors"
import "dotenv/config"
import createError from "http-errors"
import cookieParser from "cookie-parser"
import { productRouter } from "./routes/products.js"
import { connectDD } from "./config/db.js"
import { userRouter } from "./routes/user.js"
import { pubRouter } from "./routes/pub.js"
import { orderRouter } from "./routes/order.js"
import { contactRouter } from "./routes/contact.js"

const app  = express()

const port   = process.env.PORT || 3001

app.use(express.json())
app.use(cors({origin:['https://libreshop.netlify.app'],credentials: true}))
app.use(cookieParser())

//routers
app.use("/api/auth",userRouter)
app.use("/api/product",productRouter);
app.use("/api/pub",pubRouter)
app.use("/api/order", orderRouter)

app.use("/api/contact",contactRouter)


app.get("/api/",(req, res)=>{
  res.json({message:"Api  works  ! "})
})
//error Handling 
app.use((req, res, next) => {
    next(createError(404, "Page Not found"));
  });
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });
  


app.listen(port, ()=>{
    console.log(`Server  is  running on port ${port}`)
    connectDD()
})