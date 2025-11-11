module.exports = {
  apps: [{
    name: 'affine-dashboard-api',
    script: './index.cjs',
    instances: '2', // Use all available CPU cores
    exec_mode: 'cluster', // Cluster mode for load balancing

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // Development environment
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      POSTGRES_SSL_ENABLED: 'false'
    },

    // Log configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto restart configuration
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,

    // Cluster mode configuration
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Health check and monitoring
    health_check_grace_period: 3000,

    // Advanced settings
    node_args: '--max-old-space-size=1024',

    // Watch configuration for development
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],

    // Instance variables
    instance_var: 'NODE_APP_INSTANCE',

    // Process naming
    name_prefix: 'api-worker',

    // Restart delay
    restart_delay: 4000
  }]
};