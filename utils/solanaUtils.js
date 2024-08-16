import { Connection, PublicKey } from '@solana/web3.js';

export async function getSplTokenAccount(
  connection,
  userAddress,
  lsdTokenMintAddress
) {
  if (!userAddress) {
    return null;
  }
  try {
    const acc = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(userAddress),
      {
        mint: new PublicKey(lsdTokenMintAddress),
      }
    );

    if (acc.value && acc.value.length > 0) {
      return acc.value[0];
    }
  } catch (err) {
    return null;
  }

  return null;
}
