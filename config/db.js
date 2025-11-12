import mongoose from "mongoose"

const connectDD = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Connected successfully')

    } catch (error) {
    console.log("Failed to connect.")
    }
}

export {connectDD}