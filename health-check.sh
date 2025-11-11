#!/bin/sh

# 简单的健康检查脚本
curl -f http://localhost:80/ || exit 1