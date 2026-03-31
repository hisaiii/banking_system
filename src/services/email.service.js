import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

/*
CREATE TRANSPORTER (OAuth2 Gmail)
*/

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        type: "OAuth2",

        user: process.env.EMAIL_USER,

        clientId: process.env.CLIENT_ID,

        clientSecret: process.env.CLIENT_SECRET,

        refreshToken: process.env.REFRESH_TOKEN,
    },

})


// VERIFY EMAIL SERVER CONNECTION


transporter.verify((error, success) => {

    if (error) {
        console.error("❌ Error connecting to email server:", error)
    }

    else {
        console.log("✅ Email server ready to send messages")
    }

})


/*
GENERIC EMAIL SENDER FUNCTION
*/

const sendEmail = async (to, subject, text, html) => {

    try {

        const info = await transporter.sendMail({

            from: `"Backend Ledger 🚀" <${process.env.EMAIL_USER}>`,

            to,

            subject,

            text,

            html,

        })

        console.log("📩 Message sent:", info.messageId)

    }

    catch (error) {

        console.error("❌ Error sending email:", error.message)

    }

}


/*
WELCOME EMAIL TEMPLATE FUNCTION
*/

const sendRegistrationEmail = async (userEmail, name) => {

    const subject = "🚀 Welcome to Backend Ledger"

    const text = `
Hello ${name},

Welcome to Backend Ledger 🚀

You can now:
- Track transactions
- Manage financial activity securely
- Monitor your ledger anytime

Start exploring today!

Best regards,
Backend Ledger Team
`

    const html = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">

<div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

<div style="background:#4f46e5; color:white; padding:20px; text-align:center;">
<h1>🚀 Welcome to Backend Ledger</h1>
<p>Your smart finance tracking companion</p>
</div>

<div style="padding:25px; color:#333;">

<h2>Hello ${name} 👋</h2>

<p>
We're excited to have you onboard! Backend Ledger helps you manage
transactions securely and efficiently.
</p>

<div style="background:#eef2ff; padding:15px; border-radius:8px; margin:20px 0;">

<strong>Here’s what you can do now:</strong>

<ul>
<li>📊 Track transactions</li>
<li>🔐 Secure your financial records</li>
<li>⚡ Monitor activity in real time</li>
</ul>

</div>

<div style="text-align:center; margin:25px 0;">

<a href="#"
style="background:#4f46e5; color:white; padding:12px 25px;
text-decoration:none; border-radius:6px; font-weight:bold;">

Open Dashboard

</a>

</div>

<p>
Cheers,<br>
<strong>Backend Ledger Team</strong>
</p>

</div>

<div style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#555;">

© ${new Date().getFullYear()} Backend Ledger

</div>

</div>

</div>
`

    await sendEmail(userEmail, subject, text, html)

}
async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

export { sendRegistrationEmail ,sendTransactionEmail,sendTransactionFailureEmail}

