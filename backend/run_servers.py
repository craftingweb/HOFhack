#!/usr/bin/env python3

import subprocess
import sys
import os
import signal
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Global list to store all running processes
processes = []

def start_server(command, name, env=None):
    """Start a server process"""
    print(f"Starting {name}...")
    
    try:
        # Create a new environment with both os.environ and any additional variables
        process_env = os.environ.copy()
        if env:
            process_env.update(env)
        
        # Start the process
        process = subprocess.Popen(
            command,
            shell=True,
            env=process_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1  # Line buffered
        )
        
        # Add to our list of processes
        processes.append((process, name))
        
        # Check if process started successfully
        time.sleep(1)
        if process.poll() is not None:
            print(f"❌ {name} failed to start!")
            return None
        
        print(f"✅ {name} started successfully (PID: {process.pid})")
        return process
    except Exception as e:
        print(f"❌ Error starting {name}: {str(e)}")
        return None

def monitor_output():
    """Monitor and print output from all processes"""
    try:
        while processes:
            for process, name in list(processes):
                # Check if process is still running
                if process.poll() is not None:
                    print(f"⚠️ {name} has stopped (exit code: {process.returncode})")
                    processes.remove((process, name))
                    continue
                
                # Read output
                for line in process.stdout:
                    if line:
                        print(f"[{name}] {line.strip()}")
                    break
                
                # Read errors
                for line in process.stderr:
                    if line:
                        print(f"[{name} ERROR] {line.strip()}")
                    break
            
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n👋 Shutting down all servers...")
        stop_all_servers()

def stop_all_servers():
    """Stop all running server processes"""
    for process, name in processes:
        try:
            print(f"Stopping {name} (PID: {process.pid})...")
            
            if sys.platform == 'win32':
                # Windows doesn't handle SIGTERM the same way
                process.terminate()
            else:
                # Send SIGTERM to allow clean shutdown
                os.kill(process.pid, signal.SIGTERM)
            
            # Wait a bit for clean shutdown
            for _ in range(30):  # Wait up to 3 seconds
                if process.poll() is not None:
                    break
                time.sleep(0.1)
            
            # If process is still running, force kill
            if process.poll() is None:
                print(f"Force killing {name}...")
                if sys.platform == 'win32':
                    os.system(f'taskkill /F /PID {process.pid}')
                else:
                    os.kill(process.pid, signal.SIGKILL)
            
            print(f"✅ {name} stopped")
        except Exception as e:
            print(f"❌ Error stopping {name}: {str(e)}")

def main():
    """Main function to run all servers"""
    print("🚀 Starting all servers...")
    
    # Start main API server
    main_api = start_server(
        "python run_api.py",
        "Main API Server",
        {"API_PORT": "8000"}
    )
    
    # Start test upload server
    test_upload = start_server(
        "python run_files_test.py",
        "Test Upload Server", 
        {"API_PORT": "8001"}
    )
    
    # Start direct upload server
    direct_upload = start_server(
        "python direct_upload_endpoint.py",
        "Direct Upload Server",
        {"DIRECT_UPLOAD_PORT": "8002"}
    )
    
    # Check if all servers started
    if main_api and test_upload and direct_upload:
        print("\n✅ All servers started successfully!")
        print("\n📋 Server Summary:")
        print("  - Main API Server: http://localhost:8000")
        print("  - Test Upload Server: http://localhost:8001")
        print("  - Direct Upload Server: http://localhost:8002")
        print("\nPress Ctrl+C to stop all servers\n")
        
        # Monitor and print output from all processes
        monitor_output()
    else:
        print("\n❌ Failed to start all servers")
        stop_all_servers()
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        stop_all_servers()
    finally:
        # Make sure all processes are stopped
        for process, name in processes:
            if process.poll() is None:
                process.terminate() 