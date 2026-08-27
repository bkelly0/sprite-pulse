package main

import (
	"net/http"
	"os"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/game", handleCreateGame)
	mux.HandleFunc("/ws", handleWebSocket)

	go cleanExpiredGameRuntimesRoutine()
	port := ":8080"
	logger.Info("WebSocket server listening", "listen_addr", port, "ws_path", "/ws")
	if err := http.ListenAndServe(port, withCORS(mux)); err != nil {
		logger.Error("HTTP server failed", "error", err.Error())
		os.Exit(1)
	}
}

//TODO: clean up on SIGTERM 

//clean up expired game states
func cleanExpiredGameRuntimesRoutine() {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for range ticker.C {
        now := time.Now().UnixMilli()
        expired := make([]*gameRuntime, 0)
        expiredIDs := make([]string, 0)

        gameRuntimesMu.Lock()
        for gameID, runtime := range gameRuntimes {
            if runtime.isExpired(now) {
                delete(gameRuntimes, gameID)
                expired = append(expired, runtime)
                expiredIDs = append(expiredIDs, gameID)
            }
        }
        gameRuntimesMu.Unlock()

        for i, runtime := range expired {
            //stopping closes every client update channel, which ends the socket writer loop
            runtime.stopAndWait()
            logger.Info("Game runtime expired", "game_id", expiredIDs[i])
        }
    }
}
