import { User } from "../models/User.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookies } from "../utils/generateTokenAndSetCookies.js";
import crypto from "crypto"

import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, WELCOME_TEMPLATE } from "../mailtrap/emailTemplate.js";
import { mailSender } from "../mailtrap/mailtrap.js";





export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        //check some validation
        if (!email || !password || !name) {
            return res.status(403).send({
                success: false,
                message: "All fields are required",
            })
        }



        //check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists, please signup to continue",
            })
        }

        //hash the password

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        })

        //use jwt
        generateTokenAndSetCookies(res, user._id);

        //Send Verification mail
        // await sendVerificationEmail(user.email, verificationToken);
        await mailSender(user.email, "Verify Your Mail",
            VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken)
        )

        await user.save();

        res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again.",
        })
    }
}

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or Expired verification token"
            })
        }

        user.isVerified = true
        user.verificationToken = undefined
        user.verificationTokenExpiresAt = undefined
        await user.save();

        await mailSender(user.email, "Welcome To APP",
            WELCOME_TEMPLATE(user.name)
        )

        return res.status(200).json({
            success: true,
            messgae: "verified Successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Email not verified"
        })
    }
}
export const login = async (req, res) => {
    try {
        // Get email and password from request body
        const { email, password } = req.body

        // Check if email or password is missing
        if (!email || !password) {
            // Return 400 Bad Request status code with error message
            return res.status(400).json({
                success: false,
                message: `Please Fill up All the Required Fields`,
            })
        }

        // Find user with provided email
        const user = await User.findOne({ email });
        // If user not found with provided email
        if (!user) {
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success: false,
                message: `User is not Registered with Us Please SignUp to Continue`,
            })
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Password"
            })
        }

        generateTokenAndSetCookies(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: false,
            message: "Logges in Successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        })
    } catch (error) {
        console.log("Error in Login", error);
        return res.status(400).json({
            success: false,
            message: error.message
        })

    }
}
export const logout = async (req, res) => {
    res.clearCookie("token")
    return res.status(200).json({
        success: true,
        message: "Log Out Successfully"
    })
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await  User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        //gemerate reste token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000 //1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;

        await user.save();

        //send mail

        await mailSender(user.email, "Forgot Password",
            PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", `${process.env.CLIENT_URL}/reset-password/${resetToken}`)
        )

        return res.status(200).json({
            success: true,
            message: "Password Reset link sent to tour mail"
        });

    } catch (error) {
        console.log("Erorr in reset Passowrd", error);

        res.status(400).json({

            success: false,
            message: error.message
        })
    }
}

export const resetPassword = async(req,res) =>{
    try{
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpiresAt: {$gt: Date.now()},
        });

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        //update Password
        const hashedPassword = await bcryptjs.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiresAt = undefined

        await user.save();

        //sent success mail

        await mailSender(user.email, "Reset Successfully",
            PASSWORD_RESET_SUCCESS_TEMPLATE
        )

        return res.status(200).json({
            success: true,
            message: "Password reset Successfully",
        })
    }catch(error){
        console.log("error in confirmation of reset password", error);
        
        return res.status(400).json({
            success: false,
            messgae: error.message
        })
    }
}

export const checkAuth = async (req,res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if(!user){
            return res.status(400).json({
                success: false,
                message: "user not found"
            })
        }
        res.status(200).json({
            success:true,
            user
        });
    } catch (error) {
        console.log("Error in checkAuth", error);
        res.status(401).json({
            success: false,
            message: error.message
        })
        
    }
}