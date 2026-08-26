package main

import (
	"log/slog"
	"os"
	"strings"
)

var logger *slog.Logger

func init() {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
		ReplaceAttr: func(_ []string, a slog.Attr) slog.Attr {
			switch a.Key {
			case slog.LevelKey:
				return slog.String("severity", strings.ToUpper(a.Value.String()))
			case slog.MessageKey:
				return slog.String("message", a.Value.String())
			default:
				return a
			}
		},
	})

	logger = slog.New(handler)
}