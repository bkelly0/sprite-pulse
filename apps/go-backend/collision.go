package main

import "fmt"

func overlap(rect1, rect2 Rect) bool {
	return rect1.X < rect2.X+rect2.Width &&
		rect1.X+rect1.Width > rect2.X &&
		rect1.Y < rect2.Y+rect2.Height &&
		rect1.Y+rect1.Height > rect2.Y
}

func resolveAxisOverlap(aPos *int, bPos *int, aSize int, bSize int, penetration int) {
	aCenter := *aPos + aSize/2
	bCenter := *bPos + bSize/2

	separation := penetration + 1
	aShift := separation / 2
	bShift := separation - aShift

	if aCenter <= bCenter {
		*aPos -= aShift
		*bPos += bShift
		return
	}

	*aPos += aShift
	*bPos -= bShift
}

func clampSpriteToStage(sprite *Sprite) {
	if sprite.RRect.X < stage.X {
		sprite.RRect.X = stage.X
	}
	if sprite.RRect.X+sprite.RRect.Width > stage.X+stage.Width {
		sprite.RRect.X = stage.X + stage.Width - sprite.RRect.Width
	}
	if sprite.RRect.Y < stage.Y {
		sprite.RRect.Y = stage.Y
	}
	if sprite.RRect.Y+sprite.RRect.Height > stage.Y+stage.Height {
		sprite.RRect.Y = stage.Y + stage.Height - sprite.RRect.Height
	}
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

type quadTree struct {
	boundary       Rect
	sprites        []Sprite
	children       [4]*quadTree
	depth          int
	maxDepth       int
	maxNodeSprites int
}

func newQuadTree(boundary Rect, depth int, maxDepth int, maxNodeSprites int) *quadTree {
	return &quadTree{
		boundary:       boundary,
		sprites:        make([]Sprite, 0, maxNodeSprites),
		depth:          depth,
		maxDepth:       maxDepth,
		maxNodeSprites: maxNodeSprites,
	}
}

func (q *quadTree) insert(sprite Sprite) {
	if !overlap(q.boundary, sprite.RRect) {
		return
	}

	if q.children[0] != nil {
		idx := q.getChildIndex(sprite.RRect)
		if idx != -1 {
			q.children[idx].insert(sprite)
			return
		}
	}

	q.sprites = append(q.sprites, sprite)

	if len(q.sprites) > q.maxNodeSprites && q.depth < q.maxDepth {
		if q.children[0] == nil {
			q.split()
		}

		i := 0
		for i < len(q.sprites) {
			idx := q.getChildIndex(q.sprites[i].RRect)
			if idx == -1 {
				i++
				continue
			}

			moved := q.sprites[i]
			q.sprites = append(q.sprites[:i], q.sprites[i+1:]...)
			q.children[idx].insert(moved)
		}
	}
}

func (q *quadTree) split() {
	halfW := q.boundary.Width / 2
	halfH := q.boundary.Height / 2
	x := q.boundary.X
	y := q.boundary.Y
	nextDepth := q.depth + 1

	q.children[0] = newQuadTree(
		Rect{X: x, Y: y, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.children[1] = newQuadTree(
		Rect{X: x + halfW, Y: y, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.children[2] = newQuadTree(
		Rect{X: x, Y: y + halfH, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
	q.children[3] = newQuadTree(
		Rect{X: x + halfW, Y: y + halfH, Width: halfW, Height: halfH},
		nextDepth,
		q.maxDepth,
		q.maxNodeSprites,
	)
}

func (q *quadTree) getChildIndex(rect Rect) int {
	verticalMid := q.boundary.X + q.boundary.Width/2
	horizontalMid := q.boundary.Y + q.boundary.Height/2

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
	if !overlap(q.boundary, rect) {
		return out
	}

	out = append(out, q.sprites...)

	if q.children[0] == nil {
		return out
	}

	idx := q.getChildIndex(rect)
	if idx != -1 {
		return q.children[idx].retrieve(rect, out)
	}

	for _, child := range q.children {
		out = child.retrieve(rect, out)
	}

	return out
}

func quadTreeCollisionDetection(boundary Rect, sprites []Sprite) []CollisionPair {
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
		candidates := qt.retrieve(sprite.RRect, nil)
		for _, other := range candidates {
			if sprite.ID >= other.ID {
				continue
			}
			if !overlap(sprite.RRect, other.RRect) {
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

	return collisions
}
