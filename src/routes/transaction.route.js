import { authMiddleware, systemUserMiddleware } from "../middlewares/auth.middleware.js";
import express from "express"
import { transactionController ,createInitialFundsTransaction} from "../controllers/transaction.controller.js";
const transactionRouter=express.Router()


transactionRouter.post("/",authMiddleware,transactionController)
transactionRouter.post("/system/initialFund",systemUserMiddleware,createInitialFundsTransaction)
export {transactionRouter}