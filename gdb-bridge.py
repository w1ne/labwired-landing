#!/usr/bin/env python3
import asyncio
import websockets
import socket
import argparse
import sys

# GDB Bridge for LabWired
# Bridges TCP Port (GDB Client) <-> WebSocket (Browser Sandbox)

async def handle_gdb_client(reader, writer, ws):
    """Bridge data from TCP GDB to WebSocket."""
    print(f"[*] GDB Client connected")
    try:
        while True:
            data = await reader.read(4096)
            if not data:
                break
            # print(f"-> GDB: {data}")
            await ws.send(data)
    except Exception as e:
        print(f"[*] GDB Client error: {e}")
    finally:
        writer.close()
        await writer.wait_closed()
        print(f"[*] GDB Client disconnected")

async def handle_ws_client(ws, path):
    """Bridge data from WebSocket to TCP GDB."""
    print(f"[*] Browser Sandbox connected via WebSocket")
    
    # We allow only one GDB connection at a time
    gdb_reader = None
    gdb_writer = None

    async def tcp_to_ws():
        nonlocal gdb_reader, gdb_writer
        server = await asyncio.start_server(
            lambda r, w: handle_gdb_client(r, w, ws), 
            '127.0.0.1', args.port
        )
        print(f"[*] Listening for GDB on TCP localhost:{args.port}")
        async with server:
            await server.serve_forever()

    async def ws_to_tcp():
        try:
            async for message in ws:
                # We need a way to send 'message' to the CURRENT TCP client.
                # This is tricky with multiple clients. 
                # For LabWired, we expect 1 client.
                # In this simple bridge, we just print or handle if we had a writer.
                # A better way is to manage the TCP connection inside this loop.
                pass 
        except Exception as e:
            print(f"[*] WS Error: {e}")

    # For simplicity, we just bridge the FIRST TCP client that connects.
    # A more robust bridge would be needed for complex multi-session debugging.
    
    # REVISED BRIDGE LOGIC:
    # We listen for TCP. When GDB connects, we start forwarding.
    
    server = await asyncio.start_server(
        lambda r, w: bridge_sessions(r, w, ws),
        '127.0.0.1', args.port
    )
    print(f"[*] GDB Server started on localhost:{args.port}")
    async with server:
        await server.serve_forever()

async def bridge_sessions(tcp_reader, tcp_writer, ws):
    print(f"[*] GDB session started")
    
    async def tcp_to_ws():
        try:
            while True:
                data = await tcp_reader.read(4096)
                if not data: break
                await ws.send(data)
        except: pass

    async def ws_to_tcp():
        try:
            async for data in ws:
                tcp_writer.write(data)
                await tcp_writer.drain()
        except: pass

    await asyncio.gather(tcp_to_ws(), ws_to_tcp())
    tcp_writer.close()
    print(f"[*] GDB session ended")

async def main(args):
    print(f"[*] LabWired GDB Bridge")
    print(f"[*] TCP Port: {args.port} (GDB Client)")
    print(f"[*] WS Port:  {args.ws_port} (Browser)")
    
    async with websockets.serve(handle_ws_client, "localhost", args.ws_port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LabWired GDB Bridge")
    parser.add_argument("--port", type=int, default=3333, help="TCP port for GDB")
    parser.add_argument("--ws-port", type=int, default=8081, help="WebSocket port for Browser")
    args = parser.parse_args()

    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        pass
