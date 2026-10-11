export type AiTaskType =
  | "resume_tailoring"
  | "job_matching"
  | "interview_questioning"
  | "interview_evaluation"
  | "proctoring_analysis";

export interface AiTaskRequest {
  taskType: AiTaskType;
  prompt: string;
  context?: Record<string, unknown>;
  modelHint?: string;
  temperature?: number;
}

export interface AiTaskResponse {
  provider: string;
  model: string;
  output: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  };
}

export interface AiProvider {
  name: string;
  runTask(request: AiTaskRequest): Promise<AiTaskResponse>;
}

export type ProviderName = "gemini" | "openai" | "anthropic";

export interface ProviderRegistry {
  gemini?: AiProvider;
  openai?: AiProvider;
  anthropic?: AiProvider;
}

const taskDefaults: Record<AiTaskType, ProviderName> = {
  resume_tailoring: "openai",
  job_matching: "openai",
  interview_questioning: "gemini",
  interview_evaluation: "gemini",
  proctoring_analysis: "gemini",
};

export function resolveProvider(
  taskType: AiTaskType,
  providers: ProviderRegistry
): AiProvider {
  const preferred = taskDefaults[taskType];
  const selected = providers[preferred];
  if (!selected) {
    throw new Error(`Missing provider adapter for task '${taskType}' (${preferred}).`);
  }
  return selected;
}

export async function runUnifiedAiTask(
  request: AiTaskRequest,
  providers: ProviderRegistry
): Promise<AiTaskResponse> {
  const provider = resolveProvider(request.taskType, providers);
  return provider.runTask(request);
}
