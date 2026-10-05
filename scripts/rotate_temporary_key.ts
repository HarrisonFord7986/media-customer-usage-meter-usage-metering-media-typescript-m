import { accountClientFromEnvironment } from "../src/infrai_account.js";

type CreatedKey = { key_id: string; key_secret: string };
type RotatedKey = { key_id: string; key: string };

const client = accountClientFromEnvironment();
const runId = `media-meter-${Date.now()}`;
const created = await client.createTemporaryKey(`${runId}-create`) as CreatedKey;
let rotated: RotatedKey | undefined;

try {
  // The plaintext key appears once. Store it now; it cannot be retrieved a second time.
  console.log(`Created temporary key ${created.key_id}; store the returned plaintext in your secret manager.`);
  rotated = await client.rotateTemporaryKey(created.key_id, `${runId}-rotate`) as RotatedKey;
  console.log("Rotated the temporary key with a one-hour overlap.");
} finally {
  await Promise.all([
    client.revokeTemporaryKey(created.key_id),
    ...(rotated ? [client.revokeTemporaryKey(`ifr_...${rotated.key.slice(-4)}`)] : [])
  ]);
  console.log("Revoked both temporary demonstration keys; the active INFRAI_API_KEY was untouched.");
}
