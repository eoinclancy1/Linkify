import { ApifyClient } from 'apify-client';

let _client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!_client) {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error('APIFY_TOKEN environment variable is not set');
    }
    _client = new ApifyClient({ token });
  }
  return _client;
}

export interface ActorRunResult<T> {
  runId: string;
  items: T[];
}

export async function runActor<TInput, TOutput>(
  actorId: string,
  input: TInput,
): Promise<ActorRunResult<TOutput>> {
  const client = getClient();

  const run = await client.actor(actorId).call(input as Record<string, unknown>, {
    waitSecs: 300,
  });

  if (!run) {
    throw new Error(`Actor ${actorId} run failed to start`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return {
    runId: run.id,
    items: items as TOutput[],
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
