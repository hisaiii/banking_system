import { userModel } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { tokenBlackListModel } from "../models/blacklist.model.js"
const authMiddleware = async (req, res, next) => {

    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access,token is missing"
        })
    }
    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        req.user = user
        return next()

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access,token is invalid"
        })
    }
}

const systemUserMiddleware = async (req, res, next) => {
    const token = req.cookies.jwt_token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access,token invalid"

        })

    }
    const isBlacklisted = await tokenBlackListModel.findOne({ token })

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access,not a system user"

            })
        }
        req.username = user
        return next()

    } catch (err) {

        return res.status(401).json({
            message: "Unauthorized access, token invalid"

        })
    }
}

export { authMiddleware, systemUserMiddleware }