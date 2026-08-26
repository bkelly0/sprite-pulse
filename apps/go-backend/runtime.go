package main

import (
	"sync"
	"time"
)

var gameRuntimes = make(map[string]*gameRuntime)
var gameRuntimesMu sync.RWMutex

type gameDemo interface {
	newGameState(gameID string, cfg DemoConfig) GameState
	updateState(runtime *gameRuntime)
}

type gameDemoFuncs struct {
	newState func(gameID string, cfg DemoConfig) GameState
	update   func(runtime *gameRuntime)
}

func (d gameDemoFuncs) newGameState(gameID string, cfg DemoConfig) GameState {
	return d.newState(gameID, cfg)
}

func (d gameDemoFuncs) updateState(runtime *gameRuntime) {
	d.update(runtime)
}

var demos = map[int]gameDemo{
	1: gameDemoFuncs{newState: newGameStateDemo1, update: updateStateDemo1},
	2: gameDemoFuncs{newState: newGameStateDemo2, update: updateStateDemo2},
	3: gameDemoFuncs{newState: newGameStateDemo3, update: updateStateDemo3},
}

func demoFor(demoID int) gameDemo {
	if demo, ok := demos[demoID]; ok {
		return demo
	}

	return demos[1]
}

func newGameState(gameID string, demoID int) GameState {
	return demoFor(demoID).newGameState(gameID, configFor(demoID))
}

type gameRuntime struct {
	mu               sync.RWMutex
	state            GameState
	demo             gameDemo
	config           DemoConfig
	expires          int64
	createdAt        int64
	connectedClients []string
	clientUpdates    map[string]chan GameState
	stop             chan struct{}
	done             chan struct{}
	stopOnce         sync.Once
}

func startGameRuntime(initialState GameState) *gameRuntime {
	runtime := &gameRuntime{
		state:         initialState,
		demo:          demoFor(initialState.DemoID),
		config:        configFor(initialState.DemoID),
		stop:          make(chan struct{}),
		done:          make(chan struct{}),
		clientUpdates: make(map[string]chan GameState),
		expires:       time.Now().Add(5 * time.Minute).UnixMilli(),
		createdAt:     time.Now().UnixMilli(),
	}

	go runtime.run()

	return runtime
}

func (g *gameRuntime) run() {
	defer close(g.done)
	defer g.closeClientUpdateChannels()

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

func (g *gameRuntime) isExpired(currentTime int64) bool {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return g.expires > currentTime
}

func (g *gameRuntime) addClient(clientID string) <-chan GameState {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.expires = 0
	g.connectedClients = append(g.connectedClients, clientID)
	updates := make(chan GameState, 1) //single state buffer
	g.clientUpdates[clientID] = updates

	return updates
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

	if updates, ok := g.clientUpdates[clientID]; ok {
		close(updates)
		delete(g.clientUpdates, clientID)
	}

	if len(g.connectedClients) == 0 {
		g.expires = time.Now().Add(5 * time.Second).UnixMilli()
	}

}

func (g *gameRuntime) hasClients() bool {
	g.mu.RLock()
	defer g.mu.RUnlock()

	return len(g.connectedClients) > 0
}

func (g *gameRuntime) publishUpdate(state GameState) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	for _, updates := range g.clientUpdates {
		//send updated state to client
		select {
		case updates <- state:
			continue //next client
		default:
		}

		//the channel update failed or has not been received yet
		//remove the pending state and replace with the newest one
		select {
		case <-updates:
		default:
		}

		select {
		case updates <- state:
		default:
		}
	}
}

func (g *gameRuntime) closeClientUpdateChannels() {
	g.mu.Lock()
	defer g.mu.Unlock()

	for clientID, updates := range g.clientUpdates {
		close(updates)
		delete(g.clientUpdates, clientID)
	}
}

func (g *gameRuntime) updateState() {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.demo.updateState(g)
}

func (g *gameRuntime) stopAndWait() {
	g.stopOnce.Do(func() {
		close(g.stop)
	})
	<-g.done
}

func (g *gameRuntime) snapshot() GameState {
	g.mu.RLock()
	defer g.mu.RUnlock()

	clonedSprites := make([]Sprite, len(g.state.Sprites))
	copy(clonedSprites, g.state.Sprites)

	return GameState{
		Timestamp: g.state.Timestamp,
		DemoID:    g.state.DemoID,
		GameID:    g.state.GameID,
		Sprites:   clonedSprites,
		Debug:     g.state.Debug,
	}
}

func createAndStoreGameRuntime(gameID string, demoIDs ...int) *gameRuntime {
	demoID := 1
	if len(demoIDs) > 0 {
		demoID = demoIDs[0]
	}

	gameRuntimesMu.RLock()
	if runtime, exists := gameRuntimes[gameID]; exists {
		gameRuntimesMu.RUnlock()
		return runtime
	}
	gameRuntimesMu.RUnlock()

	runtime := startGameRuntime(newGameState(gameID, demoID))

	gameRuntimesMu.Lock()
	if existing, exists := gameRuntimes[gameID]; exists {
		gameRuntimesMu.Unlock()
		return existing
	}
	gameRuntimes[gameID] = runtime
	activeCount := len(gameRuntimes)
	gameRuntimesMu.Unlock()

	logger.Info("Game runtime created", "game_id", gameID, "demo_id", demoID, "active_game_states", activeCount)

	return runtime
}

func getGameRuntime(gameID string) (*gameRuntime, bool) {
	gameRuntimesMu.RLock()
	runtime, exists := gameRuntimes[gameID]
	gameRuntimesMu.RUnlock()

	return runtime, exists
}
