import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Undo2, Redo2, Trash2, Copy } from "lucide-react";

export default function InteractiveDrawingCanvas({ data, onUpdate, onClose }) {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState(() => generateInitialElements(data));
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [snapGuides, setSnapGuides] = useState([]);

  const scale = 20; // pixels per foot
  const canvasWidth = 800;
  const canvasHeight = 600;
  const gridSize = 10;

  // Save to history
  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  };

  const reset = () => {
    const fresh = generateInitialElements(data);
    saveToHistory(fresh);
    setSelectedElement(null);
  };

  const moveElement = (elementId, newX, newY) => {
    const snappedPos = snapToGrid(newX, newY);
    const updated = elements.map(el =>
      el.id === elementId ? { ...el, x: snappedPos.x, y: snappedPos.y } : el
    );
    saveToHistory(updated);
  };

  const snapToGrid = (x, y) => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };

  const deleteElement = (elementId) => {
    const updated = elements.filter(el => el.id !== elementId);
    saveToHistory(updated);
    setSelectedElement(null);
  };

  const duplicateElement = (elementId) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return;
    const newEl = {
      ...el,
      id: Date.now(),
      x: el.x + 20,
      y: el.y + 20,
    };
    saveToHistory([...elements, newEl]);
  };

  // Handle mouse down on element
  const handleMouseDown = (e, elementId) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const el = elements.find(e => e.id === elementId);
    if (!el) return;

    setSelectedElement(elementId);
    setDragging(true);
    setDragOffset({
      x: clickX - el.x,
      y: clickY - el.y,
    });
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!dragging || !selectedElement) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    moveElement(selectedElement, x, y);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }

    // Draw elements
    elements.forEach((el) => {
      const isSelected = el.id === selectedElement;
      ctx.globalAlpha = 1;

      switch (el.type) {
        case "deck":
          ctx.fillStyle = isSelected ? "#3b82f6" : "#94a3b8";
          ctx.fillRect(el.x, el.y, el.width, el.height);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 2;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          break;

        case "post":
          ctx.fillStyle = isSelected ? "#3b82f6" : "#8b4513";
          ctx.fillRect(el.x - 5, el.y - 5, 10, 10);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(el.x - 5, el.y - 5, 10, 10);
          break;

        case "stair":
          ctx.fillStyle = isSelected ? "#3b82f6" : "#d97706";
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.lineTo(el.x, el.y + el.height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;

        case "label":
          ctx.fillStyle = isSelected ? "#3b82f6" : "#374151";
          ctx.font = "11px Arial";
          ctx.textAlign = "left";
          ctx.fillText(el.text, el.x, el.y);
          break;

        case "dimension":
          ctx.strokeStyle = isSelected ? "#3b82f6" : "#6b7280";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y);
          ctx.stroke();
          ctx.fillStyle = "#374151";
          ctx.font = "9px Arial";
          ctx.textAlign = "center";
          ctx.fillText(el.text, el.x + el.width / 2, el.y - 5);
          break;
      }

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        if (el.type === "deck" || el.type === "stair") {
          ctx.strokeRect(el.x - 3, el.y - 3, el.width + 6, el.height + 6);
        } else if (el.type === "post") {
          ctx.strokeRect(el.x - 8, el.y - 8, 16, 16);
        }
        ctx.setLineDash([]);
      }
    });

    ctx.globalAlpha = 1;
  }, [elements, selectedElement, canvasWidth, canvasHeight]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Interactive Drawing Editor</h3>
            <p className="text-xs text-muted-foreground">Drag elements to adjust. Grid snapping enabled.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex === 0}>
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex === history.length - 1}>
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-muted/20">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={(e) => {
              const rect = canvasRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const clicked = elements.find(el => {
                if (el.type === "deck" || el.type === "stair") {
                  return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
                } else if (el.type === "post") {
                  return x >= el.x - 10 && x <= el.x + 10 && y >= el.y - 10 && y <= el.y + 10;
                }
                return false;
              });
              if (clicked) handleMouseDown(e, clicked.id);
              else setSelectedElement(null);
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border-2 border-border bg-white cursor-move shadow-sm"
          />
        </div>

        {/* Tools */}
        {selectedElement && (
          <div className="p-3 border-t bg-muted/50 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => duplicateElement(selectedElement)}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteElement(selectedElement)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
            onUpdate({ elements });
            onClose();
          }}>
            Apply Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

function generateInitialElements(data) {
  const els = [];
  let id = 1;

  const baseX = 100;
  const baseY = 100;
  const scale = 20;

  // Deck outline
  if (data.deckWidth && data.deckDepth) {
    els.push({
      id: id++,
      type: "deck",
      x: baseX,
      y: baseY,
      width: data.deckWidth * scale,
      height: data.deckDepth * scale,
      label: "Deck",
    });
  }

  // Posts (4 corners + middle if large)
  const postPositions = [
    { x: baseX, y: baseY },
    { x: baseX + (data.deckWidth || 10) * scale, y: baseY },
    { x: baseX, y: baseY + (data.deckDepth || 10) * scale },
    { x: baseX + (data.deckWidth || 10) * scale, y: baseY + (data.deckDepth || 10) * scale },
  ];

  postPositions.forEach((pos) => {
    els.push({
      id: id++,
      type: "post",
      x: pos.x,
      y: pos.y,
      label: "Post",
    });
  });

  // Stairs
  if (data.numStairs) {
    els.push({
      id: id++,
      type: "stair",
      x: baseX + 50,
      y: baseY + (data.deckDepth || 10) * scale + 20,
      width: 40,
      height: 30,
      label: "Stairs",
    });
  }

  // Dimension labels
  if (data.deckWidth) {
    els.push({
      id: id++,
      type: "dimension",
      x: baseX,
      y: baseY - 20,
      width: data.deckWidth * scale,
      text: `${data.deckWidth}'`,
    });
  }

  if (data.deckDepth) {
    els.push({
      id: id++,
      type: "dimension",
      x: baseX - 30,
      y: baseY,
      width: data.deckDepth * scale,
      text: `${data.deckDepth}'`,
    });
  }

  return els;
}