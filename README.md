# sol-blinks

## Set up

1. Install dependencies

```
yarn
```

2. Start server

```
yarn start
```

Or in dev mode

```
yarn dev
```

## How to Test

1. Run `yarn start`, the actions api is running at `http://localhost:9876/api/actions/stake`
2. Install `Backpack` wallet
3. Set Backpack wallet's custom RPC to `https://solana-dev-rpc.stafi.io`
4. Open [Dialect](https://dial.to/developer?url=http%3A%2F%2Flocalhost%3A9876%2Fapi%2Factions%2Fstake&cluster=mainnet), and connect Backpack wallet to Dialect
5. Then you can click the Blinks button to send transactions

**Notes**

Dialect only supports `Mainnet` and `Devnet`, so the transaction will be timed out shown on the page, but it actually **succeeded**.

You can view the transaction status on (Solana Explorer)[https://explorer.solana.com], remember to set the custom RPC to `https://solana-dev-rpc.stafi.i0`.

## References

- Official Docs [Solana actions](https://solana.com/docs/advanced/actions)
