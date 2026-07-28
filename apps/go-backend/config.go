package main

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var stage = Rect{X: 0, Y: 0, Width: 400, Height: 300}
var spriteWidth = 15
var spriteHeight = 15

// this will be deployed to a private environment
const allowAllOrigins = true

var allowedOrigins = map[string]struct{}{}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
