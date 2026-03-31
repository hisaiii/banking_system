import mongoose from "mongoose";

const  connectDB=async()=>{
   try{
await mongoose.connect(process.env.DB_URI)
console.log("MongoDB connected Successfully")
   } catch{
    console.log("unable to connect to mongodb")
    process.exit(1)
   }
}

export default connectDB