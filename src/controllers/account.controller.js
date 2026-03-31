import { accountModel } from "../models/account.model.js"

const createAccount=async(req,res)=>{
const user=req.user

const account=await accountModel.create({
    user:user._id
}) 
res.status(201).json({
    message:"Account created successfully",
    account
})
}

const getUserAccounts=async(req,res)=>{
const accounts=await accountModel.find({user:req.user._id})

res.status(200).json({
    accounts
})
}

const getAccountBalance=async(req,res)=>{
    const {accountId}=req.params

    const account=await accountModel.findOne({
     _id:accountId,  //ye check karata hai _id==accountId or not &&  user==current logged in user
        user:req.user._id
    })
    console.log("accountId param:", req.params.accountId)
console.log("userId from token:", req.user._id)
    if(!account){
        return res.status(404).json({
            message:"account not found"
        })
    }
    const balance= await account.getBalance()
    res.status(200).json({
        accountId:account._id,
        balance:balance
    })

}

export {createAccount,getUserAccounts,getAccountBalance}