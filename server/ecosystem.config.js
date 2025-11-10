// PM2 cluster mode configuration file
// Used to run Express API service in production environment, fully utilizing multi-core CPU resources

module.exports = {
  apps: [{
    name: 'affine-dashboard-api',
    script: './index.js',

    // Instance configuration - cluster mode
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Cluster mode for load balancing

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // Development environment variables (optional)
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      DEBUG: 'app:*'
    },

    // Log configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto restart configuration
    max_memory_restart: '1G', // Auto restart when memory exceeds 1G
    min_uptime: '10s', // Minimum uptime to avoid frequent restarts
    max_restarts: 10, // Maximum restart count
    restart_delay: 4000, // Restart delay

    // Cluster mode specific configuration
    kill_timeout: 5000, // Force kill timeout
    listen_timeout: 3000, // Listen timeout

    // Health check configuration
    health_check_grace_period: 3000, // Health check grace period

    // Monitoring configuration
    pmx: true, // Enable PMX monitoring
    instance_var: 'INSTANCE_ID', // Instance variable name

    // Advanced configuration
    node_args: '--max-old-space-size=1024', // Node.js memory limit

    // Wait time before startup (ensure database is ready)
    wait_ready: true,
    listen_timeout: 10000,

    // Error handling
    autorestart: true, // Auto restart
    watch: false, // Do not watch file changes in production environment
    ignore_watch: ['node_modules', 'logs'],

    // Process name
    name_prefix: 'prod',

    // Timestamp
    time: true,

    // Log rotation (requires pm2-logrotate plugin)
    log_type: 'json'
  }]
};