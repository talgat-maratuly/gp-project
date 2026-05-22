/**
 * PM2 production process file
 * pm2 start deploy/ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'gp-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '512M',
      error_file: './logs/gp-api-error.log',
      out_file: './logs/gp-api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
}
