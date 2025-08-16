from http.server import HTTPServer, SimpleHTTPRequestHandler

class CustomHandler(SimpleHTTPRequestHandler):
  def end_headers(self):
    self.send_header("Cross-Origin-Opener-Policy", "same-origin")
    self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
    # self.send_header("Access-Control-Allow-Origin", "*")
    # self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    # self.send_header("Access-Control-Allow-Headers", "Content-Type")
    super().end_headers()

if __name__ == "__main__":
  server = HTTPServer(("0.0.0.0", 80), CustomHandler)
  print("Serving on port 80...")
  server.serve_forever()
