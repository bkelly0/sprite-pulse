package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/game", handleCreateGame)
	mux.HandleFunc("/ws", handleWebSocket)

	port := ":8080"
	fmt.Printf("WebSocket server listening on ws://localhost%s/ws\n", port)
	log.Fatal(http.ListenAndServe(port, withCORS(mux)))
}
