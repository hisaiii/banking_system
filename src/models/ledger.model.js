import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "accountModel",
        required: [true, "ledger must be associated with an account"],
        index: true,
        immutable: true //cant be modified once created
    },
    amount: {
        type: Number,
        required: [true, "Amount is required for creating a ledger entry"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transactionModel",
        required: [true, "ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["CREDIT", "DEBIT"],
            message: "Type can be either CREDIT or DEBIT"
        },
        required: [true, "ledger type is required"],
        immutable: true
    },
   


}, {
    timestamps: true
})

function preventLedgerModification(){
throw new Error("Ledger entires are immutable and cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);

const ledgerModel =  mongoose.model("ledger", ledgerSchema)
export { ledgerModel }