App({
    onLaunch() {
        wx.cloud.init({
            env: '你的云开发环境ID',
            traceUser: true,
        });
    },
    globalData: {
        // 云存储中CAD文件的fileID前缀
        // 在云开发控制台 → 存储 → 上传100个.dwg文件后
        // 复制任意一个文件的fileID，去掉末尾的"数字.dwg"部分即可
        cloudFilePrefix: 'cloud://你的环境ID.636f-cad_images/',
    }
});
