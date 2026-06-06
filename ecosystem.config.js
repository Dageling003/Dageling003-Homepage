// PM2 Ecosystem 配置文件
// 使用：pm2 start ecosystem.config.js
// 停止：pm2 stop Dageling003-Homepage-api
// 日志：pm2 logs Dageling003-Homepage-api

module.exports = {
  apps: [
    {
      name: 'Dageling003-Homepage-api',
      script: 'dist/main.js',
      cwd: './apps/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      // 日志配置
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 自动重启
      max_restarts: 10,
      restart_delay: 3000,
      // 内存限制，超出自动重启
      max_memory_restart: '500M',
    },
  ],
}
