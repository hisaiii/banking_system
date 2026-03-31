
import { userModel } from "../models/user.model.js"
import jwt from 'jsonwebtoken'
import { sendRegistrationEmail } from "../services/email.service.js"
import { tokenBlackListModel } from "../models/blacklist.model.js"
const generateToken = (id) => {
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "15d" })
    return token
}
const register = async (req, res) => {
    const { email, username, password } = req.body
    const userExist = await userModel.findOne({
        email: email
    })

    if (userExist) {
        return res.status(422).json({
            message: "user already exist with same email",
            status: "failed"
        })
    }
    else {
        const user = await userModel.create({
            email, username, password
        })

        const token = generateToken(user._id)
        res.cookie("jwt_token", token)
        await sendRegistrationEmail(user.email, user.username)
        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                username: user.username
            }, token
        })

    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")
    if (!user) {
        return res.status(401).json({
            message: "user does not exist"
        })
    }

    const isValid = await user.comparePassword(password)

    if (!isValid) {
        return res.status(401).json({
            message: "Invalid credantitals"
        })
    }

    const token = generateToken(user._id)
    res.cookie("jwt_token", token)
    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            username: user.username
        }, token,
        message: "user logged in successfully"
    })

}

const logout = async (req, res) => {
    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("jwt_token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}
export { register, login, logout }