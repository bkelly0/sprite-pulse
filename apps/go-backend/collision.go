package main

import "fmt"

func overlap(rect1, rect2 Rect) bool {
	return rect1.X < rect2.X+rect2.Width &&
		rect1.X+rect1.Width > rect2.X &&
		rect1.Y < rect2.Y+rect2.Height &&
		rect1.Y+rect1.Height > rect2.Y
}


func minInt(a int, b int) int {
	if a < b {
		return a
	}

	return b
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}

	return b
}

func collectDebugRects(qt quadTree) []Rect {
	results := make([]Rect, 0)
	results = append(results, qt.Boundry)
	if qt.Children[0] != nil {
		for i:=range 4 {
			results = append(results, collectDebugRects(*qt.Children[i])...)
		}
	}
	return results
}

type quadTree struct {
	Boundry       Rect
	Children       [4]*quadTree
	sprites        []Sprite
	depth          int
	maxDepth       int
	maxNodeSprites int
}

func newQuadTree(boundary Rect, depth int, maxDepth int, maxNodeSprites int) *quadTree {
	return &quadTree{
		Boundry:       boundary,
		sprites:        make([]Sprite, 0, maxNodeSprites),
		depth:          depth,
		maxDepth:       maxDepth,
		maxNodeSprites: maxNodeSprites,
	}
}

func (q *quadTree) insert(sprite Sprite) {
	if !overlap(q.Boundry, sprite.Bounds) {
		return
	}

	if q.Children[0] != nil {
		idx := q.getChildIndex(sprite.Bounds)
		if idx != -1 {
			q.Children[idx].insert(sprite)
			return
		}
	}

	q.sprites = append(q.sprites, sprite)

	if len(q.sprites) > q.maxNodeSprites && q.depth < q.maxDepth {
		if q.Children[0] == nil {
			q.split()
		}

		i := 0
		for i < len(q.sprites) {
			idx := q.getChildIndex(q.sprites[i].Bounds)
			if idx == -1 {
				i++
				continue
			}

			moved := q.sprites[i]
			q.sprites = append(q.sprites[:i], q.sprites[i+1:]...)
			q.Children[idx].insert(moved)
		}
	}
}

func (q *quadTree) split() {
	halfW := q.Boundry.Width / 2
	halfH := q.Boundry.Height / 2
	x := q.Boundry.X
	y := q.Boundry.Y
	nextDepth := q.depth + 1

	q.Children[0] = newQuadTree(
		Rect{X: x, Y: y, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.Children[1] = newQuadTree(
		Rect{X: x + halfW, Y: y, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.Children[2] = newQuadTree(
		Rect{X: x, Y: y + halfH, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.Children[3] = newQuadTree(
		Rect{X: x + halfW, Y: y + halfH, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
}

func (q *quadTree) getChildIndex(rect Rect) int {
	verticalMid := q.Boundry.X + q.Boundry.Width/2
	horizontalMid := q.Boundry.Y + q.Boundry.Height/2

	top := rect.Y+rect.Height <= horizontalMid
	bottom := rect.Y >= horizontalMid
	left := rect.X+rect.Width <= verticalMid
	right := rect.X >= verticalMid

	if top {
		if left {
			return 0
		}
		if right {
			return 1
		}
	}

	if bottom {
		if left {
			return 2
		}
		if right {
			return 3
		}
	}

	return -1
}

func (q *quadTree) retrieve(rect Rect, out []Sprite) []Sprite {
	if !overlap(q.Boundry, rect) {
		return out
	}

	out = append(out, q.sprites...)

	if q.Children[0] == nil {
		return out
	}

	idx := q.getChildIndex(rect)
	if idx != -1 {
		return q.Children[idx].retrieve(rect, out)
	}

	for _, child := range q.Children {
		out = child.retrieve(rect, out)
	}

	return out
}

func quadTreeCollisionDetection(boundary Rect, sprites []Sprite, collectDebutRects bool) ([]CollisionPair, []Rect) {
	const maxDepth = 6
	const maxNodeSprites = 8

	qt := newQuadTree(boundary, 0, maxDepth, maxNodeSprites)
	for _, sprite := range sprites {
		qt.insert(sprite)
	}

	unique := make(map[int]Sprite, len(sprites))
	for _, sprite := range sprites {
		unique[sprite.ID] = sprite
	}

	processed := make(map[string]struct{})
	collisions := make([]CollisionPair, 0)

	for _, sprite := range sprites {
		candidates := qt.retrieve(sprite.Bounds, nil)
		for _, other := range candidates {
			if sprite.ID >= other.ID {
				continue
			}
			if !overlap(sprite.Bounds, other.Bounds) {
				continue
			}

			key := fmt.Sprintf("%d:%d", sprite.ID, other.ID)
			if _, exists := processed[key]; exists {
				continue
			}

			processed[key] = struct{}{}
			collisions = append(collisions, CollisionPair{
				A: unique[sprite.ID],
				B: unique[other.ID],
			})
		}
	}

	var debugRects []Rect
	if (collectDebutRects) {
		debugRects = collectDebugRects(*qt);
	}

	return collisions, debugRects
}
