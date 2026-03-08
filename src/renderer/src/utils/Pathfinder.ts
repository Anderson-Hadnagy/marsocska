// src/renderer/src/utils/Pathfinder.ts

export type Point = { x: number; y: number }

class Node {
  x: number
  y: number
  gCost: number = 0 
  hCost: number = 0 
  parent: Node | null = null

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  get fCost(): number {
    return this.gCost + this.hCost
  }
}

// Kiszámítás 
function getDistance(nodeA: Node, nodeB: Node): number {
  const dstX = Math.abs(nodeA.x - nodeB.x)
  const dstY = Math.abs(nodeA.y - nodeB.y)
  // kerszre is mehet és 1 movment az is mert logic
  return Math.max(dstX, dstY) 
}

/**
 * Megkeresi a legrövidebb utat ('#').
 * @param grid 2D array of the map characters
 * @param start {x, y} starting coordinates (x=col, y=row)
 * @param target {x, y} target coordinates
 * @returns Array of Points representing the path, or null if no path exists
 */
export function findPath(grid: string[][], start: Point, target: Point): Point[] | null {
  const rows = grid.length
  const cols = grid[0].length

  const startNode = new Node(start.x, start.y)
  const targetNode = new Node(target.x, target.y)

  const openSet: Node[] = []
  const closedSet: Set<string> = new Set()

  openSet.push(startNode)

  while (openSet.length > 0) {
    let currentNode = openSet[0]
    let currentIndex = 0
    for (let i = 1; i < openSet.length; i++) {
      if (
        openSet[i].fCost < currentNode.fCost ||
        (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)
      ) {
        currentNode = openSet[i]
        currentIndex = i
      }
    }

    openSet.splice(currentIndex, 1)
    closedSet.add(`${currentNode.x},${currentNode.y}`)

    if (currentNode.x === targetNode.x && currentNode.y === targetNode.y) {
      const path: Point[] = []
      let current: Node | null = currentNode
      while (current !== null) {
        path.push({ x: current.x, y: current.y })
        current = current.parent
      }
      return path.reverse() 
    }

    // körülnéz
    const neighbors = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, // fel, le, balra, jobbra
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 } // kereszbe
    ]

    for (const offset of neighbors) {
      const checkX = currentNode.x + offset.x
      const checkY = currentNode.y + offset.y


      if (checkX < 0 || checkX >= cols || checkY < 0 || checkY >= rows) continue

      if (grid[checkY][checkX] === '#' || closedSet.has(`${checkX},${checkY}`)) continue

      const neighborNode = new Node(checkX, checkY)
      const newMovementCostToNeighbor = currentNode.gCost + 1

      const existingOpenNode = openSet.find((n) => n.x === checkX && n.y === checkY)

      if (newMovementCostToNeighbor < neighborNode.gCost || !existingOpenNode) {
        neighborNode.gCost = newMovementCostToNeighbor
        neighborNode.hCost = getDistance(neighborNode, targetNode)
        neighborNode.parent = currentNode

        if (!existingOpenNode) {
          openSet.push(neighborNode)
        } else {
          existingOpenNode.gCost = neighborNode.gCost
          existingOpenNode.parent = neighborNode.parent
        }
      }
    }
  }

  // No path 
  return null
}