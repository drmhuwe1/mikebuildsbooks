import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STORAGE_KEY = "dashboard_card_order";
const DEFAULT_ORDER = ["active-jobs", "bills-due", "sub-payouts", "payout-summary"];

export default function DragDropCards({ cards }) {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setOrder(JSON.parse(saved));
      } catch (e) {
        setOrder(DEFAULT_ORDER);
      }
    }
  }, []);

  const sortedCards = useMemo(() => 
    order.map(id => cards[id]).filter(Boolean),
    [order, cards]
  );

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, moved);
    
    setOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  };

  if (!mounted) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-cards">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {sortedCards.map((card, idx) => (
              <Draggable key={card.id} draggableId={card.id} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`cursor-move ${snapshot.isDragging ? "opacity-50" : ""}`}
                  >
                    {card.component}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}