import cookieParser from "cookie-parser"
import express, { json } from "express"
import authRouter from "./routes/auth.route.js"
import { accountRouter } from "./routes/account.route.js"
import { transactionRouter } from "./routes/transaction.route.js"
const app=express()
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth',authRouter)
app.use('/api/accounts',accountRouter)
app.use('/api/transactions',transactionRouter)
export {app}