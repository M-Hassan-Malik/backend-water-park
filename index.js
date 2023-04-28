const express = require('express')
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Karachi');
const app = express()
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    next()
})
require('dotenv').config();

const { User, Otp } = require('./databases/index');




app.post('/create-user', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const newUser = new User({
            name,
            email,
            password
        });

        const user = await newUser.save()
            .catch(err => {
                const error = new Error(err.message);
                error.code = err.code;
                throw error
            }
            );

        return res.status(500).json({ data: { user: user }, code: 200, status: 'Success' })
    } catch (e) {

        return res.status(500).json({ data: e.message, code: e.code, status: 'failed' })
    }
})
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email, password: password })
            .catch(err => {
                const error = new Error(err.message);
                error.code = err.code;
                throw error
            });
        if (!user) {
            const error = new Error('Authentication failed');
            error.code = 404;
            throw error
        }

        return res.status(200).json({ data: null, code: 200, status: 'Success' })
    } catch (e) {
        return res.status(500).json({ data: e.message, code: e.code, status: 'failed' })
    }


})

app.post('/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email }).catch(err => {
            const error = new Error(err.message);
            error.code = err.code;
            throw error
        });
        if (!user) {
            const error = new Error('Something went wrong');
            error.code = 404;
            throw error
        }

        const nodemailer = require("nodemailer");
        const OTP = Math.floor(1000 + Math.random() * 9000);
        let emailTo = email.replace(/\s/g, "");
        const transporter = nodemailer.createTransport({
            service: "outlook",
            auth: {
                user: process.env.NOTIFICATION_EMAIL,
                pass: process.env.NOTIFICATION_PASS,
            },
        });
        const options = {
            from: process.env.NOTIFICATION_EMAIL,
            to: emailTo,
            subject: "OTP - Verification",
            html: `<div style="background-color: #1a1a1a; color: #fff; font-family: 'Roboto', sans-serif; font-size: 16px; padding: 20px;">
            <h2 style="font-size: 24px; margin-bottom: 20px;">Your OTP code is:</h2>
            <p style="font-size: 32px; font-weight: bold; margin-bottom: 40px;">${OTP}</p>
            <p style="margin-bottom: 0;">Please use this code to complete your verification process.</p>
            <p style="margin-bottom: 0;">Note: This code is valid for one-time use only and will expire in 10 minutes.</p>
          </div>`,
        };

        transporter.sendMail(options, async (err, result) => {
            if (err) {
                return res.status(500).json({ data: `Something when wrong: ${err.message}`, code: err.code, status: 'failed' });
            } else {

                const saveOtp = new Otp({
                    otp: OTP,
                    validity: moment().add(10, 'minutes').toDate()
                })

                await saveOtp.save()
                    .catch(err => {
                        const error = new Error(err.message);
                        error.code = err.code;
                        throw error
                    });

                return res.status(200).json({
                    data: {
                        msg: `An verification OTP-code is sent to your email check/verify it please.`,
                        otp: OTP,
                    },
                    status: "Success",
                    code: 200,
                });
            }
        });
    } catch (e) {
        return res.status(500).json({ data: e.message, code: e.code, status: 'failed' })
    }
})

app.post('/otp', async (req, res) => {
    try {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000);

        const { otp } = req.body;
        const saveOtp = await Otp.findOne({ otp: otp, validity: { $gte: moment().toDate() } }).catch(err => {
            const error = new Error(err.message);
            error.code = err.code;
            throw error
        });
        if (!saveOtp) {
            const error = new Error('Invalid OTP');
            error.code = 404;
            throw error
        }
        const updated = await Otp.updateOne({ otp: generatedOtp }).catch(err => {
            const error = new Error(err.message);
            error.code = err.code;
            throw error
        });
        if (!updated.matchedCount && !updated.modifiedCount) {
            const error = new Error('Something Wend wrong, try again');
            error.code = err.code;
            throw error
        }
        return res.status(200).json({ data: {accessCode: generatedOtp}, code: 200, status: 'Success' })
    } catch (e) {
        return res.status(500).json({ data: e.message, code: e.code, status: 'failed' })
    }

})

app.post('/reset-password', async (req, res) => {
    try {
        const { email, password, accessCode } = req.body;

        // const saveOtp = await Otp.findOne({ otp: accessCode }).catch(err => {
        //     const error = new Error(err.message);
        //     error.code = err.code;
        //     throw error
        // });
        // if (!saveOtp) {
        //     const error = new Error('Invalid OTP');
        //     error.code = 404;
        //     throw error
        // }

        const updated = await User.updateOne({
            email: email
        }, { password: password }, { new: true }).catch(err => {
            const error = new Error(err.message);
            error.code = err.code;
            throw error
        });
        if (!updated.matchedCount && !updated.modifiedCount) {
            const error = new Error('Unable to update password');
            error.code = 404;
            throw error
        }
        return res.status(200).json({ data: null, code: 200, status: 'Success' })

    } catch (e) {
        return res.status(500).json({ data: e.message, code: e.code, status: 'failed' })
    }
})
app.use((req, res) => {
    res.send(404).json({ data: "404 not found", code: 404, status: 'Failed' })
})
// if(!process.env.NOTIFICATION_EMAIL || !process.env.NOTIFICATION_PASS || !process.env.PORT) {

// }
app.listen(process.env.PORT, () => {
    console.log("Server listening on port http://localhost:" + process.env.PORT)
})