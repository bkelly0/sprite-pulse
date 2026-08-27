package main

import (
	"errors"
	"strconv"
	"sync"
	"testing"
)

func TestGetOrCreateGameRuntime_ReusesExistingGameID(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	id := "shared-game-id"
	first, err := createAndStoreGameRuntime(id)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	second, err := createAndStoreGameRuntime(id)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer first.stopAndWait()

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
	runtime, err := createAndStoreGameRuntime(id)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer runtime.stopAndWait()

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

func TestCreateAndStoreGameRuntime_RefusesBeyondCapacity(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	for i := 0; i < maxActiveGameRuntimes; i++ {
		runtime, err := createAndStoreGameRuntime("game-" + strconv.Itoa(i))
		if err != nil {
			t.Fatalf("unexpected error creating runtime %d: %v", i, err)
		}
		defer runtime.stopAndWait()
	}

	if _, err := createAndStoreGameRuntime("one-too-many"); !errors.Is(err, errGameCapacityReached) {
		t.Fatalf("expected errGameCapacityReached, got %v", err)
	}

	if _, exists := gameRuntimes["one-too-many"]; exists {
		t.Fatal("expected the refused runtime not to be stored")
	}
}

func TestCreateAndStoreGameRuntime_UsesRequestedDemo(t *testing.T) {
	gameRuntimes = make(map[string]*gameRuntime)
	gameRuntimesMu = sync.RWMutex{}

	runtime, err := createAndStoreGameRuntime("demo-two-game", 2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
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
