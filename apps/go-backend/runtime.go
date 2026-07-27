package main

import (
	"math/rand"
	"sync"
	"time"

	"github.com/google/uuid"
)

var gameRuntimes = make(map[string]*gameRuntime)
var gameRuntimesMu sync.RWMutex

func getUUID() string {
	//TODO: check against and store in memorystore to ensure uniqueness
	return uuid.New().String()
}

func newGameState() GameState {
	stateSprites := make([]Sprite, 0)

	for x := 0; x < stage.Width; x += spriteWidth + 30 {
		for y := 0; y < stage.Height; y += spriteHeight + 30 {
			sprite := Sprite{
				ID: len(stateSprites),
				RRect: Rect{
					X:      x,
					Y:      y,
					Width:  spriteWidth,
					Height: spriteHeight,
				},
				VX:   randomVelocity(),
				VY:   randomVelocity(),
				Type: rand.Intn(3),
			}
			stateSprites = append(stateSprites, sprite)
		}
	}
	return GameState{
		Timestamp: time.Now().UnixMilli(),
		GameID:    getUUID(),
		Sprites:   stateSprites,
	}
}

func randomVelocity() int {
	return (rand.Intn(3) - 1) * 5
}

type gameRuntime struct {
	mu               sync.RWMutex
	state            GameState
	expires          int64
	createdAt        int64
	connectedClients []string
	stop             chan struct{}
	done             chan struct{}
	updates          chan GameState
}

func startGameRuntime(initialState GameState) *gameRuntime {
	runtime := &gameRuntime{
		state:     initialState,
		stop:      make(chan struct{}),
		done:      make(chan struct{}),
		updates:   make(chan GameState, 1),
		expires:   time.Now().Add(5 * time.Minute).UnixMilli(),
		createdAt: time.Now().UnixMilli(),
	}

	go runtime.run()

	return runtime
}

func (g *gameRuntime) run() {
	defer close(g.done)
	defer close(g.updates)

	ticker := time.NewTicker(time.Second / 30)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			g.updateState()
			g.publishUpdate(g.snapshot())
		case <-g.stop:
			return
		}
	}
}

func (g *gameRuntime) addClient(clientID string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.connectedClients = append(g.connectedClients, clientID)
}

func (g *gameRuntime) removeClient(clientID string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	for i, id := range g.connectedClients {
		if id == clientID {
			g.connectedClients = append(g.connectedClients[:i], g.connectedClients[i+1:]...)
			break
		}
	}
}

func (g *gameRuntime) hasClients() bool {
	g.mu.RLock()
	defer g.mu.RUnlock()

	return len(g.connectedClients) > 0
}

func (g *gameRuntime) publishUpdate(state GameState) {
	select {
	case g.updates <- state:
		return
	default:
	}

	select {
	case <-g.updates:
	default:
	}

	g.updates <- state
}

func (g *gameRuntime) updateState() {
	g.mu.Lock()
	defer g.mu.Unlock()

	for i := range g.state.Sprites {
		sprite := &g.state.Sprites[i]
		sprite.RRect.X += sprite.VX
		sprite.RRect.Y += sprite.VY

		if sprite.RRect.X < -spriteWidth {
			sprite.RRect.X = stage.Width + sprite.RRect.Width
		} else if sprite.RRect.X > stage.Width {
			sprite.RRect.X = -sprite.RRect.Width
		}

		if sprite.RRect.Y < -spriteHeight {
			sprite.RRect.Y = stage.Height + sprite.RRect.Height
		} else if sprite.RRect.Y > stage.Height {
			sprite.RRect.Y = -sprite.RRect.Height
		}

		if sprite.RRect.X < stage.X {
			sprite.RRect.X = stage.X
			sprite.VX *= -1
		} else if sprite.RRect.X+sprite.RRect.Width > stage.X+stage.Width {
			sprite.RRect.X = stage.X + stage.Width - sprite.RRect.Width
			sprite.VX *= -1
		}

		if sprite.RRect.Y < stage.Y {
			sprite.RRect.Y = stage.Y
			sprite.VY *= -1
		} else if sprite.RRect.Y+sprite.RRect.Height > stage.Y+stage.Height {
			sprite.RRect.Y = stage.Y + stage.Height - sprite.RRect.Height
			sprite.VY *= -1
		}
	}

	collisions := quadTreeCollisionDetection(stage, g.state.Sprites)
	for _, pair := range collisions {
		if pair.A.ID < 0 || pair.B.ID < 0 || pair.A.ID >= len(g.state.Sprites) || pair.B.ID >= len(g.state.Sprites) {
			continue
		}

		a := &g.state.Sprites[pair.A.ID]
		b := &g.state.Sprites[pair.B.ID]

		overlapX := minInt(a.RRect.X+a.RRect.Width, b.RRect.X+b.RRect.Width) - maxInt(a.RRect.X, b.RRect.X)
		overlapY := minInt(a.RRect.Y+a.RRect.Height, b.RRect.Y+b.RRect.Height) - maxInt(a.RRect.Y, b.RRect.Y)
		if overlapX <= 0 || overlapY <= 0 {
			continue
		}

		if overlapX < overlapY {
			resolveAxisOverlap(&a.RRect.X, &b.RRect.X, a.RRect.Width, b.RRect.Width, overlapX)
			a.VX, b.VX = b.VX, a.VX
		} else {
			resolveAxisOverlap(&a.RRect.Y, &b.RRect.Y, a.RRect.Height, b.RRect.Height, overlapY)
			a.VY, b.VY = b.VY, a.VY
		}

		clampSpriteToStage(a)
		clampSpriteToStage(b)
	}
}

func (g *gameRuntime) stopAndWait() {
	close(g.stop)
	<-g.done
}

func (g *gameRuntime) snapshot() GameState {
	g.mu.RLock()
	defer g.mu.RUnlock()

	clonedSprites := make([]Sprite, len(g.state.Sprites))
	copy(clonedSprites, g.state.Sprites)

	return GameState{
		Timestamp: g.state.Timestamp,
		GameID:    g.state.GameID,
		Sprites:   clonedSprites,
	}
}

func createAndStoreGameRuntime() *gameRuntime {
	runtime := startGameRuntime(newGameState())

	gameRuntimesMu.Lock()
	gameRuntimes[runtime.state.GameID] = runtime
	gameRuntimesMu.Unlock()

	return runtime
}

func getGameRuntime(gameID string) (*gameRuntime, bool) {
	gameRuntimesMu.RLock()
	runtime, exists := gameRuntimes[gameID]
	gameRuntimesMu.RUnlock()

	return runtime, exists
}
