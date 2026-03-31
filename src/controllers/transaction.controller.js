import { transactionModel } from "../models/transaction.model.js"
import { ledgerModel } from "../models/ledger.model.js"
import { accountModel } from "../models/account.model.js"
import mongoose from "mongoose"
import { sendTransactionEmail, sendTransactionFailureEmail } from "../services/email.service.js"

const transactionController = async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount, idempotencyKey are required"
    })
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    })
  }

  const fromUserAccount = await accountModel.findById(fromAccount)
  const toUserAccount = await accountModel.findById(toAccount)

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount"
    })
  }

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both accounts must be ACTIVE"
    })
  }

  const existingTxn = await transactionModel.findOne({ idempotencyKey })
  if (existingTxn) {
    return res.status(200).json({
      message: "Transaction already processed",
      transaction: existingTxn
    })
  }

  const balance = await fromUserAccount.getBalance()
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}`
    })
  }

  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    const transaction = new transactionModel({
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING"
    })
    await transaction.save({ session })

    await ledgerModel.create([
      {
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
      },
      {
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
      }
    ], { session,ordered: true })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()

    sendTransactionEmail(
      req.user.email,
      req.user.username,
      amount,
      toAccount
    )

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction
    })

  } catch (error) {
    await session.abortTransaction()
    console.error("Transaction error:", error)

    await sendTransactionFailureEmail(
      req.user.email,
      req.user.username,
      amount,
      toAccount
    )

    return res.status(500).json({
      message: "Transaction failed"
    })
  } finally {
    session.endSession()
  }
}


const createInitialFundsTransaction = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount, and idempotencyKey are required"
    })
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    })
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount })

  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount"
    })
  }

  const fromUserAccount = await accountModel.findOne({ user: req.user._id })

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found"
    })
  }

  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING"
    })
    await transaction.save({ session })

    await ledgerModel.create([
      {
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
      },
      {
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
      }
    ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction
    })

  } catch (error) {
    await session.abortTransaction()
    console.error("Initial funds transaction error:", error)

    return res.status(500).json({
      message: "Initial funds transaction failed"
    })

  } finally {
    session.endSession()
  }
}

export { transactionController, createInitialFundsTransaction }