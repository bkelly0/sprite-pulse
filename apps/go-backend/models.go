package main

type Rect struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

type Sprite struct {
	ID     int  `json:"id"`
	Bounds Rect `json:"rect"`
	VX     int  `json:"-"`              //velocity y
	VY     int  `json:"-"`              //velocity x
	State  int  `json:"state"`          //can be used by the client to trigger animations
	Type   int  `json:"type,omitempty"` //used by the client to deremine shader to draw
}

type GameState struct {
	Timestamp int64      `json:"timestamp_ms"`
	DemoID    int        `json:"-"` //support different init and game loops for various demo behavior
	GameID    string     `json:"game_id"`
	Sprites   []Sprite   `json:"sprites"`
	Debug     StateDebug `json:"debug"`
}

type StateDebug struct {
	QTBounds []Rect `json:"qtBounds"` //for returning quadTree boundries for the demo
}

type CollisionPair struct {
	A Sprite
	B Sprite
}
