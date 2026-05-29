const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ExcelJS = require('exceljs');

exports.main = async (event, context) => {
    try {
        const MAX_LIMIT = 100;
        const countResult = await db.collection('lottery_records').count();
        const total = countResult.total;
        const batchTimes = Math.ceil(total / MAX_LIMIT);
        const tasks = [];

        for (let i = 0; i < batchTimes; i++) {
            tasks.push(
                db.collection('lottery_records')
                    .skip(i * MAX_LIMIT)
                    .limit(MAX_LIMIT)
                    .orderBy('downloadTime', 'desc')
                    .get()
            );
        }

        const results = await Promise.all(tasks);
        let records = [];
        results.forEach(res => {
            records = records.concat(res.data);
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('摇号记录');

        sheet.columns = [
            { header: '序号', key: 'seq', width: 8 },
            { header: '学号', key: 'studentId', width: 18 },
            { header: '姓名', key: 'name', width: 12 },
            { header: '邮箱', key: 'email', width: 28 },
            { header: '图纸编号', key: 'number', width: 12 },
            { header: '下载时间', key: 'downloadTime', width: 22 },
            { header: '状态', key: 'status', width: 10 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
        };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 24;

        records.forEach((record, index) => {
            const row = sheet.addRow({
                seq: index + 1,
                studentId: record.studentId,
                name: record.name,
                email: record.email || '',
                number: record.number,
                downloadTime: record.downloadTime
                    ? new Date(record.downloadTime).toLocaleString('zh-CN')
                    : '',
                status: record.status || '已下载',
            });
            row.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const now = new Date();
        const fileName = `摇号记录_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

        const uploadResult = await cloud.uploadFile({
            cloudPath: `exports/${fileName}`,
            fileContent: buffer,
        });

        return {
            success: true,
            message: `已导出 ${records.length} 条记录`,
            fileID: uploadResult.fileID,
            fileName: fileName,
        };
    } catch (err) {
        console.error('导出Excel失败:', err);
        return { success: false, message: '导出失败: ' + err.message };
    }
};
