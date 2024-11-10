// import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplate.js";
// import { mailtrapClient, sender } from "./mailtrap.js";

// export const sendVerificationEmail = async (email, verificationToken) =>{
//     const recipient = [{email}];

//     try{
//         const response = await mailtrapClient.send({
//             from:sender,
//             to: recipient,
//             subject: "Verify your email",
//             html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
//             category: "Email Verification"
//         })
//         console.log("Email", response);
        
//     }catch(error){
//         console.log("Eror Verification Email", error);
        
//         throw new Error(`Error verification email: ${error}`);
//     }
// }


