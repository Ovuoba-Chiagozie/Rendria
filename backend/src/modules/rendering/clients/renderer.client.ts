import { Injectable } from '@nestjs/common';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { env } from '../../../config';

@Injectable()
export class RendererClient {
  private readonly lambda = env.awsRegion
    ? new LambdaClient({ region: env.awsRegion })
    : undefined;
  async render(job: Record<string, unknown>) {
    let raw: Uint8Array | string;
    if (env.production) {
      if (!this.lambda || !env.renderLambdaName)
        throw new Error('renderer is not configured');
      raw =
        (
          await this.lambda.send(
            new InvokeCommand({
              FunctionName: env.renderLambdaName,
              Payload: Buffer.from(JSON.stringify(job)),
            }),
          )
        ).Payload || new Uint8Array();
    } else {
      const r = await fetch(`${env.samRenderUrl.replace(/\/$/, '')}/render`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(job),
        signal: AbortSignal.timeout(55_000),
      });
      if (!r.ok) throw new Error(`renderer status ${r.status}`);
      raw = await r.text();
    }
    let parsed: unknown = JSON.parse(Buffer.from(raw).toString());
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (typeof parsed === 'object' && parsed && 'body' in parsed) {
      const body = parsed.body;
      parsed = typeof body === 'string' ? JSON.parse(body) : body;
    }
    const result = parsed as { url?: string; renderId?: string };
    if (!result.url || !result.renderId)
      throw new Error('renderer response missing url/renderId');
    return result as { url: string; renderId: string };
  }
}
