package main

import (
	"math/rand"
	"time"
)

func newGameStateDemo1(gameID string, cfg DemoConfig) GameState {
	stateSprites := make([]Sprite, 0)

	if gameID == "" {
		gameID = getUUID()
	}

	for i := 0; i < 100; i++ {
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
			VX:   rand.Intn(3) - 1,
			VY:   rand.Intn(3) - 1,
			Type: rand.Intn(3),
		}
		stateSprites = append(stateSprites, sprite)
	}

	/*
	player := Sprite{
		ID: len(stateSprites),
		Bounds: Rect{
			X:      stage.Width/2 - 20,
			Y:      stage.Height/2 - 20,
			Width:  40,
			Height: 40,
		},
		VX:   randomVelocity(),
		VY:   randomVelocity(),
		Type: 4,
	}
	stateSprites = append(stateSprites, player)
	*/

	return GameState{
		Timestamp: time.Now().UnixMilli(),
		GameID:    gameID,
		DemoID:    1,
		Sprites:   stateSprites,
	}
}

func updateStateDemo1(g *gameRuntime) {

	stage := g.config.Stage
	spriteWidth := g.config.SpriteWidth
	spriteHeight := g.config.SpriteHeight

	for i := range g.state.Sprites {
		sprite := &g.state.Sprites[i]
		sprite.Bounds.X += sprite.VX
		sprite.Bounds.Y += sprite.VY

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

	collisions, _ := quadTreeCollisionDetection(stage, g.state.Sprites, false)
	for _, pair := range collisions {
		if pair.A.ID < 0 || pair.B.ID < 0 || pair.A.ID >= len(g.state.Sprites) || pair.B.ID >= len(g.state.Sprites) {
			continue
		}

		a := &g.state.Sprites[pair.A.ID]
		b := &g.state.Sprites[pair.B.ID]

		overlapX := minInt(a.Bounds.X+a.Bounds.Width, b.Bounds.X+b.Bounds.Width) - maxInt(a.Bounds.X, b.Bounds.X)
		overlapY := minInt(a.Bounds.Y+a.Bounds.Height, b.Bounds.Y+b.Bounds.Height) - maxInt(a.Bounds.Y, b.Bounds.Y)
		if overlapX <= 0 || overlapY <= 0 {
			continue
		}

		if overlapX < overlapY {
			resolveAxisOverlap(&a.Bounds.X, &b.Bounds.X, a.Bounds.Width, b.Bounds.Width, overlapX)
			a.VX, b.VX = b.VX, a.VX
		} else {
			resolveAxisOverlap(&a.Bounds.Y, &b.Bounds.Y, a.Bounds.Height, b.Bounds.Height, overlapY)
			a.VY, b.VY = b.VY, a.VY
		}
	}
}


func resolveAxisOverlap(aPos *int, bPos *int, aSize int, bSize int, penetration int) {
	aCenter := *aPos + aSize/2
	bCenter := *bPos + bSize/2

	separation := penetration + 1
	aShift := separation / 2
	bShift := separation - aShift

	if aCenter <= bCenter {
		*aPos -= aShift
		*bPos += bShift
		return
	}

	*aPos += aShift
	*bPos -= bShift
}