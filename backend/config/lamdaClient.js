import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const isLocal = process.env.NODE_ENV === "dev"; // or custom ENV flag

let lambdaClient;
if (!isLocal) {
  lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
}

export const invokeLambda = async (payload = {}) => {
  if (isLocal) {
    // call SAM local API
    console.log({ payload });
    const res = await fetch("http://127.0.0.1:3000/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { statusCode: res.status, body: data };
  } else {
    // call AWS Lambda in the cloud
    console.log("ran", "prod");
    try {
      const command = new InvokeCommand({
        FunctionName: process.env.RENDER_LAMBDA_NAME,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await lambdaClient.send(command);

      // Decode the raw payload
      const rawPayload = new TextDecoder("utf-8").decode(response.Payload);

      let parsed;
      try {
        parsed = JSON.parse(rawPayload);
      } catch {
        parsed = rawPayload; // sometimes Lambda returns plain string
      }

      // Log the full response for debugging
      console.log("Lambda raw response:", response);
      console.log("Lambda payload:", parsed);

      return parsed;
    } catch (err) {
      console.error("Error invoking Lambda:", err);
      throw err;
    }
  }
};
