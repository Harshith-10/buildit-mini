"use client";

import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DynamicListProps {
  items: { input: string; output: string }[];
  setItems: (items: { input: string; output: string }[]) => void;
  label: string;
}

export function DynamicList({ items, setItems, label }: DynamicListProps) {
  const addItem = () => {
    setItems([...items, { input: "", output: "" }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (
    index: number,
    field: "input" | "output",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex gap-4 items-start border p-4 rounded-md relative group"
        >
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground">Input</Label>
            <Textarea
              value={item.input}
              onChange={(e) => updateItem(index, "input", e.target.value)}
              placeholder="Input data..."
              className="font-mono text-xs"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground">Output</Label>
            <Textarea
              value={item.output}
              onChange={(e) => updateItem(index, "output", e.target.value)}
              placeholder="Expected output..."
              className="font-mono text-xs"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeItem(index)}
          >
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
          No items added.
        </div>
      )}
    </div>
  );
}
