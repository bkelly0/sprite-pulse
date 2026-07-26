package main

type Rect struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

type Sprite struct {
	ID    int  `json:"id"`
	RRect Rect `json:"rect"`
	VX    int  `json:"-"`
	VY    int  `json:"-"`
	Type  int  `json:"type,omitempty"`
}

type GameState struct {
	Timestamp int64    `json:"timestamp_ms"`
	GameID    string   `json:"game_id"`
	Sprites   []Sprite `json:"sprites"`
}

type CollisionPair struct {
	A Sprite
	B Sprite
}
