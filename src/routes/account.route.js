import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { createAccount, getUserAccounts,getAccountBalance } from "../controllers/account.controller.js"
const accountRouter=express.Router()


accountRouter.post('/',authMiddleware,createAccount)


accountRouter.get('/',authMiddleware,getUserAccounts)
accountRouter.get("/balance/:accountId",authMiddleware,getAccountBalance)


export {accountRouter}