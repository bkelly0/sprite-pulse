package main

import (
	"sync"
	"testing"
)

func TestGetOrCreateGameRuntime_ReusesExistingGameID(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	id := "shared-game-id"
	first := createAndStoreGameRuntime(id)
	second := createAndStoreGameRuntime(id)

	if first != second {
		t.Fatalf("expected same runtime instance for gameID %q", id)
	}

	if first.state.GameID != id {
		t.Fatalf("expected gameID %q, got %q", id, first.state.GameID)
	}
}

func TestGetOrCreateGameRuntime_CreatesNewGameWhenMissing(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	id := "new-game-id"
	runtime := createAndStoreGameRuntime(id)

	if runtime == nil {
		t.Fatal("expected runtime to be created")
	}

	if runtime.state.GameID != id {
		t.Fatalf("expected gameID %q, got %q", id, runtime.state.GameID)
	}

	if _, exists := gameRuntimes[id]; !exists {
		t.Fatal("expected runtime to be stored in the map")
	}
}

func TestCreateAndStoreGameRuntime_UsesRequestedDemo(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	runtime := createAndStoreGameRuntime("demo-two-game", 2)
	defer runtime.stopAndWait()

	if runtime.state.DemoID != 2 {
		t.Fatalf("expected demo 2, got %d", runtime.state.DemoID)
	}
}

func TestNewGameState_UsesDefaultDemoForUnknownID(t *testing.T) {
	state := newGameState("fallback-game", 999)

	if state.DemoID != 1 {
		t.Fatalf("expected default demo 1, got %d", state.DemoID)
	}
}
