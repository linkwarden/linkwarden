import { createTransport } from "nodemailer";

export default createTransport({
  url: process.env.EMAIL_SERVER,
  auth: {
    user: process.env.EMAIL_FROM,
  },
});
