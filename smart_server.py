#!/usr/bin/env python3
"""
Smart HTTP Server that automatically terminates when browser disconnects
or when quit endpoint is accessed.
"""

import http.server
import socketserver
import threading
import time
import sys
import os
import signal
from urllib.parse import urlparse, parse_qs

class SmartHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
    def log_message(self, format, *args):
        # Log requests to track activity
        print(f"[{time.strftime('%H:%M:%S')}] {format % args}")
        
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle quit endpoint
        if parsed_path.path == '/quit':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "Server shutting down..."}')
            
            print("\n🚪 Quit endpoint called - shutting down server...")
            # Schedule shutdown in a separate thread
            threading.Thread(target=self.delayed_shutdown, daemon=True).start()
            return
            
        # Handle ping endpoint for heartbeat
        elif parsed_path.path == '/ping':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "alive"}')
            return
            
        # Handle normal file serving
        else:
            super().do_GET()
            
    def delayed_shutdown(self):
        time.sleep(0.5)  # Give time for response to be sent
        os._exit(0)  # Force exit

class SmartServer:
    def __init__(self, port=8080):
        self.port = port
        self.httpd = None
        self.last_request_time = time.time()
        self.heartbeat_thread = None
        self.running = True
        
    def start(self):
        try:
            # Create server
            self.httpd = socketserver.TCPServer(("", self.port), SmartHTTPRequestHandler)
            print(f"🚀 Smart server starting on http://localhost:{self.port}")
            print("📱 Server will auto-quit when:")
            print("   • Browser tab is closed (after 30s timeout)")
            print("   • Quit button is clicked")
            print("   • Ctrl+C is pressed")
            print()
            
            # Start heartbeat monitor in background
            self.heartbeat_thread = threading.Thread(target=self.monitor_heartbeat, daemon=True)
            self.heartbeat_thread.start()
            
            # Handle Ctrl+C gracefully
            signal.signal(signal.SIGINT, self.signal_handler)
            
            # Serve forever
            self.httpd.serve_forever()
            
        except KeyboardInterrupt:
            self.shutdown()
        except Exception as e:
            print(f"❌ Error starting server: {e}")
            
    def monitor_heartbeat(self):
        """Monitor for browser disconnection"""
        timeout_seconds = 30
        
        while self.running:
            time.sleep(5)  # Check every 5 seconds
            
            # Check if we've had any recent activity
            if time.time() - self.last_request_time > timeout_seconds:
                print(f"\n⏰ No browser activity for {timeout_seconds}s - assuming browser closed")
                print("🚪 Auto-shutting down server...")
                self.shutdown()
                break
                
    def update_last_request_time(self):
        self.last_request_time = time.time()
        
    def signal_handler(self, signum, frame):
        print("\n\n🛑 Ctrl+C pressed - shutting down server...")
        self.shutdown()
        
    def shutdown(self):
        self.running = False
        if self.httpd:
            try:
                self.httpd.shutdown()
                self.httpd.server_close()
            except:
                pass
        print("✅ Server stopped successfully")
        sys.exit(0)

if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Usage: python smart_server.py [port]")
            sys.exit(1)
    
    server = SmartServer(port)
    server.start()