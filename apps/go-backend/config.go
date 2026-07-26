package main

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var stage = Rect{X: 0, Y: 0, Width: 400, Height: 300}
var spriteWidth = 15
var spriteHeight = 15

var allowedOrigins = map[string]struct{}{
	"http://localhost:5173": {},
	"http://127.0.0.1:5173": {},
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
