module.exports = {
    apps: [
        {
            name: "affine-dashboard",
            script: "./server/index.js",
            instances: "4",
            exec_mode: "cluster",
            // 禁用文件监控，避免重启循环
            watch: false,
            // 忽略日志文件变化，防止无限重启
            ignore_watch: [
                "node_modules",
                "logs",
                "*.log",
            ],
            // PM2日志配置 - 使用不同路径避免冲突
            out_file: "/dev/null",
            error_file: "/dev/null",
            log_file: "/dev/null",
            // 合并日志输出
            merge_logs: true,
            // 实例变量用于日志区分
            instance_var: "INSTANCE_ID",
            env: {
                PORT: 3001,
                NODE_ENV: "production",
                LOG_LEVEL: "info"
            },
            env_production: {
                NODE_ENV: "production",
                LOG_LEVEL: "warn"
            },
            // 重启策略
            max_restarts: 5,
            min_uptime: "10s",
            max_memory_restart: "2G",
            // 避免快速重启
            restart_delay: 4000
        },
    ]
}