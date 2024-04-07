import psutil
import json
import time
import GPUtil
from flask import Flask, render_template
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # 添加CORS中间件，允许所有域的跨域请求

def get_GPU_info():
    # 获取所有可用的 GPU
    gpus = GPUtil.getGPUs()
    count = 0
    t_memory = 0
    t_memory_usage = 0
    # 遍历每个 GPU
    for gpu in gpus:
        count = count + 1
        t_memory = t_memory + gpu.memoryTotal/1024
        t_memory_usage = t_memory_usage + gpu.memoryUsed/1024
    t_memory_precent = round(t_memory_usage/t_memory,2)
    return count,t_memory,t_memory_precent

@app.route('/system-info')
def get_system_info():
    # 获取CPU信息
    cpu_count = psutil.cpu_count()
    cpu_usage = psutil.cpu_percent(interval=1)
    
    # 获取内存信息
    memory = psutil.virtual_memory()
    memory_total = round(memory.total / (1024 * 1024 * 1024), 2)  # 转换为GB并保留两位小数
    memory_used = round(memory.used / (1024 * 1024 * 1024), 2)    # 转换为GB并保留两位小数
    
    # 获取硬盘信息
    disk = psutil.disk_usage('/')
    disk_total = round(disk.total / (1024 * 1024 * 1024), 2)      # 转换为GB并保留两位小数
    disk_used = round(disk.used / (1024 * 1024 * 1024), 2)        # 转换为GB并保留两位小数
    # 获取GPU信息
    count,t_memory,t_memory_precent = get_GPU_info()
    # 构造要传递给HTML的数据字典
    system_info = {
        'cpu_count': cpu_count,
        'cpu_usage': cpu_usage,
        'cpu_memory_total': memory_total,
        'cpu_memory_used': memory_used,
        'gpu_count': count,
        'gpu_memory': t_memory,
        'gpu_usage': t_memory_precent,
        'disk_total': disk_total,
        'disk_used': disk_used
    }
    return json.dumps(system_info)
if __name__ == '__main__':
    app.run(debug=True,port=5010)
