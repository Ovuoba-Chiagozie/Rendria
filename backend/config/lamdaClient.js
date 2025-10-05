import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const isLocal = process.env.NODE_ENV !== "production";

let lambdaClient;
if (!isLocal) {
  lambdaClient = new LambdaClient({ 
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
}

export const invokeLambda = async (payload = {}) => {
  if (isLocal) {
    console.log("Calling local SAM:", { payload });
    const res = await fetch("http://127.0.0.1:3000/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { statusCode: res.status, body: data };
  } else {
    console.log("Calling AWS Lambda (production)");
    try {
      const command = new InvokeCommand({
        FunctionName: process.env.RENDER_LAMBDA_NAME,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);
      const rawPayload = new TextDecoder("utf-8").decode(response.Payload);

      let parsed;
      try {
        parsed = JSON.parse(rawPayload);
      } catch {
        parsed = rawPayload;
      }

      console.log("Lambda response:", parsed);
      return parsed;
    } catch (err) {
      console.error("Error invoking Lambda:", err);
      throw err;
    }
  }
};