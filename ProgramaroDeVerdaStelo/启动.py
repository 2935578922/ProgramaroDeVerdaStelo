import os
import subprocess
import webbrowser
import tkinter as tk
from tkinter import ttk
import re
import threading
import socket
import time

base_dir = os.path.dirname(__file__)
os.chdir(base_dir)
dotnet_proc = None
found_url = None

def log(msg):
    log_text.insert(tk.END, msg + "\n")
    log_text.see(tk.END)
    root.update_idletasks()

def kill_process_by_port(port: int):
    try:
        result = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True)
        lines = result.decode("gbk").splitlines()
        for line in lines:
            parts = line.strip().split()
            if len(parts)>=5:
                pid = parts[-1]
                subprocess.call(f'taskkill /F /PID {pid}', shell=True)
                log(f"✅ 清理端口{port}占用进程 PID={pid}")
    except subprocess.CalledProcessError:
        log(f"ℹ️ 端口{port}无占用")

def is_port_open(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(0.3)
    try:
        return sock.connect_ex((host, port)) == 0
    finally:
        sock.close()

def parse_url(raw_url):
    if raw_url.startswith("https://"):
        h = raw_url.replace("https://","").split(":")
    else:
        h = raw_url.replace("http://","").split(":")
    host = h[0]
    port = int(h[1])
    return host, port

def read_dotnet_output():
    global dotnet_proc, found_url
    pattern = re.compile(rb"(https?://(127\.0\.0\.1|localhost):\d+)")
    # 端口占用错误匹配
    port_used_err = re.compile(rb"address already in use")
    log("🚀 启动 dotnet watch，等待捕获服务地址...")
    while True:
        raw_line = dotnet_proc.stdout.readline()
        if not raw_line:
            break
        try:
            txt = raw_line.decode("utf-8")
        except:
            txt = raw_line.decode("gbk", errors="replace")
        log(txt.strip())

        # 检测端口占用报错，重置捕获标记，等待下一次地址
        if port_used_err.search(raw_line):
            log("\n⚠️ 检测到端口占用！等待dotnet重试...")
            found_url = None

        if found_url is None:
            m = pattern.search(raw_line)
            if m:
                found_url = m.group(1).decode("utf-8")
                log(f"\n🎉 捕获到服务地址：{found_url}")
                host, port = parse_url(found_url)
                def wait_and_open():
                    max_wait =15
                    start = time.time()
                    success = False
                    while time.time()-start < max_wait:
                        if is_port_open(host, port):
                            log(f"✅ 端口{port}就绪，打开浏览器")
                            webbrowser.open(found_url)
                            success = True
                            return
                        time.sleep(0.4)
                    if not success:
                        log(f"❌ 等待{max_wait}秒，端口监听失败，不打开浏览器")
                threading.Thread(target=wait_and_open, daemon=True).start()

def stop_server():
    global dotnet_proc
    if dotnet_proc is not None:
        try:
            dotnet_proc.terminate()
            dotnet_proc.wait(timeout=2)
            log("\n🛑 dotnet watch 进程已终止")
        except:
            dotnet_proc.kill()
    root.destroy()

def on_closing():
    stop_server()

def start_server():
    global dotnet_proc
    log("=== 启动Blazor服务 ===")
    # 【新增】启动前强制杀死所有dotnet进程，释放端口
    try:
        subprocess.run("taskkill /F /IM dotnet.exe", shell=True, capture_output=True)
        log("🧹 前置清理：杀死全部残留 dotnet.exe")
    except Exception as e:
        log(f"ℹ️ 前置清理无残留dotnet")

    dotnet_proc = subprocess.Popen(
        ["dotnet", "watch"],
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    threading.Thread(target=read_dotnet_output, daemon=True).start()

# TK窗口
root = tk.Tk()
root.title("Blazor动态端口管理器")
root.geometry("580x340")
root.protocol("WM_DELETE_WINDOW", on_closing)

log_text = tk.Text(root, height=12)
log_text.pack(padx=8, pady=5, fill=tk.BOTH, expand=True)

btn_frame = ttk.Frame(root)
btn_frame.pack(pady=5)
stop_btn = ttk.Button(btn_frame, text="关闭服务", command=stop_server)
stop_btn.pack()

start_server()
root.mainloop()
