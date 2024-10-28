import { transporter } from "../utils/email.config.js";
import { Verification_Email_Template } from "../utils/email.templete.js";

const sendVerificationEamil = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"Nawabi Dinest Cafe" <hamayunsaeed48@gmail.com>',

      to: email, // list of receivers
      subject: "Verify your Email", // Subject line
      text: "Verify your Email", // plain text body
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode
      ),
    });
    console.log("Email send Successfully", response);
  } catch (error) {
    console.log("Email error", error);
  }
};

export { sendVerificationEamil };
