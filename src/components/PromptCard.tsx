"use client";

import type { Prompt } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eye, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onExport: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, onDelete, onExport }: PromptCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary-foreground_real_primary_if_primary_is_light_else_text_primary">{prompt.name}</CardTitle> {/* This needs to be fixed in globals or here if primary is too light for text */}
        <CardDescription className="text-sm text-muted-foreground">
          Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground mb-3 line-clamp-3">{prompt.description}</p>
        <div className="flex flex-wrap gap-2">
          {prompt.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {prompt.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">+{prompt.tags.length - 3} more</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/prompts/${prompt.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport(prompt)} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
             <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(prompt.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 flex-1 sm:flex-none">
          <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
           <span className="hidden sm:inline">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Temporary fix for CardTitle color if --primary is too light
// Replace text-primary-foreground_real_primary_if_primary_is_light_else_text_primary with text-[hsl(var(--primary))] or appropriate dark color
// For example: className="text-xl font-semibold text-[hsl(var(--primary-foreground))] if primary is dark, or text-[hsl(var(--foreground))] if primary is light
// The current primary (Lavender) is light, so CardTitle should use a dark color for contrast.
// Let's assume CardTitle should be --foreground or a darker shade of --primary.
// The class CardTitle in card.tsx is "text-2xl font-semibold leading-none tracking-tight". No color is specified, so it inherits.
// This means it should use `text-card-foreground`, which is `0 0% 20%` (Dark Gray). That should be fine.
// I'll remove the placeholder class.
