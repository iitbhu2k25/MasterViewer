import multiprocessing
workers = int(multiprocessing.cpu_count()/2)+1
threads = 1
bind = "0.0.0.0:7000"
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 60
keepalive = 30
loglevel = "info"
max_requests = 1000
max_requests_jitter = 100