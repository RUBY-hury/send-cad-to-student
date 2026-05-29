const app = getApp();

const TOTAL_NUMBERS = 100;

Page({
    data: {
        studentId: '',
        name: '',
        email: '',
        resultNumber: null,
        spinning: false,
        downloading: false,
        statusType: '',
        statusIcon: '',
        statusMessage: '',
        history: [],
    },

    onLoad() {
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.animFrameId = null;
        this.wheelRadius = 0;
        this.centerX = 0;
        this.centerY = 0;
        this._initCanvas();
    },

    onUnload() {
        if (this.animFrameId) {
            this.canvas.cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    },

    _initCanvas() {
        const query = wx.createSelectorQuery();
        query.select('#wheelCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res[0]) {
                    setTimeout(() => this._initCanvas(), 200);
                    return;
                }
                const canvas = res[0].node;
                const dpr = wx.getSystemInfoSync().pixelRatio;
                const width = res[0].width;
                const height = res[0].height;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);

                this.canvas = canvas;
                this.ctx = ctx;
                this.canvasWidth = width;
                this.canvasHeight = height;
                this.centerX = width / 2;
                this.centerY = height / 2;
                this.wheelRadius = Math.min(width, height) / 2 - 30;
                this._drawWheel(this.currentAngle);
            });
    },

    _drawWheel(angle) {
        const ctx = this.ctx;
        if (!ctx) return;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.wheelRadius;

        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // outer glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240, 192, 64, 0.06)';
        ctx.fill();
        ctx.restore();

        // outer ring shadow
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240, 192, 64, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // draw segments
        const segAngle = (2 * Math.PI) / TOTAL_NUMBERS;
        for (let i = 1; i <= TOTAL_NUMBERS; i++) {
            const startA = angle + (i - 1) * segAngle - Math.PI / 2;
            const endA = startA + segAngle;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startA, endA);
            ctx.closePath();

            const isEven = i % 2 === 0;
            const gradient = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
            if (isEven) {
                gradient.addColorStop(0, 'rgba(240,192,64,0.15)');
                gradient.addColorStop(0.7, 'rgba(240,192,64,0.3)');
                gradient.addColorStop(1, 'rgba(240,192,64,0.5)');
            } else {
                gradient.addColorStop(0, 'rgba(197,144,32,0.1)');
                gradient.addColorStop(0.7, 'rgba(197,144,32,0.25)');
                gradient.addColorStop(1, 'rgba(197,144,32,0.45)');
            }
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(startA), cy + r * Math.sin(startA));
            ctx.strokeStyle = 'rgba(26,26,46,0.6)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();

            const midA = startA + segAngle / 2;
            const textR = r - 28;
            const tx = cx + textR * Math.cos(midA);
            const ty = cy + textR * Math.sin(midA);

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(midA + Math.PI / 2);
            ctx.fillStyle = i % 10 === 0 ? '#ffffff' : '#ccd6f6';
            ctx.font = 'bold 16rpx sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i), 0, 0);
            ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 46, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240,192,64,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 50, 0, Math.PI * 2);
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r - 50);
        innerGrad.addColorStop(0, 'rgba(15,12,41,0.95)');
        innerGrad.addColorStop(1, 'rgba(26,26,46,0.9)');
        ctx.fillStyle = innerGrad;
        ctx.fill();
        ctx.restore();
    },

    onStudentIdInput(e) { this.setData({ studentId: e.detail.value }); },
    onNameInput(e) { this.setData({ name: e.detail.value }); },
    onEmailInput(e) { this.setData({ email: e.detail.value }); },

    onSpin() {
        if (this.data.spinning) return;

        const { studentId, name, email } = this.data;
        if (!studentId.trim()) {
            wx.showToast({ title: '请输入学号', icon: 'none' });
            return;
        }
        if (!name.trim()) {
            wx.showToast({ title: '请输入姓名', icon: 'none' });
            return;
        }
        if (!email.trim()) {
            wx.showToast({ title: '请输入邮箱', icon: 'none' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
            return;
        }

        const targetNum = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
        const segAngle = (2 * Math.PI) / TOTAL_NUMBERS;
        const numCenterAngle = (targetNum - 1) * segAngle + segAngle / 2;
        const targetAngleOffset = -Math.PI / 2 - numCenterAngle;
        const fullSpins = (4 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        this.targetAngle = this.currentAngle + fullSpins + targetAngleOffset;

        this.setData({
            spinning: true,
            resultNumber: null,
            statusType: '',
            statusIcon: '',
            statusMessage: '',
        });

        const startAngle = this.currentAngle;
        const totalDuration = 5000 + Math.random() * 2000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            this.currentAngle = startAngle + (this.targetAngle - startAngle) * eased;
            this._drawWheel(this.currentAngle);

            if (progress < 1) {
                this.animFrameId = this.canvas.requestAnimationFrame(animate);
            } else {
                this.currentAngle = this.targetAngle;
                this.animFrameId = null;
                this._drawWheel(this.targetAngle);
                this._onSpinComplete(targetNum);
            }
        };
        this.animFrameId = this.canvas.requestAnimationFrame(animate);
    },

    _onSpinComplete(number) {
        this.setData({
            spinning: false,
            resultNumber: number,
            statusType: 'info',
            statusIcon: '⏳',
            statusMessage: `已摇中第${number}号图纸，正在验证...`,
        });
        this._saveAndDownload(number);
    },

    async _saveAndDownload(number) {
        const { studentId, name, email } = this.data;

        try {
            const res = await wx.cloud.callFunction({
                name: 'saveRecord',
                data: {
                    studentId: studentId.trim(),
                    name: name.trim(),
                    email: email.trim(),
                    number,
                },
            });

            if (!res.result.success) {
                this.setData({
                    statusType: 'error',
                    statusIcon: '✗',
                    statusMessage: res.result.message || '操作失败',
                });
                wx.showToast({ title: res.result.message || '操作失败', icon: 'none', duration: 2500 });
                this._addHistory(number, studentId, name, false);
                return;
            }

            await this._downloadCAD(number);
        } catch (err) {
            console.error('保存记录失败:', err);
            this.setData({
                statusType: 'error',
                statusIcon: '✗',
                statusMessage: '网络异常，请稍后重试',
            });
            wx.showToast({ title: '网络异常', icon: 'error' });
        }
    },

    async _downloadCAD(number) {
        const prefix = app.globalData.cloudFilePrefix;
        const fileID = `${prefix}${number}.dwg`;

        this.setData({
            statusType: 'info',
            statusIcon: '⏳',
            statusMessage: `第${number}号图纸下载中...`,
            downloading: true,
        });

        try {
            const downloadRes = await wx.cloud.downloadFile({ fileID });
            const fs = wx.getFileSystemManager();
            const savedPath = `${wx.env.USER_DATA_PATH}/${number}.dwg`;

            await new Promise((resolve, reject) => {
                fs.saveFile({
                    tempFilePath: downloadRes.tempFilePath,
                    filePath: savedPath,
                    success: resolve,
                    fail: reject,
                });
            });

            const { studentId, name } = this.data;
            this.setData({
                statusType: 'success',
                statusIcon: '✓',
                statusMessage: `第${number}号图纸已下载到手机存储`,
            });

            this._addHistory(number, studentId, name, true);
        } catch (err) {
            console.error('下载CAD失败:', err);
            this.setData({
                statusType: 'error',
                statusIcon: '✗',
                statusMessage: '下载失败，请检查云存储中是否有该图纸文件',
            });
            this._addHistory(number, this.data.studentId, this.data.name, false);
            wx.showToast({ title: '下载失败', icon: 'error' });
        } finally {
            this.setData({ downloading: false });
        }
    },

    _addHistory(number, studentId, name, success) {
        this.setData({
            history: [{
                number,
                name: name.trim(),
                studentId: studentId.trim(),
                email: this.data.email.trim(),
                success,
                time: Date.now(),
            }, ...this.data.history.slice(0, 19)],
        });
    },
});
