export interface ScriptSegment {
  speaker: string;
  timestamp: string;
  text: string;
  seconds: number;
}

export interface EditSuggestion {
  id: string;
  start_time: string;
  end_time: string;
  text_chunk: string;
  context_before?: string;
  context_after?: string;
  reason: string;
  priority: number; // 1 to 4 based on user's criteria
  estimated_seconds: number;
  is_fine_edit: boolean; // if single word/sentence for legal/sensitive
}

export interface ProcessedScript {
  segments: ScriptSegment[];
  total_seconds: number;
}
