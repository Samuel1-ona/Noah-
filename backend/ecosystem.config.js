/**
 * PM2 Ecosystem File — Noah Backend Relayer Server
 * Usage:
 *   pm2 start ecosystem.config.js            # start
 *   pm2 start ecosystem.config.js --env prod  # start in production mode
 *   pm2 save && pm2 startup                   # persist across reboots
 */
module.exports = {
  apps: [
    {
      name: 'noah-backend',
      script: './dist/server.js',
      instances: 1,           // Single instance — relayer nonce management requires this
      exec_mode: 'fork',
      watch: false,

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,    // 3 s between restarts
      min_uptime: '10s',

      // Memory limit — restart if exceeded
      max_memory_restart: '512M',

      // Environment — development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug',
      },

      // Environment — production (use with --env prod)
      env_prod: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info',
      },

      // Log files
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown
      kill_timeout: 10000,    // 10 s before force kill
      listen_timeout: 8000,
    },
  ],
};
