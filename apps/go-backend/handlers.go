package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

//application close code telling the client the game session ended and will not come back
const closeCodeGameExpired = 4001

func handleCreateGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestBody struct {
		DemoID int `json:"demoID"` //which game state are we creating?
	}

	var demoID int;
	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil && err != io.EOF {
			http.Error(w, "Invalid requst payload", http.StatusBadRequest)
			return
		}
		demoID = requestBody.DemoID
	} else {
		demoID = 1
	}

	gameID := getUUID();
	if _, err := createAndStoreGameRuntime(gameID, demoID); err != nil {
		if errors.Is(err, errGameCapacityReached) {
			logger.Warn("Game creation refused, at capacity", "demo_id", demoID, "max_game_states", maxActiveGameRuntimes)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "30")
			w.WriteHeader(http.StatusServiceUnavailable)
			if err := json.NewEncoder(w).Encode(map[string]string{"error": "at_capacity"}); err != nil {
				logger.Error("Write capacity response error", "error", err.Error())
			}
			return
		}

		http.Error(w, "Failed to create game", http.StatusInternalServerError)
		return
	}

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
		logger.Error("Write create-game response error", "error", err.Error(), "game_id", gameID)
	}
}

func getUUID() string {
	//TODO: check against and store in memorystore to ensure uniqueness
	return uuid.New().String()
}


func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		_, explicitlyAllowed := allowedOrigins[origin]
		if origin != "" && (allowAllOrigins || explicitlyAllowed) {
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
		logger.Error("WebSocket upgrade error", "error", err.Error())
		return
	}
	defer conn.Close()

	logger.Info("Client connected", "game_id", cookie.Value)

	runtime, exists := getGameRuntime(cookie.Value)
	if !exists {
		http.Error(w, "Unknown game-session cookie", http.StatusUnauthorized)
		return
	}
	connectionId := uuid.New().String()
	updates := runtime.addClient(connectionId)
	defer runtime.removeClient(connectionId)

	logger.Info("Started game runtime stream", "game_id", runtime.snapshot().GameID, "connection_id", connectionId)

	err = conn.WriteJSON(map[string]any{
		"type":          "connection_info",
		"connection_id": connectionId,
		"game_id":       cookie.Value,
	})
	if err != nil {
		logger.Error("Write connection info error", "error", err.Error(), "game_id", cookie.Value, "connection_id", connectionId)
		return
	}

	//try to read in a routine to detect a disconnected client
	go func() {
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				conn.Close()
				return
			}
		}
	}()

	//write to updates channel
	for state := range updates {
		err := conn.WriteJSON(map[string]any{
			"type":  "state_update",
			"state": state,
		})
		if err != nil {
			logger.Error("Write state update error", "error", err.Error(), "game_id", cookie.Value, "connection_id", connectionId)
			return
		}
	}

	//the channel only closes when the runtime is stopped, so the session is gone for good
	if err := conn.WriteControl(
		websocket.CloseMessage,
		websocket.FormatCloseMessage(closeCodeGameExpired, "game session expired"),
		time.Now().Add(time.Second),
	); err != nil {
		logger.Error("Write close frame error", "error", err.Error(), "game_id", cookie.Value, "connection_id", connectionId)
	}
}
