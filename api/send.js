const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function loadConfig() {
    const configPath = path.join(process.cwd(), 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: '只支持POST' });

    try {
        const { student_id, name, email, number } = req.body;
        if (!student_id || !name || !email || !number) {
            return res.status(400).json({ success: false, message: '信息不完整' });
        }

        const num = parseInt(number);
        if (num < 1 || num > 100) {
            return res.status(400).json({ success: false, message: '图纸编号无效' });
        }

        const config = loadConfig();
        const cadPath = path.join(process.cwd(), 'cad_images', `${num}.dwg`);
        if (!fs.existsSync(cadPath)) {
            return res.status(404).json({ success: false, message: `第${num}号CAD图纸文件不存在` });
        }

        const transporter = nodemailer.createTransport({
            host: config.smtp_server,
            port: config.smtp_port,
            secure: false,
            auth: {
                user: config.sender_email,
                pass: config.sender_password,
            },
        });

        await transporter.sendMail({
            from: config.sender_email,
            to: email,
            subject: `恭喜摇中第${num}号CAD图纸`,
            text: `亲爱的${name}同学（学号：${student_id}）：\n\n恭喜您摇中了第${num}号CAD图纸！\n附件为对应的CAD图纸文件，请查收。\n\n祝学习进步！`,
            attachments: [{ filename: `${num}.dwg`, path: cadPath }],
        });

        return res.status(200).json({ success: true, message: `第${num}号CAD图纸已发送至${email}，请查收邮箱！` });
    } catch (err) {
        console.error('发送失败:', err.message);
        return res.status(500).json({ success: false, message: '发送失败：' + err.message });
    }
};
