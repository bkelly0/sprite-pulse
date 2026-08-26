package main

import (
	"math/rand"
	"time"
)

func newGameStateDemo2(gameID string, cfg DemoConfig) GameState {
	stateSprites := make([]Sprite, 0)

	if gameID == "" {
		gameID = getUUID()
	}

	for i:=0; i<300; i++ {
		sizeVariation := rand.Intn(10)-5;
		sprite := Sprite{
			ID: len(stateSprites),
			Bounds: Rect{
				X:      rand.Intn(cfg.Stage.Width),
				Y:      -20 - rand.Intn(100),
				Width:  cfg.SpriteWidth + sizeVariation,
				Height: cfg.SpriteHeight + sizeVariation,
			},
			VX: rand.Intn(10)-5,
			VY: randomVelocity(),
			Type: rand.Intn(2),
		}
		stateSprites = append(stateSprites, sprite)
	}

	return GameState{
		Timestamp: time.Now().UnixMilli(),
		GameID:    gameID,
		DemoID:    2,
		Sprites:   stateSprites,
	}
}

func updateStateDemo2(g *gameRuntime) {

	stage := g.config.Stage

	doneBouncingCount := 0
	for i := range g.state.Sprites {
		sprite := &g.state.Sprites[i]
		sprite.Bounds.X += sprite.VX
		sprite.Bounds.Y += sprite.VY
		if sprite.VY < 20 {
			sprite.VY += 1	//gravity
		}
		
		if sprite.Bounds.Y > stage.Height - 20 {
			sprite.Bounds.Y = stage.Height - sprite.Bounds.Height
			randFrict := 1+rand.Intn(6)
			sprite.VY -= randFrict
			sprite.VY *= -1

			if sprite.VY > 0 {
				sprite.VY = 0
				if rand.Intn(10) < 8 { //randomize vx drag
					if sprite.VX > 0 {
						sprite.VX-=1;
					} else if sprite.VX < 0 {
						sprite.VX+=1
					}
				}
			} 
			
		}
		if sprite.Bounds.X < 0 {
			sprite.VX *= -1
		} else if sprite.Bounds.X > stage.Width - sprite.Bounds.Width {
			sprite.VX *= -1
			sprite.Bounds.X = stage.Width - sprite.Bounds.Width
		}
		if sprite.VY == 0 {
			doneBouncingCount++
		}
	}
	if doneBouncingCount == len(g.state.Sprites) {
		for i := range g.state.Sprites {
			sprite := &g.state.Sprites[i]
			sprite.VX = randomVelocity()
			sprite.VY = 20 + rand.Intn(10)
		}
	}
}

func randomVelocity() int {
	return (rand.Intn(3) - 1) * 3
}