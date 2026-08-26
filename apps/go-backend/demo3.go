package main

import (
	"math/rand"
	"time"
)

func newGameStateDemo3(gameID string, cfg DemoConfig) GameState {
	stateSprites := make([]Sprite, 0)

	if gameID == "" {
		gameID = getUUID()
	}

	for i := 0; i < 200; i++ {
		sizeVariation := rand.Intn(20)-10;
		w := cfg.SpriteWidth + sizeVariation
		h := cfg.SpriteHeight + sizeVariation;
		x := rand.Intn(cfg.Stage.Width-w)
		y := rand.Intn(cfg.Stage.Height-h)
		sprite := Sprite{
			ID: len(stateSprites),
			Bounds: Rect{
				X:      x,
				Y:      y,
				Width:  w,
				Height: h,
			},
			VX:   rand.Intn(10) - 5,
			VY:   rand.Intn(10) - 5,
			Type: rand.Intn(2)+1,
		}
		stateSprites = append(stateSprites, sprite)
	}

	return GameState{
		Timestamp: time.Now().UnixMilli(),
		GameID:    gameID,
		DemoID:    3,
		Sprites:   stateSprites,
	}
}

func updateStateDemo3(g *gameRuntime) {

	stage := g.config.Stage
	spriteWidth := g.config.SpriteWidth
	spriteHeight := g.config.SpriteHeight

	for i := range g.state.Sprites {
		sprite := &g.state.Sprites[i]
		sprite.Bounds.X += sprite.VX
		sprite.Bounds.Y += sprite.VY
		sprite.State = 0; // 0 is normal 1 is overlapping

		if sprite.Bounds.X < -spriteWidth {
			sprite.Bounds.X = stage.Width + sprite.Bounds.Width
		} else if sprite.Bounds.X > stage.Width {
			sprite.Bounds.X = -sprite.Bounds.Width
		}

		if sprite.Bounds.Y < -spriteHeight {
			sprite.Bounds.Y = stage.Height + sprite.Bounds.Height
		} else if sprite.Bounds.Y > stage.Height {
			sprite.Bounds.Y = -sprite.Bounds.Height
		}

		if sprite.Bounds.X < stage.X {
			sprite.Bounds.X = stage.X
			sprite.VX *= -1
		} else if sprite.Bounds.X+sprite.Bounds.Width > stage.X+stage.Width {
			sprite.Bounds.X = stage.X + stage.Width - sprite.Bounds.Width
			sprite.VX *= -1
		}

		if sprite.Bounds.Y < stage.Y {
			sprite.Bounds.Y = stage.Y
			sprite.VY *= -1
		} else if sprite.Bounds.Y+sprite.Bounds.Height > stage.Y+stage.Height {
			sprite.Bounds.Y = stage.Y + stage.Height - sprite.Bounds.Height
			sprite.VY *= -1
		}
	}

	collisions, debugRects := quadTreeCollisionDetection(stage, g.state.Sprites, true)
	g.state.Debug.QTBounds = debugRects
	for _, pair := range collisions {
		g.state.Sprites[pair.A.ID].State = 1
		g.state.Sprites[pair.B.ID].State = 1
	
	}
}