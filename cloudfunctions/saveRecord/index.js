const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
    const { studentId, name, email, number } = event;

    if (!studentId || !name || !email || !number) {
        return { success: false, message: '信息不完整' };
    }

    const num = parseInt(number);
    if (num < 1 || num > 100) {
        return { success: false, message: '图纸编号无效（1-100）' };
    }

    try {
        const existCheck = await db.collection('lottery_records')
            .where({ email })
            .count();

        if (existCheck.total > 0) {
            return {
                success: false,
                message: '该邮箱已摇过号，不能重复摇号',
            };
        }

        const wxContext = cloud.getWXContext();
        const result = await db.collection('lottery_records').add({
            data: {
                studentId,
                name,
                email,
                number: num,
                openid: wxContext.OPENID,
                downloadTime: db.serverDate(),
                status: '已下载',
            }
        });

        return {
            success: true,
            message: `摇号成功，第${num}号图纸记录已保存`,
            recordId: result._id,
        };
    } catch (err) {
        console.error('操作失败:', err);
        return { success: false, message: '操作失败: ' + err.message };
    }
};
