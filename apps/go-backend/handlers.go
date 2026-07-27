package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func handleCreateGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	runtime := createAndStoreGameRuntime()
	gameID := runtime.state.GameID

	http.SetCookie(w, &http.Cookie{
		Name:     "game-session",
		Value:    gameID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(map[string]string{"game_id": gameID}); err != nil {
		log.Println("Write create-game response error:", err)
	}
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, allowed := allowedOrigins[origin]; allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Vary", "Origin")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("game-session")
	if err != nil {
		http.Error(w, "Missing game-session cookie", http.StatusUnauthorized)
		return
	}

	if cookie.Value == "" {
		http.Error(w, "Invalid game-session cookie", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	log.Printf("Client connected with gameId: %s\n", cookie.Value)

	runtime, exists := getGameRuntime(cookie.Value)
	if !exists {
		http.Error(w, "Unknown game-session cookie", http.StatusUnauthorized)
		return
	}
	connectionId := uuid.New().String()
	runtime.addClient(connectionId)

	log.Printf("Started game runtime for game: %s\n", runtime.snapshot().GameID)

	readDone := make(chan struct{})

	for {
		select {
		case <-readDone:
			log.Println("Read loop ended; closing websocket session")
			return
		case state, ok := <-runtime.updates:
			if !ok {
				return
			}

			err := conn.WriteJSON(map[string]any{
				"type":  "state_update",
				"state": state,
			})
			if err != nil {
				log.Println("Write error:", err)
				runtime.removeClient(connectionId)
				return
			}
		}
	}
}
