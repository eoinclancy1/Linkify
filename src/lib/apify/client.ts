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
  costUsd: number;
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

  // Fetch cost from the completed run details
  const costUsd = await getRunCost(run.id, items.length);

  return {
    runId: run.id,
    items: items as TOutput[],
    costUsd,
  };
}

/** Fetch the cost of a completed Apify run */
async function getRunCost(runId: string, itemCount: number): Promise<number> {
  try {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = await client.run(runId).get() as any;
    if (!run) return 0;

    // PAY_PER_EVENT actors have usageTotalUsd directly
    if (typeof run.usageTotalUsd === 'number') {
      return run.usageTotalUsd;
    }

    // PRICE_PER_DATASET_ITEM actors: calculate from price * item count
    if (run.pricingInfo?.pricePerUnitUsd) {
      return run.pricingInfo.pricePerUnitUsd * itemCount;
    }

    return 0;
  } catch {
    return 0;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
