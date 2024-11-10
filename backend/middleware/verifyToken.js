import jwt from "jsonwebtoken"
export const verifyToken = async (req,res,next)=>{
    try{
        const token = req.cookies.token

        if(!token){
            return res.status(401).json({
                success: false,
                messgae: "Unauthorized - no token provided"
            })
        }

        const decode = await jwt.verify(token, process.env.JWT_SECRET)
        
        if(!decode){
            return res.status(401).json({
                success: false,
                messgae: "Invalid token",
            })
        }
        req.userId = decode.userId
        console.log(decode);
        next();
    }catch(error){
        // If there is an error during the authentication process, return 401 Unauthorized response
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
    }
}