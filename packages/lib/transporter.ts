import { createTransport } from "nodemailer";

// The SMTP credentials, if any, come from the EMAIL_SERVER url
export default createTransport({
  url: process.env.EMAIL_SERVER,
});
