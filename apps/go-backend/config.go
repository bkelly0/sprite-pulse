package main

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type DemoConfig struct {
	Stage        Rect
	SpriteWidth  int
	SpriteHeight int
}

var defaultDemoConfig = DemoConfig{
	Stage:        Rect{X: 0, Y: 0, Width: 400, Height: 300},
	SpriteWidth:  15,
	SpriteHeight: 15,
}

var demoConfig3 =  DemoConfig{
	Stage:        Rect{X: 0, Y: 0, Width: 800, Height: 600},
	SpriteWidth:  15,
	SpriteHeight: 15,
}

var demoConfigs = map[int]DemoConfig{
	1: defaultDemoConfig,
	2: defaultDemoConfig,
	3: demoConfig3,
}

func configFor(demoID int) DemoConfig {
	if cfg, ok := demoConfigs[demoID]; ok {
		return cfg
	}

	return defaultDemoConfig
}

// this will be deployed to a private environment
const allowAllOrigins = true

var allowedOrigins = map[string]struct{}{}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
